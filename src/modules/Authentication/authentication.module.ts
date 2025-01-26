import { Module } from '@nestjs/common';
import { AuthenticationController } from './authentication.controller';
import { AuthenticationService } from './authentication.service';
import { UserRepository } from './entity/users.entity';
import { Sequelize } from 'sequelize';
import { SequelizeModule } from '@nestjs/sequelize';
import { JwtService } from '@nestjs/jwt';
import { HelperService } from 'src/common/services/helper/helper.service';

@Module({
  imports:[
    SequelizeModule.forFeature([UserRepository]),
  ],
  controllers: [AuthenticationController],
  providers: [AuthenticationService,JwtService,HelperService]
})
export class AuthenticationModule {}
  