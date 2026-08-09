/**
 * Passport JWT strategy — validates the `Authorization: Bearer <accessToken>`
 * header and produces the `AuthenticatedUser` attached to `req.user`.
 */
import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AppConfig } from '../../../shared/config/configuration';
import {
  AuthenticatedUser,
  JwtPayload,
} from '../../../shared/common/types/authenticated-user';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    @Inject(ConfigService) config: ConfigService<AppConfig, true>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get('jwt.accessSecret', { infer: true }),
    });
  }

  async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
    return {
      sub: payload.sub,
      email: payload.email,
      role: payload.role,
      nameEn: payload.nameEn,
      nameAr: payload.nameAr,
      status: payload.status,
    };
  }
}
