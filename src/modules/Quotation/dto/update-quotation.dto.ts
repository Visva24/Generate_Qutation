import { PartialType } from '@nestjs/mapped-types';
import { QuotationFormDto } from './create-quotation.dto';

export class UpdateQuotationFormDto extends PartialType(QuotationFormDto) {}