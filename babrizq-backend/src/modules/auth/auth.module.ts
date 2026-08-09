/**
 * Auth module — identity, JWT issuance, refresh-token rotation, RBAC strategy.
 */
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './presentation/auth.controller';
import { AuthService } from './application/auth.service';
import { TokenService } from './application/token.service';
import { JwtStrategy } from './infrastructure/jwt.strategy';
import { UserRepository } from './infrastructure/user.repository';
import { RefreshTokenRepository } from './infrastructure/refresh-token.repository';

@Module({
  imports: [
    ConfigModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    // Secrets are passed explicitly at sign-time in TokenService, so no
    // global JWT options are needed here.
    JwtModule.register({}),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    TokenService,
    JwtStrategy,
    UserRepository,
    RefreshTokenRepository,
  ],
  exports: [AuthService],
})
export class AuthModule {}
