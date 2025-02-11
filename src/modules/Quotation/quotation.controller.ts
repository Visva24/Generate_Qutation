import { Body, Controller, Get, Param, Patch, Post, Query, Res } from '@nestjs/common';
import { QuotationService } from './quotation.service';
import { documentsDto, QuotationFormDto, QuotationListDto } from './dto/create-quotation.dto';
import { ApiBody, ApiTags } from '@nestjs/swagger';
import { saveDocumentDetails } from '../authentication/sample/user.sample';
import { saveQuotationFormData, saveQuotationListData, saveSignatureData } from './sample/quotation.sample';


@ApiTags('quotation')
@Controller('quotation')
export class QuotationController {

       constructor(
            private readonly quotationService: QuotationService,  
          ) { }
    
      @Get("get-customer-dropdown")
      async getQuotationCustomerDropDown():Promise<any>  {
        return await this.quotationService.getQuotationCustomerDropDown()
      }
      @Get("get-quotation-form-data")
      async getQuotationFormData(@Query("quotation_id") quotation_id:number,@Query("type") type:string):Promise<any>  {
        return await this.quotationService.getQuotationFormData(quotation_id,type)
      }
      @Get("get-quotation-form-history")
      async getQuotationFormHistory():Promise<any>  {
        return  await this.quotationService.getQuotationFormHistory()
      }

      @Get("generate-dynamic-doc-number")
      async generateDynamicDocNumber(@Query('doc_type') doc_type:string):Promise<any> {
        return this.quotationService.generateDynamicDocNumber(doc_type)
      }
      @Get("generate-revision-doc-number")
      async generateRevisionDocNumber(@Query('record_id') record_id:number):Promise<any> {
        return this.quotationService.generateRevisionDocNumber(record_id)
      }
      
      @Get("get-single-quotation-list")
      async getSingleQuotationList(@Query('record_id') record_id:number):Promise<any> {
        return this.quotationService.getSingleQuotationList(record_id)
      }
      @Get("get-all-quotation-list")
      async getAllQuotationList(@Query('doc_number') doc_number:string):Promise<any> {
        return this.quotationService.getAllQuotationList(doc_number)
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
      async SaveOrUpdateQuotationList(@Body() data:{doc_number:string,Quotation_list:QuotationListDto[],record_id?:number} ) :Promise<any> {
        return this.quotationService.SaveOrUpdateQuotationList(data.doc_number,data.Quotation_list,data.record_id)
      }

      @Get("delete-quotation-list")
      async deleteQuotationList(@Query('record_id') record_id:number) :Promise<any> {
        return this.quotationService.deleteQuotationList(record_id)
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
      async createQuotationForm(@Body() QuotationForm:QuotationFormDto) :Promise<any> {
        return this.quotationService.createQuotationForm(QuotationForm)
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
      async updateQuotationForm(@Query('id')id :number,@Body() QuotationForm:QuotationFormDto) {
        return this.quotationService.updateQuotationForm(id,QuotationForm)
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
      async createOrUpdateDocument(@Body() documentsDto:documentsDto[]) {
        return this.quotationService.createOrUpdateDocument(documentsDto)
      }

     
      @Get("generate-quotation-template")
      async generateQuotationTemplate(  @Res() res:Response,@Query('id') id :number) {
        return this.quotationService.generateQuotationTemplate(res,id)
      }
     
      @Get("download-quotation-template")
      async downloadQuotationTemplate( @Query('id') id :number) {
        return this.quotationService.downloadQuotationTemplate(id)
      }

      @Get("reset-quotation-list")
      async resetTempQuotationData( @Query('doc_number') doc_number :string) {
        return this.quotationService.resetTempQuotationData(doc_number)
      }
      @Get("get-user-Profile-details")
      async getUserProfileDetails( @Query('user_id') user_id :number) {
        return this.quotationService.getUserProfileDetails(user_id)
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
      async uploadUserDetails(@Body() signature: { user_id: string; signature: string,user_name:string }) {
        const filePath = await this.quotationService.uploadUserDetails(signature.user_id, signature.signature,signature.user_name);
        return await filePath;
      }
}
