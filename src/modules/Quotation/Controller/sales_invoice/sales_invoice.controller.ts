import { Body, Controller, Get, Param, Patch, Post, Query, Res,Headers } from '@nestjs/common';
import { ApiBody, ApiTags } from '@nestjs/swagger';
import { SalesInvoiceService } from '../../service/sales_invoice/sales_invoice.service';
import { saveChallanListData, saveDeliveryChallanFormData, saveInvoiceFormData, saveInvoiceListData } from '../../sample/quotation.sample';
import { filterData, InvoiceFormDto, InvoiceListDto } from '../../dto/create-quotation.dto';
import { UpdateInvoiceFormDto } from '../../dto/update-quotation.dto';
import { filterDataSample } from 'src/modules/Authentication/sample/user.sample';
import { decodeAccessToken } from 'src/common/services/helper/helper.service';

@ApiTags('sales_invoice/sales-invoice')
@Controller('sales-invoice')
export class SalesInvoiceController {

        constructor(
                    private readonly SalesInvoiceService: SalesInvoiceService,  
                  ) { }
            
              @Get("invoice-customer-dropdown")
              async getSalesInvoiceCustomerDropDown():Promise<any>  {
                return await this.SalesInvoiceService.getSalesInvoiceCustomerDropDown()
              }
              @Get("get-sales-invoice-form-data")
              async getSalesInvoiceFormData(@Headers('Authorization') headers: any,@Query("Invoice_id") Invoice_id:number,@Query("type") type:string):Promise<any>  {
                 const token = await decodeAccessToken(headers);
                return await this.SalesInvoiceService.getSalesInvoiceFormData(token.user_id,Invoice_id,type)
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
              @Post("get-sales-invoice-form-history")
              async getSalesInvoiceFormHistory(@Body('filter_data') filter_data:filterData):Promise<any>  {
                return  await this.SalesInvoiceService.getSalesInvoiceFormHistory(filter_data)
              }
             
                      
        
              @ApiBody({
                schema: {
                  type: 'array'
                },
                examples: {
                  example: {
                    value: saveInvoiceFormData
                  }
                }
            
              })
              @Post("create-sales-invoice-form")
              async createSalesInvoiceForm(@Headers('Authorization') headers: any,@Body() InvoiceForm:InvoiceFormDto) :Promise<any> {
                const token = await decodeAccessToken(headers);
                return this.SalesInvoiceService.createSalesInvoiceForm(token.user_id,InvoiceForm)
              }
        
              @ApiBody({
                schema: {
                  type: 'array'
                },
                examples: {
                  example: {
                    value: saveInvoiceFormData
                  }
                }
            
              })
              @Patch("update-sales-invoice-form/:id")
              async updateSalesInvoiceForm(@Headers('Authorization') headers: any,@Param('id')id :number,@Body() UpdateInvoiceForm:UpdateInvoiceFormDto) {
                const token = await decodeAccessToken(headers);
                return this.SalesInvoiceService.updateSalesInvoiceForm(token.user_id,id,UpdateInvoiceForm)
              }
              
           
             
              @Get("generate-sales-invoice-template")
              async generateSalesInvoiceTemplate(  @Res() res:Response,@Query('id') id :number) {
                return this.SalesInvoiceService.generateSalesInvoiceTemplate(res,id)
              }
             
              @Get("download-sales-invoice-template")
              async downloadSalesInvoiceTemplate(@Headers('Authorization') headers: any, @Query('id') id :number) {
                const token = await decodeAccessToken(headers);
                return this.SalesInvoiceService.downloadSalesInvoiceTemplate(token.user_id,id)
              }
    
              @ApiBody({
                schema: {
                  type: 'array'
                },
                examples: {
                  example: {
                    value: saveInvoiceListData
                  }
                }
            
              })
              @Post("save-or-update-invoice-list")
              async SaveOrUpdateSalesInvoiceList(@Headers('Authorization') headers: any,@Body() data:{doc_number:string,invoice_list:InvoiceListDto[],record_id?:number} ) :Promise<any> {
                const token = await decodeAccessToken(headers);
                return this.SalesInvoiceService.SaveOrUpdateSalesInvoiceList(token.user_id,data.doc_number,data.invoice_list,data.record_id)
              }
    
              @Get("get-all-sales-invoice-list")
              async getAllSalesInvoiceList(@Headers('Authorization') headers: any,@Query('doc_number') doc_number:string,@Query('currency') currency:string):Promise<any> {
                const token = await decodeAccessToken(headers);
                return this.SalesInvoiceService.getAllSalesInvoiceList(token.user_id,doc_number,currency)
              }
        
              
              @Get("delete-sales-invoice-list")
              async deleteSalesInvoiceListItems(@Query('record_id') record_id:number) :Promise<any> {
                return this.SalesInvoiceService.deleteSalesInvoiceListItems(record_id)
              }
    
              @Get("get-single-invoice-list")
              async getSingleSalesInvoiceList(@Query('record_id') record_id:number):Promise<any> {
                return this.SalesInvoiceService.getSingleSalesInvoiceList(record_id)
              }
    
              @Get("reset-temp-sales-invoice-list")
              async resetTempSalesInvoiceData(@Headers('Authorization') headers: any,@Query('doc_number') doc_number:string):Promise<any> {
                const token = await decodeAccessToken(headers);
                return this.SalesInvoiceService.resetTempSalesInvoiceData(token.user_id,doc_number)
              }
              @Get("move-forward-sales-invoice")
              async moveForwardSalesInvoice(@Headers('Authorization') headers: any,@Query('quotation_id') quotation_id:number,@Query('current_user_id') current_user_id:number):Promise<any> {
                const token = await decodeAccessToken(headers);
                return this.SalesInvoiceService.moveForwardSalesInvoice(token.user_id,quotation_id,current_user_id)
              }

              @Get("duplicate-sales-item-records")
              async duplicateRecord(@Query('id') id: number,@Query('count') count: number) {
                return this.SalesInvoiceService.duplicateRecord(id,count)
              }
            
    
}
