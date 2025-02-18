import { Injectable } from '@nestjs/common';
import { log } from 'node:console';
import { ApiResponse, responseMessageGenerator } from 'src/common/util/helper.config';
import { InjectModel } from '@nestjs/sequelize';
import * as moment from 'moment';
import { HelperService } from 'src/common/services/helper/helper.service';
import { DELIVERY_CHALLAN_UPLOAD_DIRECTORY, QUOTATION_UPLOAD_DIRECTORY } from 'src/common/app.constant';

import { readFileSync } from 'fs';
import { deliveryChallanRepository, DeliveryItemRepository, TempDeliveryItemRepository } from '../../entity/delivery_challan.entity';
import { UpdateDeliveryChallanFormDto, UpdateQuotationFormDto } from '../../dto/update-quotation.dto';
import { ChallanListDto, deliveryChallanFormDto, documentsDto, filterData, QuotationFormDto, QuotationListDto } from '../../dto/create-quotation.dto';
import { documentDetailRepository, QuotationFormRepository, QuotationItemRepository, TempQuotationItemRepository } from '../../entity/quotation.entity';
import { documentType } from '../../enum/quotation.enum';
import { QuotationService } from '../../quotation.service';
import { Op, Sequelize } from 'sequelize';
import { UserRepository } from 'src/modules/Authentication/entity/users.entity';

@Injectable()
export class DeliveryChallanService {

