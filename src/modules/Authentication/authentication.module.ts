import { Module } from '@nestjs/common';
import { AuthenticationController } from './authentication.controller';
import { AuthenticationService } from './authentication.service';
import { UserRepository } from './entity/users.entity';
import { Sequelize } from 'sequelize';
import { SequelizeModule } from '@nestjs/sequelize';

@Module({
  imports:[
    SequelizeModule.forFeature([UserRepository]),
  ],
  controllers: [AuthenticationController],
  providers: [AuthenticationService]
})
export class AuthenticationModule {}
