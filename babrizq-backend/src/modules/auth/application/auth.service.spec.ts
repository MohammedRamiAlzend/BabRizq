import * as bcrypt from 'bcryptjs';
import { AuthService } from './auth.service';
import { TokenService } from './token.service';
import { UserRepository } from '../infrastructure/user.repository';
import { RefreshTokenRepository } from '../infrastructure/refresh-token.repository';
import { GoogleAuthService } from '../infrastructure/google-auth.service';
import {
  AccountSuspendedError,
  EmailAlreadyRegisteredError,
  GoogleAuthError,
  InvalidCredentialsError,
} from '../domain/auth.errors';

const hashedPassword = bcrypt.hashSync('Password123!', 10);

const userRecord = {
  id: 'u1',
  email: 'customer@babrizq.com',
  passwordHash: hashedPassword,
  nameEn: 'Sara',
  nameAr: 'سارة',
  phone: null,
  role: 'customer',
  status: 'active',
  isAvailable: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const users = {
  findByEmail: jest.fn(),
  findById: jest.fn(),
  findByGoogleId: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
} as unknown as UserRepository;

const refreshTokens = {
  findByHash: jest.fn(),
  revoke: jest.fn(),
} as unknown as RefreshTokenRepository;

const tokens = {
  issueTokenPair: jest.fn().mockResolvedValue({ accessToken: 'a', refreshToken: 'r' }),
  hash: jest.fn((t: string) => `hash:${t}`),
} as unknown as TokenService;

const googleAuth = {
  verifyIdToken: jest.fn(),
  loginWithAuthorizationCode: jest.fn(),
  getAuthorizationUrl: jest.fn(),
} as unknown as GoogleAuthService;

const service = new AuthService(users, refreshTokens, tokens, googleAuth);

const googleProfile = {
  googleId: 'google-1',
  email: 'sara@gmail.com',
  emailVerified: true,
  name: 'Sara',
};

beforeEach(() => jest.clearAllMocks());

describe('AuthService.login', () => {
  it('returns a token pair for valid credentials', async () => {
    (users.findByEmail as jest.Mock).mockResolvedValue(userRecord);
    const pair = await service.login({ email: 'customer@babrizq.com', password: 'Password123!' });
    expect(pair).toEqual({ accessToken: 'a', refreshToken: 'r' });
  });

  it('rejects a wrong password', async () => {
    (users.findByEmail as jest.Mock).mockResolvedValue(userRecord);
    await expect(
      service.login({ email: 'customer@babrizq.com', password: 'wrong' }),
    ).rejects.toBeInstanceOf(InvalidCredentialsError);
  });

  it('rejects unknown emails', async () => {
    (users.findByEmail as jest.Mock).mockResolvedValue(null);
    await expect(
      service.login({ email: 'nobody@babrizq.com', password: 'Password123!' }),
    ).rejects.toBeInstanceOf(InvalidCredentialsError);
  });

  it('blocks suspended accounts', async () => {
    (users.findByEmail as jest.Mock).mockResolvedValue({ ...userRecord, status: 'suspended' });
    await expect(
      service.login({ email: 'customer@babrizq.com', password: 'Password123!' }),
    ).rejects.toBeInstanceOf(AccountSuspendedError);
  });
});

describe('AuthService.register', () => {
  it('rejects duplicate emails', async () => {
    (users.findByEmail as jest.Mock).mockResolvedValue(userRecord);
    await expect(
      service.register({
        email: 'customer@babrizq.com',
        password: 'Password123!',
        nameEn: 'Sara',
        nameAr: 'سارة',
        role: 'customer',
      }),
    ).rejects.toBeInstanceOf(EmailAlreadyRegisteredError);
  });

  it('creates the user and issues a token pair', async () => {
    (users.findByEmail as jest.Mock).mockResolvedValue(null);
    (users.create as jest.Mock).mockResolvedValue(userRecord);
    const pair = await service.register({
      email: 'customer@babrizq.com',
      password: 'Password123!',
      nameEn: 'Sara',
      nameAr: 'سارة',
      role: 'customer',
    });
    expect(pair).toEqual({ accessToken: 'a', refreshToken: 'r' });
    const created = (users.create as jest.Mock).mock.calls[0][0];
    expect(created.email).toBe('customer@babrizq.com');
    expect(created.passwordHash).not.toBe('Password123!'); // must be hashed
  });
});

describe('AuthService Google login', () => {
  it('creates a customer account for a first-time Google user', async () => {
    (users.findByGoogleId as jest.Mock).mockResolvedValue(null);
    (users.findByEmail as jest.Mock).mockResolvedValue(null);
    (users.create as jest.Mock).mockResolvedValue(userRecord);

    const pair = await service.loginWithGoogle(googleProfile);

    expect(pair).toEqual({ accessToken: 'a', refreshToken: 'r' });
    const created = (users.create as jest.Mock).mock.calls[0][0];
    expect(created).toEqual(
      expect.objectContaining({
        email: 'sara@gmail.com',
        googleId: 'google-1',
        role: 'customer',
        nameEn: 'Sara',
        nameAr: 'Sara',
      }),
    );
    // Password login must be impossible for Google-only accounts.
    expect(created.passwordHash).toMatch(/^[0-9a-f]{64}$/);
  });

  it('logs in an existing user by googleId without creating', async () => {
    (users.findByGoogleId as jest.Mock).mockResolvedValue(userRecord);

    const pair = await service.loginWithGoogle(googleProfile);

    expect(pair).toEqual({ accessToken: 'a', refreshToken: 'r' });
    expect(users.create).not.toHaveBeenCalled();
  });

  it('links googleId to an existing account with the same verified email', async () => {
    (users.findByGoogleId as jest.Mock).mockResolvedValue(null);
    (users.findByEmail as jest.Mock).mockResolvedValue(userRecord);

    const pair = await service.loginWithGoogle(googleProfile);

    expect(pair).toEqual({ accessToken: 'a', refreshToken: 'r' });
    expect(users.update).toHaveBeenCalledWith('u1', { googleId: 'google-1' });
    expect(users.create).not.toHaveBeenCalled();
  });

  it('refuses to link an unverified Google email to an existing account', async () => {
    (users.findByGoogleId as jest.Mock).mockResolvedValue(null);
    (users.findByEmail as jest.Mock).mockResolvedValue(userRecord);

    await expect(
      service.loginWithGoogle({ ...googleProfile, emailVerified: false }),
    ).rejects.toBeInstanceOf(GoogleAuthError);
    expect(users.update).not.toHaveBeenCalled();
  });

  it('blocks suspended Google accounts', async () => {
    (users.findByGoogleId as jest.Mock).mockResolvedValue({
      ...userRecord,
      status: 'suspended',
    });
    await expect(service.loginWithGoogle(googleProfile)).rejects.toBeInstanceOf(
      AccountSuspendedError,
    );
  });

  it('loginWithGoogleIdToken verifies the token then upserts the user', async () => {
    (googleAuth.verifyIdToken as jest.Mock).mockResolvedValue(googleProfile);
    (users.findByGoogleId as jest.Mock).mockResolvedValue(null);
    (users.findByEmail as jest.Mock).mockResolvedValue(null);
    (users.create as jest.Mock).mockResolvedValue(userRecord);

    const pair = await service.loginWithGoogleIdToken('jwt');

    expect(googleAuth.verifyIdToken).toHaveBeenCalledWith('jwt');
    expect(pair).toEqual({ accessToken: 'a', refreshToken: 'r' });
  });
});