    constructor(
        @InjectModel(QuotationFormRepository) private QuotationFormModel: typeof QuotationFormRepository,
        @InjectModel(documentDetailRepository) private documentDetailModel: typeof documentDetailRepository,
        @InjectModel(QuotationItemRepository) private QuotationListModel: typeof QuotationItemRepository,
        @InjectModel(TempQuotationItemRepository) private tempQuotationItemModel: typeof TempQuotationItemRepository,
        @InjectModel(deliveryChallanRepository) private deliveryChallanModel: typeof deliveryChallanRepository,
        @InjectModel(DeliveryItemRepository) private DeliveryItemModel: typeof DeliveryItemRepository,
        @InjectModel(TempDeliveryItemRepository) private TempDeliveryItemModel: typeof TempDeliveryItemRepository,
        @InjectModel(UserRepository) private userModel: typeof UserRepository,
        private readonly helperService: HelperService,
        private readonly quotationService: QuotationService

    ) {

    }
    async getDeliveryChallanCustomerDropDown(): Promise<ApiResponse> {
        try {

            let revisedDocNumber = null;
            let getChallanData = await this.deliveryChallanModel.findAll({
                where: { customer_name: { [Op.not]: null } },
                attributes: [
                    [Sequelize.fn('DISTINCT', Sequelize.col('customer_name')), 'customer_name'], "id"
                ],
            })

            return responseMessageGenerator('success', 'data fetched successfully', getChallanData)


        } catch (error) {
            console.log(error);
            return responseMessageGenerator('failure', 'something went wrong', error.message)
        }
    }
    async getDeliveryChallanFormData(challan_id: number, type: string): Promise<ApiResponse> {
        try {

            let revisedDocNumber = null
            let getQuotationData = await this.deliveryChallanModel.findAll({
                where: { id: challan_id },
                include: [
                    { association: "delivery_items" }
                ],
            })
            let modifiedListData = []
            let i = 1
            // if(type =="revision"){
            //      revisedDocNumber =  (await this.generateRevisionDocNumber(getQuotationData[0].id)).data
            // }
            for (let singleData of getQuotationData[0].delivery_items) {
                let obj: any = {}
                Object.assign(obj, {
                    ...singleData.dataValues
                })
                obj['serial_no'] = i
                i++
                modifiedListData.push(obj)
                // if(revisedDocNumber){
                //      let revisionObj:any ={}
                //      Object.assign(revisionObj, {
                //         ...singleData.dataValues
                //     })
                //     revisionObj['doc_number']=revisedDocNumber
                //     delete revisionObj.id
                //     delete revisionObj.createdAt
                //     delete revisionObj.updatedAt

                //     // return obj
                //     let existingQuotationItem = await this.TempDeliveryItemModel.findOne({where:{doc_number:revisedDocNumber,item_number:revisionObj.item_number,description:revisionObj.description}})
                //     if(existingQuotationItem == null){
                //         let savedData =   await this.SaveOrUpdateDeliveryChallanList(revisedDocNumber,[revisionObj],null)
                //     }

                // }
            }

            let modifiedOverAllData = await Promise.all(getQuotationData.map(async singleData => {
                return {
                    ...singleData.dataValues,
                    doc_date: moment(singleData.doc_date).format('DD-MMM-YYYY'),
                    reference_date: singleData.reference_date ? moment(singleData.reference_date).format('DD-MMM-YYYY') : singleData.reference_date,
                    doc_number: singleData.doc_number,
                    delivery_items: modifiedListData
                }
            }))


            return responseMessageGenerator('success', 'data fetched successfully', modifiedOverAllData[0])

        } catch (error) {
            console.log(error);
            return responseMessageGenerator('failure', 'something went wrong', error.message)
        }
    }
    async getDeliveryChallanFormHistory(filter:filterData): Promise<ApiResponse> {
        try {

            let userName = async (user_id) => {
                let userData = await this.userModel.findOne({ where: { id: user_id } })
                let shortName = userData?.user_name ? await this.helperService.getShortName(userData.user_name) : userData?.user_name
                let employee = {
                    user_name: userData?.user_name,
                    avatar_type: 'short_name',
                    avatar_value: shortName
                }
                return employee
            }

            let condition ={}

            filter?.date && ( condition['doc_date'] =  filter.date )
            let getQuotationData = await this.deliveryChallanModel.findAll({where:condition, order: [['id', 'DESC']] })
            let modifiedData = await Promise.all(getQuotationData.map(async singleData => {
                return {
                    id: singleData.id,
                    Date: moment(singleData.doc_date).format('DD/M/YYYY'),
                    remarks: singleData.remark_brand,
                    document_number: singleData.doc_number,
                    customer_name: singleData.customer_name,
                    created_by: await userName(singleData.created_user_id),
                }
            }))
            return responseMessageGenerator('success', 'data fetched successfully', modifiedData)

        } catch (error) {
            console.log(error);
            return responseMessageGenerator('failure', 'something went wrong', error.message)
        }
    }
    async createDeliveryChallanForm(ChallanForm: deliveryChallanFormDto): Promise<any> {
        try {
            let getTempDeliveryList = await this.TempDeliveryItemModel.findAll({
                where: { doc_number: ChallanForm.doc_number },
                attributes: ["item_number", "description", "quantity", "units"],
                order: [["id", "ASC"]]
            })
            ChallanForm.is_record_saved = true;
            let doc_number =  await this.quotationService.generateDynamicDocNumber('delivery')
            if(doc_number?.data != null && doc_number?.data != ChallanForm.doc_number){
                ChallanForm.doc_number = doc_number?.data
                ChallanForm.is_doc_num_differ = true
            }
            let deliveryChallanData = await this.deliveryChallanModel.findOne({ where: { doc_number: ChallanForm.doc_number } })

            let [createDeliveryChallan, update] = await this.deliveryChallanModel.upsert({ id: deliveryChallanData?.id, ...ChallanForm })

            if (createDeliveryChallan) {
                let delivery_id = createDeliveryChallan.id

                for (let singleData of getTempDeliveryList) {
                    let obj = {}
                    Object.assign(obj, {
                        ...singleData.dataValues,
                        delivery_id: delivery_id
                    })

                    let createQuotation = await this.DeliveryItemModel.create(obj)

                }
            }
            //reset the temp data
            await this.resetTempDeliveryChallanData(ChallanForm.doc_number)
            return responseMessageGenerator('success', 'data saved successfully', [])

        } catch (error) {
            console.log(error);
            return responseMessageGenerator('failure', 'something went wrong', error.message)


        }
    }
    async updateDeliveryChallanForm(id: number, UpdateDeliveryChallanForm: UpdateDeliveryChallanFormDto): Promise<any> {
        try {

            let getTempDeliveryList = await this.TempDeliveryItemModel.findAll({
                where: { doc_number: UpdateDeliveryChallanForm.doc_number },
                attributes: ["item_number", "description", "quantity", "units"],
                order: [["id", "ASC"]]
            })

            let updateQuotation = await this.deliveryChallanModel.update({ ...UpdateDeliveryChallanForm }, { where: { id: id } })
            //  let itemCount = getTempQuotationList.length
            if (updateQuotation && getTempDeliveryList.length > 0) {
                await this.DeliveryItemModel.destroy({ where: { delivery_id: id } })
                for (let singleData of getTempDeliveryList) {
                    /* destroy previous data*/
                    let obj = {}
                    Object.assign(obj, {
                        ...singleData.dataValues,
                        delivery_id: id
                    })
                    let update = await this.DeliveryItemModel.create(obj)
                }
            }
            await this.resetTempDeliveryChallanData(UpdateDeliveryChallanForm.doc_number)
            return responseMessageGenerator('success', 'data updated successfully', [])

        } catch (error) {
            console.log(error);
            return responseMessageGenerator('failure', 'something went wrong', error.message)


        }
    }
    async generateDeliveryChallanTemplate(res: any, id: number): Promise<any> {
        try {


            let templateName = "delivery_challan"
            let deliveryChalanData = await this.getDeliveryChallanFormData(id, "view")
            if (deliveryChalanData.status == "failure") {
                return res.json(deliveryChalanData)
            }

            const logBase64Image = readFileSync('public/images/logo.png', 'base64');
            const footerBase64Image = readFileSync('public/images/shadow-trading-footer-with-data.png', 'base64');
            const sideLogoBase64Image = readFileSync('public/images/sideLogo.png', 'base64');
            const waterMarkBase64Image = readFileSync('public/images/watermark.png', 'base64');
            const logo = `data:image/png;base64,${logBase64Image}`;
            const footer = `data:image/png;base64,${footerBase64Image}`;
            const sidelogo = `data:image/png;base64,${sideLogoBase64Image}`;
            const watermark = `data:image/png;base64,${waterMarkBase64Image}`;

            let  delivery_items = deliveryChalanData.data.delivery_items
          
            let lessThan15 =[]
            let lessThan40 =[]
            let lessThan65 =[]
            let lessThan90 =[]
            let lessThan115 =[]
            let lessThan140 =[]
            let lessThan165 =[]
            let lessThan190 =[]
            let lessThan215 =[]

            for(let singleItem of deliveryChalanData.data.delivery_items){

                  if(singleItem.serial_no <= 15){
                    lessThan15.push(singleItem)
                  }
                  if(singleItem.serial_no >= 16 && singleItem.serial_no <=40 ){
                   lessThan40.push(singleItem)
                  }
                  if( singleItem.serial_no >= 41 && singleItem.serial_no <=65){
                   lessThan65.push(singleItem)
                  }
                  if(singleItem.serial_no >= 66 && singleItem.serial_no <=90){
                   lessThan90.push(singleItem)
                  }
                  if(singleItem.serial_no >= 91 && singleItem.serial_no <=115){
                   lessThan115.push(singleItem)
                  }
                  if(singleItem.serial_no >=116 && singleItem.serial_no <=140){
                   lessThan140.push(singleItem)
                  }
                  if(singleItem.serial_no >=141 && singleItem.serial_no <=165){
                   lessThan165.push(singleItem)
                  }
                  if(singleItem.serial_no >=166 && singleItem.serial_no <= 190){
                   lessThan190.push(singleItem)
                  }
                  if(singleItem.serial_no >=191 && singleItem.serial_no <= 225){
                   lessThan215.push(singleItem)
                  }
            }
                
            let formattedItems = {
               "lessThan15":lessThan15,
               "is_value_exist_15":lessThan15.length > 0 ? true :false,
               "lessThan40":lessThan40,
               "is_value_exist_40":lessThan40.length > 0 ? true :false,
               "lessThan65":lessThan65,
               "is_value_exist_65":lessThan65.length > 0 ? true :false,
               "lessThan90":lessThan90,
               "is_value_exist_90":lessThan90.length > 0 ? true :false,
               "lessThan115":lessThan115,
               "is_value_exist_115":lessThan115.length > 0 ? true :false,
               "lessThan140":lessThan140,
               "is_value_exist_140":lessThan140.length > 0 ? true :false,
               "lessThan165":lessThan165,
               "is_value_exist_165":lessThan165.length > 0 ? true :false,
               "lessThan190":lessThan190,
               "is_value_exist_190":lessThan190.length > 0 ? true :false,
               "lessThan215":lessThan215,
               "is_value_exist_215":lessThan215.length > 0 ? true :false
            }

            let formData = [deliveryChalanData.data].map(singleData => ({
                ...singleData,
                logo: logo,
                footer: footer,
                sidelogo: sidelogo,
                watermark: watermark, 
                formatted_items:formattedItems
            }))
            // return res.json(formData) 
            let fileName = (deliveryChalanData.data.customer_name?.trim()?.replace(/ /g, '_')) + "_" + deliveryChalanData.data.doc_number + "_" + moment().format('MMM_YYYY') + ".pdf"
            /*Handlebars is blocking access to object properties inherited from the prototype chain for security reasons. This behavior was introduced to prevent prototype pollution vulnerabilities.*/
            /*By serializing and deserializing the object, you ensure that only own properties are kept, eliminating any issues with prototype access restrictions*/
            const plainContext = JSON.parse(JSON.stringify(formData[0]));

            //   return res.json(plainContext) 

            const generateChallan = await this.helperService.generatePdfFromTemplate(DELIVERY_CHALLAN_UPLOAD_DIRECTORY, templateName, plainContext, 'delivery_challan');
            const base64Data = generateChallan.replace(/^data:application\/pdf;base64,/, '');

            const pdfBuffer = Buffer.from(base64Data, 'base64');

            //  Set headers and send the PDF as a response
            res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
            res.setHeader('Content-Type', 'application/pdf');
            res.send(pdfBuffer);

            //    return responseMessageGenerator('success','Delivery Challan downloaded successfully', { "base64Data": base64Data, "fileName": fileName })

        } catch (error) {
            console.log(error);
            return responseMessageGenerator('failure', 'something went wrong', error.message)


        }
    }
    async downloadDeliveryChallanTemplate(id: number): Promise<any> {
        try {


            let templateName = "delivery_challan"
            let deliveryChalanData = await this.getDeliveryChallanFormData(id, "view")
            if (deliveryChalanData.status == "failure") {
                return deliveryChalanData
            }

            const logBase64Image = readFileSync('public/images/logo.png', 'base64');
            const footerBase64Image = readFileSync('public/images/shadow-trading-footer-with-data.png', 'base64');
            const sideLogoBase64Image = readFileSync('public/images/sideLogo.png', 'base64');
            const waterMarkBase64Image = readFileSync('public/images/watermark.png', 'base64');
            const logo = `data:image/png;base64,${logBase64Image}`;
            const footer = `data:image/png;base64,${footerBase64Image}`;
            const sidelogo = `data:image/png;base64,${sideLogoBase64Image}`;
            const watermark = `data:image/png;base64,${waterMarkBase64Image}`;

            let  delivery_items = deliveryChalanData.data.delivery_items
          
            let lessThan15 =[]
            let lessThan40 =[]
            let lessThan65 =[]
            let lessThan90 =[]
            let lessThan115 =[]
            let lessThan140 =[]
            let lessThan165 =[]
            let lessThan190 =[]
            let lessThan215 =[]

            for(let singleItem of deliveryChalanData.data.delivery_items){

                if(singleItem.serial_no <= 15){
                  lessThan15.push(singleItem)
                }
                if(singleItem.serial_no >= 16 && singleItem.serial_no <=37 ){
                 lessThan40.push(singleItem)
                }
                if( singleItem.serial_no >= 38 && singleItem.serial_no <=62){
                 lessThan65.push(singleItem)
                }
                if(singleItem.serial_no >= 63 && singleItem.serial_no <=87){
                 lessThan90.push(singleItem)
                }
                if(singleItem.serial_no >= 88 && singleItem.serial_no <=112){
                 lessThan115.push(singleItem)
                }
                if(singleItem.serial_no >=113 && singleItem.serial_no <=137){
                 lessThan140.push(singleItem)
                }
                if(singleItem.serial_no >=138 && singleItem.serial_no <=162){
                 lessThan165.push(singleItem)
                }
                if(singleItem.serial_no >=163 && singleItem.serial_no <= 187){
                 lessThan190.push(singleItem)
                }
                if(singleItem.serial_no >=188 && singleItem.serial_no <= 215){
                 lessThan215.push(singleItem)
                }
          }
             
                
            let formattedItems = {
               "lessThan15":lessThan15,
               "is_value_exist_15":lessThan15.length > 0 ? true :false,
               "lessThan40":lessThan40,
               "is_value_exist_40":lessThan40.length > 0 ? true :false,
               "lessThan65":lessThan65,
               "is_value_exist_65":lessThan65.length > 0 ? true :false,
               "lessThan90":lessThan90,
               "is_value_exist_90":lessThan90.length > 0 ? true :false,
               "lessThan115":lessThan115,
               "is_value_exist_115":lessThan115.length > 0 ? true :false,
               "lessThan140":lessThan140,
               "is_value_exist_140":lessThan140.length > 0 ? true :false,
               "lessThan165":lessThan165,
               "is_value_exist_165":lessThan165.length > 0 ? true :false,
               "lessThan190":lessThan190,
               "is_value_exist_190":lessThan190.length > 0 ? true :false,
               "lessThan215":lessThan215,
               "is_value_exist_215":lessThan215.length > 0 ? true :false
            }

            let formData = [deliveryChalanData.data].map(singleData => ({
                ...singleData,
                logo: logo,
                footer: footer,
                sidelogo: sidelogo,
                watermark: watermark, 
                formatted_items:formattedItems
            }))

            let fileName =(deliveryChalanData.data.customer_name?.trim()?.replace(/ /g, '_')) + "_" + deliveryChalanData.data.doc_number + "_" + moment().format('MMM_YYYY') + ".pdf"
            /*Handlebars is blocking access to object properties inherited from the prototype chain for security reasons. This behavior was introduced to prevent prototype pollution vulnerabilities.*/
            /*By serializing and deserializing the object, you ensure that only own properties are kept, eliminating any issues with prototype access restrictions*/
            const plainContext = JSON.parse(JSON.stringify(formData[0]));


            const generateChallan = await this.helperService.generatePdfFromTemplate(DELIVERY_CHALLAN_UPLOAD_DIRECTORY, templateName, plainContext, 'delivery_challan');
            const base64Data = generateChallan.replace(/^data:application\/pdf;base64,/, '');

            return responseMessageGenerator('success', 'Delivery Challan downloaded successfully', { "base64Data": base64Data, "fileName": fileName })

        } catch (error) {
            console.log(error);
            return responseMessageGenerator('failure', 'something went wrong', error.message)


        }
    }
    async SaveOrUpdateDeliveryChallanList(doc_number: string, challan_list: ChallanListDto[], record_id?: number): Promise<any> {
        try {
            if (record_id) {


                let formatedData = challan_list.map(singleData => ({
                    ...singleData,
                    doc_number: doc_number,
                }))

                let updateQuotation = await this.TempDeliveryItemModel.update(formatedData[0], { where: { id: record_id } })
            }
            else if (challan_list.length > 0) {

                let formatedData = challan_list.map(singleData => ({
                    ...singleData,
                    doc_number: doc_number,
                }))
                let createQuotation = await this.TempDeliveryItemModel.bulkCreate(formatedData)
            }

            return responseMessageGenerator('success', 'data saved successfully', [])

        } catch (error) {
            console.log(error);
            return responseMessageGenerator('failure', 'something went wrong', error.message)


        }
    }
    async getAllDeliveryChallanList(doc_number: string): Promise<any> {
        try {

            let getTempChallanList = await this.TempDeliveryItemModel.findAll({ where: { doc_number: doc_number }, order: [["id", "ASC"]] })
            let modifiedData = []
            let i = 1
            for (let singleData of getTempChallanList) {
                let obj = {}
                Object.assign(obj, {
                    ...singleData.dataValues
                })
                obj['serial_no'] = i
                i++
                modifiedData.push(obj)
            }
            let objData = {
                list: modifiedData,
            }

            return responseMessageGenerator('success', 'data fetched successfully', objData)

        } catch (error) {
            console.log(error);
            return responseMessageGenerator('failure', 'something went wrong', error.message)


        }
    }
    async deleteDeliveryChallanList(record_id: number): Promise<any> {
        try {

            let dropTempChallanList = await this.TempDeliveryItemModel.destroy({ where: { id: record_id } })
            return responseMessageGenerator('success', 'data deleted successfully', [])

        } catch (error) {
            console.log(error);
            return responseMessageGenerator('failure', 'something went wrong', error.message)


        }
    }
    async getSingleDeliveryChallanList(record_id: number): Promise<any> {
        try {

            let getTempChallanList = await this.TempDeliveryItemModel.findOne({ where: { id: record_id } })
            return responseMessageGenerator('success', 'data fetched successfully', getTempChallanList)

        } catch (error) {
            console.log(error);
            return responseMessageGenerator('failure', 'something went wrong', error.message)


        }
    }
    async resetTempDeliveryChallanData(doc_number: string): Promise<any> {
        try {

            let getTempChallanList = await this.TempDeliveryItemModel.destroy({ where: { doc_number: doc_number } })
            let dropChallanFormAgainstDoc = await this.deliveryChallanModel.destroy({ where: { doc_number: doc_number } })
            return responseMessageGenerator('success', 'data reset successfully', getTempChallanList)

        } catch (error) {
            console.log(error);
            return responseMessageGenerator('failure', 'something went wrong', error.message)


        }
    }
    async moveForwardDeliveryChallan(quotation_id: number, current_user_id: number): Promise<any> {
        try {

            let getQuotationData: any = await this.QuotationFormModel.findAll({
                where: { id: quotation_id },
                include: [
                    {
                        association: "quotation_items", attributes: ["item_number", "description",
                            "quantity", "units"]
                    }
                ],
            })

            let createDeliveryChallan
            let dc_doc_number = (await this.quotationService.generateDynamicDocNumber(documentType.Delivery))?.data

            let isRecordExists = await this.deliveryChallanModel.findAll({ where: { quotation_id: getQuotationData[0].id, doc_number: dc_doc_number, customer_name: getQuotationData[0].customer_name } })
            if (isRecordExists.length > 0) {
                createDeliveryChallan = isRecordExists[0]
            } else {
                getQuotationData = await Promise.all(getQuotationData.map(singleData => {
                    return {
                        ...singleData.dataValues,
                        doc_number: dc_doc_number,
                        quotation_id: singleData.dataValues.id,
                        is_form_move_forward: true,
                        current_user_id: current_user_id,
                    }
                }))
                delete getQuotationData[0]['id']
                createDeliveryChallan = await this.deliveryChallanModel.create(getQuotationData[0])

            }
            // return getQuotationData

            for (let singleData of getQuotationData[0].quotation_items) {
                let doc_number = createDeliveryChallan.doc_number
                let object = {
                    ...singleData.dataValues,
                    delivery_id: createDeliveryChallan.id
                }
                let existingQuotationItem = await this.TempDeliveryItemModel.findOne({ where: { doc_number: doc_number, item_number: singleData.item_number, description: singleData.description } })
                if (existingQuotationItem == null) {
                    let savedData = await this.SaveOrUpdateDeliveryChallanList(doc_number, [object], null)
                }
            }

            let deliveryChallanData = await this.deliveryChallanModel.findAll({ where: { id: createDeliveryChallan.id } })
            return responseMessageGenerator('success', 'data saved successfully', deliveryChallanData)

        } catch (error) {
            console.log(error);
            return responseMessageGenerator('failure', 'something went wrong', error.message)


        }
    }
    /*helper function*/
    async numberToWord(num) {
        const singleDigits = [
            "", "One", "Two", "Three", "Four", "Five", "six", "Seven", "Eight", "Nine"
        ];
        const teens = [
            "Ten", "Eleven", "Twelve", "Thirteen", "fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"
        ];
        const tens = [
            "", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"
        ];
        const thousands = ["", "Thousand", "Lakh", "Crore"];

        function convertHundred(num: number): string {
            let str = "";
            if (num > 99) {
                str += singleDigits[Math.floor(num / 100)] + " hundred ";
                num = num % 100;
            }
            if (num > 9 && num < 20) {
                str += teens[num - 10] + " ";
            } else {
                str += tens[Math.floor(num / 10)] + " " + singleDigits[num % 10] + " ";
            }
            return str.trim();
        }

        function convertToWords(num: number): string {
            if (num === 0) return "zero";
            let word = "";
            let isCrore = false;
            let isLakhs = false;
            let isThousands = false;

            // Special handling for Indian Numbering System (splitting based on lakh and crore)
            const parts = [];
            if (num >= 10000000) { // Crores
                parts.push(Math.floor(num / 10000000));
                isCrore = true
                num = num % 10000000;
            }
            if (num >= 100000) { // Lakhs
                parts.push(Math.floor(num / 100000))
                isLakhs = true
                num = num % 100000;
            }
            if (num >= 1000) { // Thousands
                parts.push(Math.floor(num / 1000));
                isThousands = true
                num = num % 1000;
            }
            parts.push(num); // The remaining hundreds or below


            // Convert each part to words
            for (let i = 0; i < parts.length; i++) {
                if (parts[i] > 0) {

                    if (isCrore) {
                        word += convertHundred(parts[i]) + " " + thousands[3] + " ";
                        isCrore = false
                        continue;
                    } else if (isLakhs) {
                        word += convertHundred(parts[i]) + " " + thousands[2] + " ";
                        console.log("lakhs" + i);
                        isLakhs = false
                        continue;
                    } else if (isThousands) {
                        word += convertHundred(parts[i]) + " " + thousands[1] + " ";
                        console.log("thousand" + i);
                        isThousands = false
                        continue;
                    } else {
                        word += convertHundred(parts[i]) + " " + thousands[0] + " ";
                        console.log(" " + i);
                    }

                }
            }

            return word.trim();
        }

        return convertToWords(num) + " rupees only";

    }

    async duplicateRecord(record_id: number,count:number): Promise<any> {
        try {

            let getChallanList:any = await this.DeliveryItemModel.findOne({ where: { id: record_id }, attributes: {
                exclude: ['createdAt', 'updatedAt','id'] // Exclude the columns you don't want
            } })
           
            let createChallanList;
          
            while(count != 0){
              let payload =  {
                    "delivery_id": getChallanList.delivery_id,
                    "item_number": getChallanList.item_number,
                    "description": getChallanList.description,
                    "quantity": getChallanList.quantity,
                  }
                  createChallanList = await this.DeliveryItemModel.create(payload)
                count--;
            }
           
           
            return responseMessageGenerator('success', 'data fetched successfully', createChallanList)

        } catch (error) {
            console.log(error);
            return responseMessageGenerator('failure', 'something went wrong', error.message)


        }
    }

}
