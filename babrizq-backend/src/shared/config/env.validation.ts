/**
 * Environment variables — validation schema.
 *
 * Used by `ConfigModule.forRoot({ validate })` so the app fails fast on a
 * missing/invalid variable instead of misbehaving at runtime. Every field has
 * a sensible default except where a value is genuinely required for
 * production (secrets keep dev defaults so `npm test` runs without a `.env`).
 */
import { plainToInstance } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Min, validateSync } from 'class-validator';

export enum Environment {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

export class EnvironmentVariables {
  @IsEnum(Environment)
  NODE_ENV: Environment = Environment.Development;

  @IsInt()
  @Min(1)
  PORT: number = 3000;

  @IsString()
  API_PREFIX: string = '/api';

  @IsString()
  API_VERSION: string = 'v1';

  /** Comma-separated list of allowed browser origins. */
  @IsOptional()
  @IsString()
  CORS_ORIGINS?: string;

  @IsString()
  DATABASE_URL: string = 'file:./dev.db';

  // --- JWT ---
  @IsString()
  JWT_ACCESS_SECRET: string = 'dev-access-secret-change-me';

  @IsString()
  JWT_ACCESS_EXPIRES_IN: string = '1h';

  @IsString()
  JWT_REFRESH_SECRET: string = 'dev-refresh-secret-change-me';

  @IsString()
  JWT_REFRESH_EXPIRES_IN: string = '7d';

  // --- Rate limiting ---
  @IsOptional()
  @IsInt()
  @Min(1)
  RATE_LIMIT_TTL_SECONDS: number = 60;

  @IsOptional()
  @IsInt()
  @Min(1)
  RATE_LIMIT_MAX_REQUESTS: number = 100;

  // --- Logging ---
  @IsOptional()
  @IsString()
  LOG_LEVEL: string = 'info';
}

/**
 * Validates the raw process env and returns a typed, normalized instance.
 * Throws with a descriptive error when validation fails.
 */
export function validate(config: Record<string, unknown>): EnvironmentVariables {
  const validated = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });
  const errors = validateSync(validated, { skipMissingProperties: false, whitelist: true });

  if (errors.length > 0) {
    const details = errors
      .map((e) => `${e.property}: ${Object.values(e.constraints ?? {}).join(', ')}`)
      .join('; ');
    throw new Error(`Invalid environment configuration — ${details}`);
  }
  return validated;
}
