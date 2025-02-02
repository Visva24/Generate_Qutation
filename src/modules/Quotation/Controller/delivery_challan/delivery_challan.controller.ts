import { Body, Controller, Get, Param, Patch, Post, Query, Res } from '@nestjs/common';
import { ApiBody } from '@nestjs/swagger';
import { DeliveryChallanService } from '../../service/delivery_challan/delivery_challan.service';
import { ChallanListDto, deliveryChallanFormDto } from '../../dto/create-quotation.dto';
import { saveChallanListData, saveDeliveryChallanFormData, saveQuotationFormData, saveQuotationListData } from '../../sample/quotation.sample';
import { UpdateDeliveryChallanFormDto } from '../../dto/update-quotation.dto';


@Controller('delivery-challan')
export class DeliveryChallanController {

      constructor(
                private readonly deliveryChallanService: DeliveryChallanService,  
              ) { }
        
          @Get("get-delivery-challan-form-data")
          async getDeliveryChallanFormData(@Query("challan_id") challan_id:number,@Query("type") type:string):Promise<any>  {
            return await this.deliveryChallanService.getDeliveryChallanFormData(challan_id,type)
          }

          @Get("get-delivery-challan-form-history")
          async getDeliveryChallanFormHistory():Promise<any>  {
            return  await this.deliveryChallanService.getDeliveryChallanFormHistory()
          }
         
                  
    
          @ApiBody({
            schema: {
              type: 'array'
            },
            examples: {
              example: {
                value: saveDeliveryChallanFormData
              }
            }
        
          })
          @Post("create-delivery-challan-form")
          async createDeliveryChallanForm(@Body() deliveryChallanForm:deliveryChallanFormDto) :Promise<any> {
            return this.deliveryChallanService.createDeliveryChallanForm(deliveryChallanForm)
          }
    
          @ApiBody({
            schema: {
              type: 'array'
            },
            examples: {
              example: {
                value: saveDeliveryChallanFormData
              }
            }
        
          })
          @Patch("update-delivery-challan-form/:id")
          async updateDeliveryChallanForm(@Param('id')id :number,@Body() UpdateDeliveryChallanForm:UpdateDeliveryChallanFormDto) {
            return this.deliveryChallanService.updateDeliveryChallanForm(id,UpdateDeliveryChallanForm)
          }
          
       
         
          @Get("generate-delivery-challan-template")
          async generateDeliveryChallanTemplate(  @Res() res:Response,@Query('id') id :number) {
            return this.deliveryChallanService.generateDeliveryChallanTemplate(res,id)
          }
         
          @Get("download-delivery-challan-template")
          async downloadDeliveryChallanTemplate( @Query('id') id :number) {
            return this.deliveryChallanService.downloadDeliveryChallanTemplate(id)
          }

          @ApiBody({
            schema: {
              type: 'array'
            },
            examples: {
              example: {
                value: saveChallanListData
              }
            }
        
          })
          @Post("save-or-update-challan-list")
          async SaveOrUpdateDeliveryChallanList(@Body() data:{doc_number:string,challan_list:ChallanListDto[],record_id?:number} ) :Promise<any> {
            return this.deliveryChallanService.SaveOrUpdateDeliveryChallanList(data.doc_number,data.challan_list,data.record_id)
          }

          @Get("get-all-challan-list")
          async getAllDeliveryChallanList(@Query('doc_number') doc_number:string):Promise<any> {
            return this.deliveryChallanService.getAllDeliveryChallanList(doc_number)
          }
    
          
          @Get("delete-challan-list")
          async deleteDeliveryChallanList(@Query('record_id') record_id:number) :Promise<any> {
            return this.deliveryChallanService.deleteDeliveryChallanList(record_id)
          }

          @Get("get-single-challan-list")
          async getSingleDeliveryChallanList(@Query('record_id') record_id:number):Promise<any> {
            return this.deliveryChallanService.getSingleDeliveryChallanList(record_id)
          }

          @Get("reset-temp-Challan-list")
          async resetTempDeliveryChallanData(@Query('doc_number') doc_number:string):Promise<any> {
            return this.deliveryChallanService.resetTempDeliveryChallanData(doc_number)
          }
          @Get("move-forward-delivery-challan")
          async moveForwardDeliveryChallan(@Query('quotation_id') quotation_id:number):Promise<any> {
            return this.deliveryChallanService.moveForwardDeliveryChallan(quotation_id)
          }

}
