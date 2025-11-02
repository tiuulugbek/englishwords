import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import * as fs from 'fs';
import * as path from 'path';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS for Telegram WebApp
  app.enableCors({
    origin: true,
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(new ValidationPipe());

  // Swagger setup
  const config = new DocumentBuilder()
    .setTitle('Telegram Vocabulary Trainer API')
    .setDescription('API for English-Uzbek vocabulary learning')
    .setVersion('1.0')
    .addTag('vocabulary')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  // Preload words.json into memory
  const wordsPath = path.join(__dirname, '../words/words.json');
  if (fs.existsSync(wordsPath)) {
    const wordsData = fs.readFileSync(wordsPath, 'utf-8');
    const words = JSON.parse(wordsData);
    console.log(`Loaded ${words.length} words from JSON`);
  } else {
    console.warn('Warning: words.json not found at', wordsPath);
    console.warn('Current directory:', __dirname);
  }

  const port = process.env.BACKEND_PORT || 5005;
  await app.listen(port);
  console.log(`Backend running on port ${port}`);
  console.log(`Swagger docs available at http://localhost:${port}/api`);
}

bootstrap();
