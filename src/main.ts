import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as moment from 'moment-timezone';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as bodyParser from 'body-parser';
import { ValidationPipe } from '@nestjs/common';
import { join } from 'path';
import * as express from 'express';

async function bootstrap() {
  const port = 5001;
  const timezone = 'Asia/Kolkata';
  moment.tz.setDefault(timezone);

  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.enableCors();

  const options = new DocumentBuilder()
    .setTitle('ABShrms Private Limited')
    .setDescription('Node Migration')
    .setVersion('1.0')
    .build();

  const document = SwaggerModule.createDocument(app, options);
  SwaggerModule.setup('api', app, document);

  app.use(bodyParser.json({ limit: '10mb' }));
  app.use('/public/uploads/signatures', express.static('public/uploads/signatures'));
  app.use('/public', express.static(join(__dirname, '..', 'public')));
  app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));

  // Optional: Enable if you need validation globally
  // app.useGlobalPipes(new ValidationPipe({
  //   transform: true,
  //   whitelist: true,
  //   forbidNonWhitelisted: true,
  //   forbidUnknownValues: true,
  // }));

  // ✅ ✅ THIS IS THE CORRECT LISTEN LINE:
  await app.listen(port, '0.0.0.0', () => console.log(`app listening on port ${port}!`));
}
bootstrap();
