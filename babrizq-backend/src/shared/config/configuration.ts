/**
 * Typed application configuration.
 *
 * Loaded through `ConfigModule` so every service can inject it via
 * `ConfigService<AppConfig, true>`. Keeps `process.env` access centralized —
 * services never touch env vars directly.
 *
 * `ConfigModule.load` factories receive no arguments, so this rebuilds the
 * typed `EnvironmentVariables` from `process.env` using the same class
 * (defaults + implicit conversion) that `validate()` uses; values were
 * already validated at boot.
 */
import { plainToInstance } from 'class-transformer';
import { EnvironmentVariables } from './env.validation';

export interface AppConfig {
  app: {
    env: string;
    port: number;
    apiPrefix: string;
    apiVersion: string;
    corsOrigins: string[];
  };
  jwt: {
    accessSecret: string;
    accessExpiresIn: string;
    refreshSecret: string;
    refreshExpiresIn: string;
  };
  throttle: { ttlSeconds: number; maxRequests: number };
  logging: { level: string };
}

export default (): AppConfig => {
  const env = plainToInstance(EnvironmentVariables, process.env, {
    enableImplicitConversion: true,
  });

  return {
    app: {
      env: env.NODE_ENV,
      port: env.PORT,
      apiPrefix: env.API_PREFIX,
      apiVersion: env.API_VERSION,
      corsOrigins: (env.CORS_ORIGINS ?? '')
        .split(',')
        .map((o) => o.trim())
        .filter(Boolean),
    },
    jwt: {
      accessSecret: env.JWT_ACCESS_SECRET,
      accessExpiresIn: env.JWT_ACCESS_EXPIRES_IN,
      refreshSecret: env.JWT_REFRESH_SECRET,
      refreshExpiresIn: env.JWT_REFRESH_EXPIRES_IN,
    },
    throttle: {
      ttlSeconds: env.RATE_LIMIT_TTL_SECONDS,
      maxRequests: env.RATE_LIMIT_MAX_REQUESTS,
    },
    logging: { level: env.LOG_LEVEL },
  };
};
