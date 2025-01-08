import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { QuotationService } from './quotation.service';
import { QuotationFormDto } from './dto/create-quotation.dto';

@Controller('quotation')
export class QuotationController {

       constructor(
            private readonly quotationService: QuotationService,  
          ) { }
    
      @Get("get-quotation-form-data")
      async getQuotationFormData() {
        return this.quotationService.getQuotationFormData()
      }
      @Get("create-quotation-form")
      async createQuotationForm(@Body() QuotationForm:QuotationFormDto) {
        return this.quotationService.createQuotationForm(QuotationForm)
      }
      @Patch("update-quotation-form/:id")
      async updateQuotationForm(@Param('id')id :number,@Body() QuotationForm:QuotationFormDto) {
        return this.quotationService.updateQuotationForm(id,QuotationForm)
      }
}
