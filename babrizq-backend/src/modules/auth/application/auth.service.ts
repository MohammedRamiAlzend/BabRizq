/**
 * Auth application service — use cases for authentication & token lifecycle.
 *
 * Throws domain errors (`./domain/auth.errors.ts`) which the presentation
 * layer maps to HTTP statuses.
 */
import { Injectable, Logger } from '@nestjs/common';
import { User } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { randomBytes } from 'node:crypto';
import { Role } from '../../../shared/common/roles';
import { AuthenticatedUser } from '../../../shared/common/types/authenticated-user';
import { UserRepository } from '../infrastructure/user.repository';
import { RefreshTokenRepository } from '../infrastructure/refresh-token.repository';
import {
  AccountSuspendedError,
  EmailAlreadyRegisteredError,
  GoogleAuthError,
  InvalidCredentialsError,
  InvalidRefreshTokenError,
} from '../domain/auth.errors';
import { TokenService, TokenPair } from './token.service';
import { LoginDto } from '../presentation/dto/login.dto';
import { RegisterDto } from '../presentation/dto/register.dto';
import {
  GoogleAuthService,
  GoogleProfile,
} from '../infrastructure/google-auth.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly users: UserRepository,
    private readonly refreshTokens: RefreshTokenRepository,
    private readonly tokens: TokenService,
    private readonly googleAuth: GoogleAuthService,
  ) {}

  /** Validates credentials and issues a token pair. */
  async login(dto: LoginDto): Promise<TokenPair> {
    const user = await this.users.findByEmail(dto.email.toLowerCase());
    if (!user || !(await bcrypt.compare(dto.password, user.passwordHash))) {
      throw new InvalidCredentialsError();
    }
    this.assertActive(user);
    return this.tokens.issueTokenPair(this.toAuthenticatedUser(user));
  }

  /** Creates a customer/store-owner account and logs it in. */
  async register(dto: RegisterDto): Promise<TokenPair> {
    const email = dto.email.toLowerCase();
    if (await this.users.findByEmail(email)) {
      throw new EmailAlreadyRegisteredError();
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.users.create({
      email,
      passwordHash,
      nameEn: dto.nameEn,
      nameAr: dto.nameAr,
      phone: dto.phone ?? null,
      role: dto.role as Role,
    });
    this.logger.log(`New account registered: ${email} (${dto.role})`);
    return this.tokens.issueTokenPair(this.toAuthenticatedUser(user));
  }

  /** Rotates a refresh token (revoke old, issue new pair). */
  async refresh(rawRefreshToken: string): Promise<TokenPair> {
    const record = await this.refreshTokens.findByHash(
      this.tokens.hash(rawRefreshToken),
    );
    if (
      !record ||
      record.revokedAt !== null ||
      record.expiresAt.getTime() < Date.now()
    ) {
      throw new InvalidRefreshTokenError();
    }
    if (record.user.status !== 'active') {
      throw new AccountSuspendedError();
    }

    await this.refreshTokens.revoke(record.id);
    const user = await this.users.findById(record.user.id);
    if (!user) throw new InvalidRefreshTokenError();
    return this.tokens.issueTokenPair(this.toAuthenticatedUser(user));
  }

  /** Revokes a refresh token (logout). */
  async logout(rawRefreshToken: string): Promise<void> {
    const record = await this.refreshTokens.findByHash(
      this.tokens.hash(rawRefreshToken),
    );
    if (record) await this.refreshTokens.revoke(record.id);
  }

  /** Returns the current user without the password hash. */
  async me(userId: string): Promise<Omit<User, 'passwordHash'>> {
    const user = await this.users.findById(userId);
    if (!user) throw new InvalidCredentialsError();
    const { passwordHash: _ignored, ...safe } = user;
    return safe;
  }

  // -------------------------------------------------------------------
  // Google login
  // -------------------------------------------------------------------

  /** Builds the Google consent URL (redirect flow entry point). */
  getGoogleAuthorizationUrl(state?: string): string {
    return this.googleAuth.getAuthorizationUrl(state);
  }

  /** SPA flow: verify a Google id_token, then upsert + log in the user. */
  async loginWithGoogleIdToken(idToken: string): Promise<TokenPair> {
    const profile = await this.googleAuth.verifyIdToken(idToken);
    return this.loginWithGoogle(profile);
  }

  /** Redirect flow: exchange the one-time code, then upsert + log in. */
  async loginWithGoogleAuthorizationCode(code: string): Promise<TokenPair> {
    const profile = await this.googleAuth.loginWithAuthorizationCode(code);
    return this.loginWithGoogle(profile);
  }

  /**
   * Finds or creates the local account for a verified Google profile:
   *   1. existing user with the same googleId → log them in
   *   2. existing user with the same (verified) email → link googleId
   *   3. otherwise → create a customer account
   */
  async loginWithGoogle(profile: GoogleProfile): Promise<TokenPair> {
    const byGoogleId = await this.users.findByGoogleId(profile.googleId);
    if (byGoogleId) {
      this.assertActive(byGoogleId);
      return this.tokens.issueTokenPair(this.toAuthenticatedUser(byGoogleId));
    }

    const email = profile.email.toLowerCase();
    const existing = await this.users.findByEmail(email);
    if (existing) {
      // Only link a Google identity to an email we know Google verified —
      // otherwise anyone with the same email string could take the account.
      if (!profile.emailVerified) {
        throw new GoogleAuthError('Google account email is not verified');
      }
      await this.users.update(existing.id, { googleId: profile.googleId });
      this.assertActive(existing);
      this.logger.log(`Google identity linked to existing account: ${email}`);
      return this.tokens.issueTokenPair(this.toAuthenticatedUser(existing));
    }

    const user = await this.users.create({
      email,
      // Not a valid bcrypt hash — password login is disabled for this account.
      passwordHash: randomBytes(32).toString('hex'),
      googleId: profile.googleId,
      nameEn: profile.name,
      nameAr: profile.name,
      phone: null,
      role: 'customer',
    });
    this.logger.log(`New Google account created: ${email}`);
    return this.tokens.issueTokenPair(this.toAuthenticatedUser(user));
  }

  private assertActive(user: User): void {
    if (user.status !== 'active') throw new AccountSuspendedError();
  }

  private toAuthenticatedUser(user: User): AuthenticatedUser {
    return {
      sub: user.id,
      email: user.email,
      role: user.role as Role,
      nameEn: user.nameEn,
      nameAr: user.nameAr,
      status: user.status as 'active' | 'suspended',
    };
  }
}
