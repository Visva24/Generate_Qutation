import { Module } from '@nestjs/common';
import { QuotationController } from './quotation.controller';
import { QuotationService } from './quotation.service';
import { SequelizeModule } from '@nestjs/sequelize';
import { QuotationFormRepository, QuotationListRepository } from './entity/quotation.entity';

@Module({
   imports:[
      SequelizeModule.forFeature([QuotationFormRepository,QuotationListRepository]),
    ],
  controllers: [QuotationController],
  providers: [QuotationService]
})
export class QuotationModule {}
