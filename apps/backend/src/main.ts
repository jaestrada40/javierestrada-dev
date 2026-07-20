import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import type { NextFunction, Request, Response } from 'express';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  // Detrás de nginx/Coolify: respetar X-Forwarded-For para throttling por IP real
  app.set('trust proxy', 1);
  app.use(helmet());
  const allowedOrigins = process.env.CORS_ORIGINS?.split(',').map((item) => item.trim()) ?? [
    'https://javierestrada.dev',
    'http://localhost:4200',
  ];
  app.use((request: Request, response: Response, next: NextFunction) => {
    if (
      process.env.NODE_ENV === 'production' &&
      ['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method) &&
      request.path.startsWith('/api/') &&
      (!request.headers.origin || !allowedOrigins.includes(request.headers.origin))
    ) {
      response.status(403).json({ statusCode: 403, message: 'Origen no permitido' });
      return;
    }
    next();
  });
  app.setGlobalPrefix('api');
  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
  });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
