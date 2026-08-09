/**
 * Bab Rizq backend — bootstrap.
 *
 * Sets up security headers, CORS, the `/api/v1` prefix, global validation,
 * structured request logging (pino-http with per-request correlation id),
 * and Swagger at `/docs`.
 */
import 'reflect-metadata';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { pinoHttp } from 'pino-http';
import { AppModule } from './app.module';
import { AppConfig } from './shared/config/configuration';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  const config = app.get(ConfigService<AppConfig, true>);
  const logger = new Logger('Bootstrap');

  // ---- Security ----
  app.use(helmet());
  app.enableCors({
    origin: config.get('app.corsOrigins', { infer: true }),
    credentials: true,
  });

  // ---- Request logging (pino-http attaches `req.id` for correlation) ----
  app.use(
    pinoHttp({
      level: config.get('logging.level', { infer: true }),
      autoLogging: { ignore: (req) => req.url?.startsWith('/health') ?? false },
    }),
  );

  // ---- Global routing & validation ----
  const apiPrefix = config.get('app.apiPrefix', { infer: true });
  const apiVersion = config.get('app.apiVersion', { infer: true });
  app.setGlobalPrefix(`${apiPrefix}/${apiVersion}`);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // strip unknown DTO properties
      transform: true, // coerce query/body types (page=1 → number)
      forbidNonWhitelisted: false,
    }),
  );

  // ---- Swagger ----
  const documentConfig = new DocumentBuilder()
    .setTitle('Bab Rizq API')
    .setDescription(
      'Platform backend for the six role apps (customer, store-owner, back-office, delivery, marketer, admin). See docs/analysis.md for the ERD.',
    )
    .setVersion('0.1.0')
    .addBearerAuth()
    .addTag('Auth')
    .addTag('Health')
    .build();
  const document = SwaggerModule.createDocument(app, documentConfig);
  SwaggerModule.setup('docs', app, document);

  // ---- Shutdown hooks (Prisma disconnect on SIGTERM) ----
  app.enableShutdownHooks();

  const port = config.get('app.port', { infer: true });
  await app.listen(port, '0.0.0.0');
  logger.log(`API ready at http://localhost:${port}/${apiPrefix}/${apiVersion}`);
  logger.log(`Swagger at http://localhost:${port}/docs`);
}

void bootstrap();
