import { Module } from '@nestjs/common';
import { QuotationController } from './quotation.controller';
import { QuotationService } from './quotation.service';
import { SequelizeModule } from '@nestjs/sequelize';
import { documentDetailRepository, QuotationFormRepository, QuotationItemRepository, TempQuotationItemRepository } from './entity/quotation.entity';
import { HelperService } from 'src/common/services/helper/helper.service';
import { UserRepository } from '../authentication/entity/users.entity';

@Module({
   imports:[
      SequelizeModule.forFeature([QuotationFormRepository,documentDetailRepository,QuotationItemRepository,UserRepository,TempQuotationItemRepository]),
    ],
  controllers: [QuotationController],
  providers: [QuotationService,HelperService]
})
export class QuotationModule {}
