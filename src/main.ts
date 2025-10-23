import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  
  app.enableCors();

  
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true, 
      transform: true, 
    }),
  );

  
  const config = new DocumentBuilder()
    .setTitle('Booking System API')
    .setDescription('API for class booking system with credit management')
    .setVersion('1.0')
    .addBearerAuth() 
    .addTag('auth', 'Authentication endpoints')
    .addTag('users', 'User management endpoints')
    .addTag('classes', 'Class management endpoints')
    .addTag('bookings', 'Booking management endpoints')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port);

  console.log(`
  🚀 Application is running!
  📝 API Documentation: http://localhost:${port}/api/docs
  🔗 API Base URL: http://localhost:${port}
  `);
}
bootstrap();