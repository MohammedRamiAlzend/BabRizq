/**
 * Auth application service — use cases for authentication & token lifecycle.
 *
 * Throws domain errors (`./domain/auth.errors.ts`) which the presentation
 * layer maps to HTTP statuses.
 */
import { Injectable, Logger } from '@nestjs/common';
import { User } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { Role } from '../../../shared/common/roles';
import { AuthenticatedUser } from '../../../shared/common/types/authenticated-user';
import { UserRepository } from '../infrastructure/user.repository';
import { RefreshTokenRepository } from '../infrastructure/refresh-token.repository';
import {
  AccountSuspendedError,
  EmailAlreadyRegisteredError,
  InvalidCredentialsError,
  InvalidRefreshTokenError,
} from '../domain/auth.errors';
import { TokenService, TokenPair } from './token.service';
import { LoginDto } from '../presentation/dto/login.dto';
import { RegisterDto } from '../presentation/dto/register.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly users: UserRepository,
    private readonly refreshTokens: RefreshTokenRepository,
    private readonly tokens: TokenService,
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
