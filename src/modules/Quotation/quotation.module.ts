import { Module } from '@nestjs/common';
import { QuotationController } from './quotation.controller';
import { QuotationService } from './quotation.service';
import { SequelizeModule } from '@nestjs/sequelize';
import { documentDetailRepository, QuotationFormRepository, QuotationItemRepository, TempQuotationItemRepository } from './entity/quotation.entity';
import { HelperService } from 'src/common/services/helper/helper.service';
import { UserRepository } from '../authentication/entity/users.entity';
import { SalesInvoiceFormRepository, SalesItemRepository, TempSalesItemRepository } from './entity/sales_invoice.entity';
import { deliveryChallanRepository, DeliveryItemRepository, TempDeliveryItemRepository } from './entity/delivery_challan.entity';
import { deliveryChallanFormDto } from './dto/create-quotation.dto';
import { SalesInvoiceService } from './service/sales_invoice/sales_invoice.service';
import { DeliveryChallanService } from './service/delivery_challan/delivery_challan.service';

@Module({
   imports:[
      SequelizeModule.forFeature([QuotationFormRepository,documentDetailRepository,QuotationItemRepository,UserRepository,TempQuotationItemRepository,SalesInvoiceFormRepository,SalesItemRepository,TempSalesItemRepository,TempDeliveryItemRepository,deliveryChallanRepository,DeliveryItemRepository]),
    ],
  controllers: [QuotationController,],
  providers: [QuotationService,HelperService,SalesInvoiceService,DeliveryChallanService]
})
export class QuotationModule {}
