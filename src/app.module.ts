import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { JwtMiddleware } from './common/middleware/jwt.middleware';
import { SequelizeModule } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize';
import generateSequelizeOptions from './common/db-config/db.const';
import { JwtService } from '@nestjs/jwt';
import { HelperService } from './common/services/helper/helper.service';
import { AuthenticationModule } from './modules/Authentication/authentication.module';
import { UserRepository } from './modules/Authentication/entity/users.entity';
import { QuotationModule } from './modules/Quotation/quotation.module';




@Module({
  imports: [AuthenticationModule,
    SequelizeModule.forFeature([UserRepository]),
    SequelizeModule.forRootAsync({
      useFactory: generateSequelizeOptions,
    }),
    QuotationModule,
  ],

  controllers: [AppController],
  providers: [AppService, JwtService, HelperService],


})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // consumer.apply(JwtMiddleware).forRoutes('*');
  }
}
