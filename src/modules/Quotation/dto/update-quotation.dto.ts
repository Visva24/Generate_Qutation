import { PartialType } from '@nestjs/mapped-types';
import { deliveryChallanFormDto, InvoiceFormDto, QuotationFormDto } from './create-quotation.dto';

export class UpdateQuotationFormDto extends PartialType(QuotationFormDto) {}
export class UpdateDeliveryChallanFormDto extends PartialType(deliveryChallanFormDto) {}
export class UpdateInvoiceFormDto extends PartialType(InvoiceFormDto) {}