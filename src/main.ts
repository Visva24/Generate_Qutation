import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as moment from 'moment-timezone';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as bodyParser from 'body-parser';
import { ValidationPipe } from '@nestjs/common';
import { join } from 'path';
import * as express from 'express';

async function bootstrap() {
  const port = 5000;
  // Set the default timezone for the entire application
  const timezone = 'Asia/Kolkata'; // India timezone
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
  app.use('/public', express.static(join(__dirname, '..', 'public')));
  app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));

  // app.useGlobalPipes(new ValidationPipe({
  //      transform: true,               // Automatically transform incoming data to DTO objects
  //      whitelist: true,               // Strips non-whitelisted properties from incoming DTO objects
  //   forbidNonWhitelisted: true,    // Throws an error if unexpected properties are found in incoming DTO objects
  //   forbidUnknownValues: true     // Throws an error if unexpected query parameters are found in request URLs
  
    // }));
  
  await app.listen(port, () => console.log(`app listening on port ${port}!`));
 
}
bootstrap();
