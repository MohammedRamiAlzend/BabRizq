/**
 * GoogleAuthService — OAuth 2.0 + OpenID Connect integration.
 *
 * Supports two login flows:
 *   1. SPA id-token flow — the browser obtains an id_token from Google
 *      Identity Services and POSTs it to `POST /api/v1/auth/google/token`;
 *      we verify it with Google's public keys and mint our own tokens.
 *   2. Authorization-code flow — the browser is redirected to Google's
 *      consent screen (`GET /api/v1/auth/google`), Google redirects back
 *      with a one-time `code`, which we exchange for tokens and verify.
 *
 * Uses the official `google-auth-library` — no passport strategy needed.
 * Misconfiguration (missing client id/secret) surfaces as
 * `GoogleAuthNotConfiguredError` (503); an invalid/expired token surfaces
 * as `GoogleAuthError` (401).
 */
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OAuth2Client } from 'google-auth-library';
import { AppConfig } from '../../../shared/config/configuration';
import {
  GoogleAuthError,
  GoogleAuthNotConfiguredError,
} from '../domain/auth.errors';

/** Normalized Google account identity extracted from a verified id_token. */
export interface GoogleProfile {
  googleId: string;
  email: string;
  /** Google only issues verified emails; we still enforce it defensively. */
  emailVerified: boolean;
  name: string;
  picture?: string;
}

@Injectable()
export class GoogleAuthService {
  private readonly client: OAuth2Client | null;

  constructor(
    private readonly config: ConfigService<AppConfig, true>,
  ) {
    const clientId = config.get('googleOAuth.clientId', { infer: true });
    const clientSecret = config.get('googleOAuth.clientSecret', { infer: true });
    const redirectUri = config.get('googleOAuth.callbackUrl', { infer: true });

    this.client =
      clientId && clientSecret
        ? new OAuth2Client(clientId, clientSecret, redirectUri)
        : null;
  }

  /** Whether GOOGLE_CLIENT_ID + GOOGLE_CLIENT_SECRET are configured. */
  get isConfigured(): boolean {
    return this.client !== null;
  }

  /**
   * Builds the Google consent-screen URL for the redirect flow.
   * @param state opaque CSRF token supplied by the SPA, echoed back in the callback
   */
  getAuthorizationUrl(state?: string): string {
    this.assertConfigured();
    return this.client!.generateAuthUrl({
      access_type: 'offline', // request a refresh token for offline exchanges
      scope: [
        'openid',
        'email',
        'profile',
      ],
      state,
      // Explicit so it never silently falls back to the constructor default.
      redirect_uri: this.config.get('googleOAuth.callbackUrl', { infer: true }),
    });
  }

  /**
   * Exchange an authorization code for tokens, then verify the embedded
   * id_token to obtain the Google profile.
   */
  async loginWithAuthorizationCode(code: string): Promise<GoogleProfile> {
    this.assertConfigured();
    const { tokens } = await this.client!.getToken(code);
    if (!tokens.id_token) {
      throw new GoogleAuthError('Google did not return an id_token');
    }
    return this.verifyIdToken(tokens.id_token);
  }

  /**
   * Verifies an id_token (SPA flow). Rejects expired tokens, tokens signed
   * for a different audience, and accounts whose email is not verified.
   */
  async verifyIdToken(idToken: string): Promise<GoogleProfile> {
    this.assertConfigured();
    try {
      const ticket = await this.client!.verifyIdToken({
        idToken,
        audience: this.config.get('googleOAuth.clientId', { infer: true }),
      });
      const payload = ticket.getPayload();
      if (!payload?.sub || !payload.email) {
        throw new GoogleAuthError('Google token is missing identity claims');
      }
      const emailVerified = payload.email_verified !== false;
      if (!emailVerified) {
        throw new GoogleAuthError('Google account email is not verified');
      }
      return {
        googleId: payload.sub,
        email: payload.email,
        emailVerified,
        name: payload.name?.trim() || payload.email.split('@')[0],
        picture: payload.picture,
      };
    } catch (error) {
      if (error instanceof GoogleAuthError) throw error;
      throw new GoogleAuthError('Invalid or expired Google token');
    }
  }

  private assertConfigured(): void {
    if (!this.client) {
      throw new GoogleAuthNotConfiguredError();
    }
  }
}
