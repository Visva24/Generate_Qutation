import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthenticationModule } from './modules/authentication/authentication.module';
import { JwtMiddleware } from './common/middleware/jwt.middleware';
import { SequelizeModule } from '@nestjs/sequelize';
import { UserRepository } from './modules/authentication/entity/users.entity';
import { Sequelize } from 'sequelize';
import generateSequelizeOptions from './common/db-config/db.const';
import { JwtService } from '@nestjs/jwt';
import { QuotationModule } from './modules/quotation/quotation.module';




@Module({
  imports: [AuthenticationModule,
    SequelizeModule.forFeature([UserRepository]),
    SequelizeModule.forRootAsync({
      useFactory: generateSequelizeOptions,
    }),
    QuotationModule,
  ],
  
  controllers: [AppController],
  providers: [AppService,JwtService],


})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // consumer.apply(JwtMiddleware).forRoutes('*');
  }
}
