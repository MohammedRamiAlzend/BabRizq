/**
 * Unit tests for GoogleAuthService — verifies id_token verification,
 * authorization-code exchange, and the not-configured error path.
 * The OAuth2Client is mocked so no network calls happen.
 */
import { ConfigService } from '@nestjs/config';
import { OAuth2Client } from 'google-auth-library';
import { GoogleAuthService } from './google-auth.service';
import {
  GoogleAuthError,
  GoogleAuthNotConfiguredError,
} from '../domain/auth.errors';
import { AppConfig } from '../../../shared/config/configuration';

// The factory returns a jest.fn()-based OAuth2Client whose instances expose
// module-scoped mock methods (shared across instances for easy resetting).
// Mocks are attached to `this` so jest records them in `.mock.instances`.
jest.mock('google-auth-library', () => {
  const verifyIdToken = jest.fn();
  const generateAuthUrl = jest.fn();
  const getToken = jest.fn();

  const OAuth2Client = jest.fn().mockImplementation(function (
    this: Record<string, unknown>,
  ) {
    this.verifyIdToken = verifyIdToken;
    this.generateAuthUrl = generateAuthUrl;
    this.getToken = getToken;
  });
  return { OAuth2Client };
});

type MockedClient = {
  verifyIdToken: jest.Mock;
  generateAuthUrl: jest.Mock;
  getToken: jest.Mock;
};

/** Returns the most recently constructed OAuth2Client mock instance. */
function lastClient(): MockedClient {
  const mock = OAuth2Client as unknown as jest.Mock;
  const instances = mock.mock.instances as MockedClient[];
  return instances[instances.length - 1];
}

beforeEach(() => {
  // Clears call history on the shared mocks + the constructor mock. Runs
  // before each test constructs its service, so instances are re-registered.
  jest.clearAllMocks();
});

const values = (overrides: Record<string, unknown> = {}) => ({
  'googleOAuth.clientId': 'test-client-id',
  'googleOAuth.clientSecret': 'test-client-secret',
  'googleOAuth.callbackUrl': 'http://localhost:3000/api/v1/auth/google/callback',
  'googleOAuth.frontendRedirectUrl': 'http://localhost:5173/auth/google/callback',
  ...overrides,
});

function makeService(env: Record<string, unknown>): GoogleAuthService {
  const config = {
    get: jest.fn((key: string) => env[key]),
  } as unknown as ConfigService<AppConfig, true>;
  return new GoogleAuthService(config);
}

const validPayload = {
  sub: 'google-123',
  email: 'sara@gmail.com',
  email_verified: true,
  name: 'Sara',
  picture: 'https://pics/p1.jpg',
};

describe('GoogleAuthService.verifyIdToken', () => {
  it('returns the normalized profile for a valid token', async () => {
    const service = makeService(values());
    lastClient().verifyIdToken.mockResolvedValue({
      getPayload: () => validPayload,
    });

    const profile = await service.verifyIdToken('jwt-token');

    expect(profile).toEqual({
      googleId: 'google-123',
      email: 'sara@gmail.com',
      emailVerified: true,
      name: 'Sara',
      picture: 'https://pics/p1.jpg',
    });
    expect(lastClient().verifyIdToken).toHaveBeenCalledWith({
      idToken: 'jwt-token',
      audience: 'test-client-id',
    });
  });

  it('falls back to the email local-part when the name is missing', async () => {
    const service = makeService(values());
    lastClient().verifyIdToken.mockResolvedValue({
      getPayload: () => ({ ...validPayload, name: null }),
    });

    const profile = await service.verifyIdToken('jwt-token');
    expect(profile.name).toBe('sara');
  });

  it('rejects unverified emails', async () => {
    const service = makeService(values());
    lastClient().verifyIdToken.mockResolvedValue({
      getPayload: () => ({ ...validPayload, email_verified: false }),
    });

    await expect(service.verifyIdToken('jwt-token')).rejects.toBeInstanceOf(
      GoogleAuthError,
    );
  });

  it('rejects invalid or expired tokens', async () => {
    const service = makeService(values());
    lastClient().verifyIdToken.mockRejectedValue(
      new Error('Token used too late'),
    );

    await expect(service.verifyIdToken('jwt-token')).rejects.toBeInstanceOf(
      GoogleAuthError,
    );
  });

  it('throws GoogleAuthNotConfiguredError when no client id/secret', async () => {
    const service = makeService(values({ 'googleOAuth.clientId': undefined }));
    await expect(service.verifyIdToken('jwt-token')).rejects.toBeInstanceOf(
      GoogleAuthNotConfiguredError,
    );
  });
});

describe('GoogleAuthService redirect flow', () => {
  it('builds a consent URL with the standard scopes and the given state', () => {
    const service = makeService(values());
    lastClient().generateAuthUrl.mockReturnValue(
      'https://accounts.google.com/o/oauth2/auth?...',
    );

    const url = service.getAuthorizationUrl('csrf-state');

    expect(url).toContain('accounts.google.com');
    expect(lastClient().generateAuthUrl).toHaveBeenCalledWith(
      expect.objectContaining({ state: 'csrf-state' }),
    );
    const { scope } = lastClient().generateAuthUrl.mock.calls[0][0] as {
      scope: string[];
    };
    expect(scope).toEqual(
      expect.arrayContaining(['openid', 'email', 'profile']),
    );
  });

  it('exchanges a code and verifies the returned id_token', async () => {
    const service = makeService(values());
    lastClient().getToken.mockResolvedValue({
      tokens: { id_token: 'jwt-token' },
    });
    lastClient().verifyIdToken.mockResolvedValue({
      getPayload: () => validPayload,
    });

    const profile = await service.loginWithAuthorizationCode('one-time-code');

    expect(lastClient().getToken).toHaveBeenCalledWith('one-time-code');
    expect(profile.googleId).toBe('google-123');
  });

  it('fails cleanly when Google omits the id_token', async () => {
    const service = makeService(values());
    lastClient().getToken.mockResolvedValue({ tokens: {} });

    await expect(
      service.loginWithAuthorizationCode('code'),
    ).rejects.toBeInstanceOf(GoogleAuthError);
  });
});
