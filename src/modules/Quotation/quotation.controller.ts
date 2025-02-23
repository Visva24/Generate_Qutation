import { Body, Controller, Get, Param, Patch, Post, Query, Res ,Headers} from '@nestjs/common';
import { QuotationService } from './quotation.service';
import { documentsDto, filterData, QuotationFormDto, QuotationListDto } from './dto/create-quotation.dto';
import { ApiBody, ApiTags } from '@nestjs/swagger';
import { saveQuotationFormData, saveQuotationListData, saveSignatureData } from './sample/quotation.sample';
import { filterDataSample, saveDocumentDetails } from '../Authentication/sample/user.sample';
import { decodeAccessToken } from 'src/common/services/helper/helper.service';


@ApiTags('quotation')
@Controller('quotation')
export class QuotationController {

  constructor(
    private readonly quotationService: QuotationService,
  ) { }

  @Get("get-customer-dropdown")
  async getQuotationCustomerDropDown(): Promise<any> {
    return await this.quotationService.getQuotationCustomerDropDown()
  }
  @Get("get-quotation-form-data")
  async getQuotationFormData(@Headers('Authorization') headers: any,@Query("quotation_id") quotation_id: number, @Query("type") type: string): Promise<any> {
    const token = await decodeAccessToken(headers);
    return await this.quotationService.getQuotationFormData(token.user_id,quotation_id, type)
  }
  @ApiBody({
    schema: {
      type: 'array'
    },
    examples: {
      example: {
        value: filterDataSample
      }
    }

  })
  @Post("get-quotation-form-history")
  async getQuotationFormHistory(@Body('filter_data') filter_data:filterData): Promise<any> {
    
    return await this.quotationService.getQuotationFormHistory(filter_data)
  }

  @Get("generate-dynamic-doc-number")
  async generateDynamicDocNumber(@Query('doc_type') doc_type: string): Promise<any> {
    return this.quotationService.generateDynamicDocNumber(doc_type)
  }
  @Get("generate-revision-doc-number")
  async generateRevisionDocNumber(@Query('record_id') record_id: number): Promise<any> {
    return this.quotationService.generateRevisionDocNumber(record_id)
  }

  @Get("get-single-quotation-list")
  async getSingleQuotationList(@Headers('Authorization') headers: any,@Query('record_id') record_id: number): Promise<any> {
    const token = await decodeAccessToken(headers);
    return this.quotationService.getSingleQuotationList(token.user_id,record_id)
  }
  @Get("get-all-quotation-list")
  async getAllQuotationList(@Headers('Authorization') headers: any,@Query('doc_number') doc_number: string, @Query('currency') currency: string): Promise<any> {
    const token = await decodeAccessToken(headers);
    return this.quotationService.getAllQuotationList(token.user_id,doc_number, currency)
  }

  @ApiBody({
    schema: {
      type: 'array'
    },
    examples: {
      example: {
        value: saveQuotationListData
      }
    }

  })
  @Post("save-or-update-quotation-list")
  async SaveOrUpdateQuotationList(@Headers('Authorization') headers: any,@Body() data: { doc_number: string, Quotation_list: QuotationListDto[], record_id?: number }): Promise<any> {
    const token = await decodeAccessToken(headers);
    return this.quotationService.SaveOrUpdateQuotationList(token.user_id,data.doc_number, data.Quotation_list, data.record_id)
  }

  @Get("delete-quotation-list")
  async deleteQuotationList(@Headers('Authorization') headers: any,@Query('record_id') record_id: number): Promise<any> {
    const token = await decodeAccessToken(headers);
    return this.quotationService.deleteQuotationList(token.user_id,record_id)
  }

  @ApiBody({
    schema: {
      type: 'array'
    },
    examples: {
      example: {
        value: saveQuotationFormData
      }
    }

  })
  @Post("create-quotation-form")
  async createQuotationForm(@Headers('Authorization') headers: any,@Body() QuotationForm: QuotationFormDto): Promise<any> {
    const token = await decodeAccessToken(headers);
    return this.quotationService.createQuotationForm(token.user_id,QuotationForm)
  }

  @ApiBody({
    schema: {
      type: 'array'
    },
    examples: {
      example: {
        value: saveQuotationFormData
      }
    }

  })
  @Post("update-quotation-form")
  async updateQuotationForm(@Headers('Authorization') headers: any,@Query('id') id: number, @Body() QuotationForm: QuotationFormDto) {
    const token = await decodeAccessToken(headers);
    return this.quotationService.updateQuotationForm(token.user_id,id, QuotationForm)
  }

  @ApiBody({
    schema: {
      type: 'array'
    },
    examples: {
      example: {
        value: saveDocumentDetails
      }
    }

  })
  @Post("create-or-update-document")
  async createOrUpdateDocument(@Body() documentsDto: documentsDto[]) {
    return this.quotationService.createOrUpdateDocument(documentsDto)
  }


  @Get("generate-quotation-template")
  async generateQuotationTemplate(@Res() res: Response, @Query('id') id: number) {
    return this.quotationService.generateQuotationTemplate(res, id)
  }

  @Get("download-quotation-template")
  async downloadQuotationTemplate(@Query('id') id: number,@Query('user_id') user_id: number) {
    return this.quotationService.downloadQuotationTemplate(id,user_id)
  }

  @Get("reset-quotation-list")
  async resetTempQuotationData(@Headers('Authorization') headers: any,@Query('doc_number') doc_number: string) {
    const token = await decodeAccessToken(headers);
    return this.quotationService.resetTempQuotationData(token.user_id,doc_number)
  }
  @Get("get-user-Profile-details")
  async getUserProfileDetails(@Query('user_id') user_id: number) {
    return this.quotationService.getUserProfileDetails(user_id)
  }
  @Get("duplicate-quotation-item-records")
  async duplicateRecord(@Query('id') id: number,@Query('count') count: number) {
    return this.quotationService.duplicateRecord(id,count)
  }

  @ApiBody({
    schema: {
      type: 'array'
    },
    examples: {
      example: {
        value: saveSignatureData
      }
    }

  })
  @Post('upload-user-details')
  async uploadUserDetails(@Body() signature: { user_id: string; signature: string, user_name: string }) {
    const filePath = await this.quotationService.uploadUserDetails(signature.user_id, signature.signature, signature.user_name);
    return await filePath;
  }
}



