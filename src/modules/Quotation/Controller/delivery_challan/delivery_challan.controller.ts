import { Body, Controller, Get, Param, Patch, Post, Query, Res,Headers } from '@nestjs/common';
import { ApiBody, ApiTags } from '@nestjs/swagger';
import { DeliveryChallanService } from '../../service/delivery_challan/delivery_challan.service';
import { ChallanListDto, deliveryChallanFormDto, filterData } from '../../dto/create-quotation.dto';
import { saveChallanListData, saveDeliveryChallanFormData, saveQuotationFormData, saveQuotationListData } from '../../sample/quotation.sample';
import { UpdateDeliveryChallanFormDto } from '../../dto/update-quotation.dto';
import { filterDataSample } from 'src/modules/Authentication/sample/user.sample';
import { decodeAccessToken } from 'src/common/services/helper/helper.service';
@ApiTags('delivery_challan/delivery-challan')
@Controller('delivery-challan')
export class DeliveryChallanController {

      constructor(
                private readonly deliveryChallanService: DeliveryChallanService,  
              ) { }
        
          @Get("delivery-challan-customer-dropdown")
          async getDeliveryChallanCustomerDropDown():Promise<any>  {
            return await this.deliveryChallanService.getDeliveryChallanCustomerDropDown()
          }
          @Get("get-delivery-challan-form-data")
          async getDeliveryChallanFormData(@Headers('Authorization') headers: any,@Query("challan_id") challan_id:number,@Query("type") type:string):Promise<any>  {
            const token = await decodeAccessToken(headers);
            return await this.deliveryChallanService.getDeliveryChallanFormData(token.user_id,challan_id,type)
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
          @Post("get-delivery-challan-form-history")
          async getDeliveryChallanFormHistory(@Body('filter_data') filter_data:filterData):Promise<any>  {
            return  await this.deliveryChallanService.getDeliveryChallanFormHistory(filter_data)
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
          async createDeliveryChallanForm(@Headers('Authorization') headers: any,@Body() deliveryChallanForm:deliveryChallanFormDto) :Promise<any> {
            const token = await decodeAccessToken(headers);
            return this.deliveryChallanService.createDeliveryChallanForm(token.user_id,deliveryChallanForm)
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
          async updateDeliveryChallanForm(@Headers('Authorization') headers: any,@Param('id')id :number,@Body() UpdateDeliveryChallanForm:UpdateDeliveryChallanFormDto) {
            const token = await decodeAccessToken(headers);
            return this.deliveryChallanService.updateDeliveryChallanForm(token.user_id,id,UpdateDeliveryChallanForm)
          }
          
       
         
          @Get("generate-delivery-challan-template")
          async generateDeliveryChallanTemplate(  @Res() res:Response,@Query('id') id :number) {
            return this.deliveryChallanService.generateDeliveryChallanTemplate(res,id)
          }
         
          @Get("download-delivery-challan-template")
          async downloadDeliveryChallanTemplate(@Headers('Authorization') headers: any, @Query('id') id :number) {
            const token = await decodeAccessToken(headers);
            return this.deliveryChallanService.downloadDeliveryChallanTemplate(token.user_id,id)
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
          async SaveOrUpdateDeliveryChallanList(@Headers('Authorization') headers: any,@Body() data:{doc_number:string,challan_list:ChallanListDto[],record_id?:number} ) :Promise<any> {
            const token = await decodeAccessToken(headers);
            return this.deliveryChallanService.SaveOrUpdateDeliveryChallanList(token.user_id,data.doc_number,data.challan_list,data.record_id)
          }

          @Get("get-all-challan-list")
          async getAllDeliveryChallanList(@Headers('Authorization') headers: any,@Query('doc_number') doc_number:string):Promise<any> {
            const token = await decodeAccessToken(headers);
            return this.deliveryChallanService.getAllDeliveryChallanList(token.user_id,doc_number)
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
          async resetTempDeliveryChallanData(@Headers('Authorization') headers: any,@Query('doc_number') doc_number:string):Promise<any> {
            const token = await decodeAccessToken(headers);
            return this.deliveryChallanService.resetTempDeliveryChallanData(token.user_id,doc_number)
          }
          @Get("move-forward-delivery-challan")
          async moveForwardDeliveryChallan(@Headers('Authorization') headers: any,@Query('quotation_id') quotation_id:number,@Query('current_user_id') current_user_id:number):Promise<any> {
            const token = await decodeAccessToken(headers);
            return this.deliveryChallanService.moveForwardDeliveryChallan(token.user_id,quotation_id,current_user_id)
          }
          @Get("duplicate-challan-item-records")
          async duplicateRecord(@Query('id') id: number,@Query('count') count: number) {
            return this.deliveryChallanService.duplicateRecord(id,count)
          }
        

}
