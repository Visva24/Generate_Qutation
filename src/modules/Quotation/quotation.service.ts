import { Injectable } from '@nestjs/common';
import { log } from 'node:console';
import { ApiResponse, responseMessageGenerator } from 'src/common/util/helper.config';
import { deliveryChallanFormDto, documentsDto, filterData, QuotationFormDto, QuotationListDto } from './dto/create-quotation.dto';
import { InjectModel } from '@nestjs/sequelize';
import { documentDetailRepository, QuotationFormRepository, QuotationItemRepository, TempQuotationItemRepository } from './entity/quotation.entity';
import { UpdateQuotationFormDto } from './dto/update-quotation.dto';
import * as moment from 'moment';
import { HelperService } from 'src/common/services/helper/helper.service';
import { QUOTATION_UPLOAD_DIRECTORY } from 'src/common/app.constant';
import { readFileSync } from 'fs';
import { SalesInvoiceFormRepository } from './entity/sales_invoice.entity';
import { deliveryChallanRepository } from './entity/delivery_challan.entity';
import { Op, Sequelize } from 'sequelize';
import { writeFileSync } from 'fs';
import { join } from 'path';
import * as path from 'path';
import * as fs from 'fs';
import { promises } from 'node:dns';
import { UserRepository } from '../Authentication/entity/users.entity';
import { cashType } from './enum/quotation.enum';


@Injectable()
export class QuotationService {
    constructor(
        @InjectModel(QuotationFormRepository) private QuotationFormModel: typeof QuotationFormRepository,
        @InjectModel(documentDetailRepository) private documentDetailModel: typeof documentDetailRepository,
        @InjectModel(QuotationItemRepository) private QuotationListModel: typeof QuotationItemRepository,
        @InjectModel(SalesInvoiceFormRepository) private SalesInvoiceFormModel: typeof SalesInvoiceFormRepository,
        @InjectModel(deliveryChallanRepository) private deliveryChallanModel: typeof deliveryChallanRepository,
        @InjectModel(TempQuotationItemRepository) private tempQuotationItemModel: typeof TempQuotationItemRepository,
        @InjectModel(UserRepository) private userModel: typeof UserRepository,
        private readonly helperService: HelperService

    ) {

    }

    private readonly uploadPath = 'public/uploads/signatures';

    async getQuotationCustomerDropDown(): Promise<ApiResponse> {
        try {

            let revisedDocNumber = null;
            let getQuotationData = await this.QuotationFormModel.findAll({
                where: { customer_name: { [Op.not]: null } },
                attributes: [
                    [Sequelize.fn('DISTINCT', Sequelize.col('customer_name')), 'customer_name'], "id"
                ],
            })

            return responseMessageGenerator('success', 'data fetched successfully', getQuotationData)


        } catch (error) {
            console.log(error);
            return responseMessageGenerator('failure', 'something went wrong', error.message)
        }
    }
    async getQuotationFormData(quotation_id: number, type: string): Promise<ApiResponse> {
        try {

            let revisedDocNumber = null
            let getQuotationData = await this.QuotationFormModel.findAll({
                where: { id: quotation_id },
                include: [
                    { association: "quotation_items" }
                ],
            })
            let modifiedListData = []
            let i = 1
            if (type == "revised") {
                revisedDocNumber = (await this.generateRevisionDocNumber(getQuotationData[0].id)).data
            }
            for (let singleData of getQuotationData[0].quotation_items) {
                let obj: any = {}
                Object.assign(obj, {
                    ...singleData.dataValues
                })
                obj['serial_no'] = i
                i++
                modifiedListData.push(obj)
                if (revisedDocNumber) {
                    let revisionObj: any = {}
                    Object.assign(revisionObj, {
                        ...singleData.dataValues
                    })
                    revisionObj['doc_number'] = revisedDocNumber
                    delete revisionObj.id
                    delete revisionObj.createdAt
                    delete revisionObj.updatedAt

                    // return obj
                    let existingQuotationItem = await this.tempQuotationItemModel.findOne({ where: { doc_number: revisedDocNumber, item_number: revisionObj.item_number, description: revisionObj.description } })
                    if (existingQuotationItem == null) {
                        let savedData = await this.SaveOrUpdateQuotationList(revisedDocNumber, [revisionObj], null)
                    }

                }
            }

            let modifiedOverAllData = await Promise.all(getQuotationData.map(async singleData => {
                return {
                    ...singleData.dataValues,
                    doc_date: moment(singleData.doc_date).format('DD-MMM-YYYY'),
                    ...(type == "revised" && { doc_number: revisedDocNumber }),
                    quotation_items: modifiedListData,
                    amount_in_words: await this.helperService.numberToWord(singleData.grand_total, singleData.currency)
                }
            }))


            return responseMessageGenerator('success', 'data fetched successfully', modifiedOverAllData[0])


        } catch (error) {
            console.log(error);
            return responseMessageGenerator('failure', 'something went wrong', error.message)
        }
    }
    async getQuotationFormHistory(filter:filterData): Promise<ApiResponse> {
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
            let condition = {}
            filter?.date && ( condition['doc_date'] =  filter.date )
            let getQuotationData = await this.QuotationFormModel.findAll({where:condition, order: [['id', 'DESC']] })
            let modifiedData = await Promise.all(getQuotationData.map(async singleData => {
                return {
                    id: singleData.id,
                    Date: moment(singleData.doc_date).format('DD/M/YYYY'),
                    remarks: singleData.remark_brand,
                    total_amount: singleData.grand_total,
                    document_number: singleData.doc_number,
                    symbol: singleData.currency,
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
    async createQuotationForm(QuotationForm: QuotationFormDto): Promise<any> {
        try {
            let getTempQuotationList = await this.tempQuotationItemModel.findAll({
                where: { doc_number: QuotationForm.doc_number },
                attributes: ["item_number", "description", "quantity", "units", "price", "discount", "tax", "amount"],
                order: [["id", "ASC"]]
            })

            let totalAmount = getTempQuotationList.reduce((acc, sum) => acc + +sum.amount, 0)
            
            // let totalTax = getTempQuotationList.reduce((acc, sum) => acc + +sum.tax, 0)
            // let totalDiscount = getTempQuotationList.reduce((acc, sum) => acc + +sum.discount, 0)
            // QuotationForm.total_discount = 0
            // QuotationForm.total_tax = 0
            let doc_number =  await this.generateDynamicDocNumber('quotation')
          
            if(doc_number?.data != null && doc_number?.data != QuotationForm.doc_number){
                QuotationForm.doc_number = doc_number?.data
                QuotationForm.is_doc_num_differ = true
            }
           
            QuotationForm.sub_total = totalAmount
            QuotationForm.grand_total = totalAmount
            let createQuotation = await this.QuotationFormModel.create(QuotationForm)

            if (createQuotation) {
                let quotationId = createQuotation.id

                for (let singleData of getTempQuotationList) {
                    let obj = {}
                    Object.assign(obj, {
                        ...singleData.dataValues,
                        quotation_id: quotationId
                    })

                    let createQuotation = await this.QuotationListModel.create(obj)

                }
            }
            //reset the temp data
            await this.resetTempQuotationData(QuotationForm.doc_number)
            return responseMessageGenerator('success', 'data saved successfully', [])

        } catch (error) {
            console.log(error);
            return responseMessageGenerator('failure', 'something went wrong', error.message)


        }
    }
    async updateQuotationForm(id: number, UpdateQuotationForm: UpdateQuotationFormDto): Promise<any> {
        try {

            let getTempQuotationList = await this.tempQuotationItemModel.findAll({
                where: { doc_number: UpdateQuotationForm.doc_number },
                attributes: ["item_number", "description", "quantity", "units", "price", "discount", "tax", "amount"],
                order: [["id", "ASC"]]
            })
            let Quotation = await this.QuotationFormModel.findOne({ where: { id: id } })
            let revisionCount = Quotation.revision_count + 1

            let totalAmount = getTempQuotationList.reduce((acc, sum) => acc + +sum.amount, 0)
            // let totalTax = getTempQuotationList.reduce((acc, sum) => acc + +sum.tax, 0)
            // let totalDiscount = getTempQuotationList.reduce((acc, sum) => acc + +sum.discount, 0)
            // QuotationForm.total_discount = totalDiscount
            // QuotationForm.total_tax = totalTax
            UpdateQuotationForm.revision_count = revisionCount
            UpdateQuotationForm.is_revised = true
            UpdateQuotationForm.sub_total = totalAmount
            UpdateQuotationForm.grand_total = totalAmount

            let updateQuotation = await this.QuotationFormModel.update({ ...UpdateQuotationForm }, { where: { id: id } })
            //  let itemCount = getTempQuotationList.length
            if (updateQuotation && getTempQuotationList.length > 0) {
                await this.QuotationListModel.destroy({ where: { quotation_id: id } })
                for (let singleData of getTempQuotationList) {
                    /* destroy previous data*/
                    let obj = {}
                    Object.assign(obj, {
                        ...singleData.dataValues,
                        quotation_id: id
                    })
                    let update = await this.QuotationListModel.create(obj)
                }
            }
            await this.resetTempQuotationData(UpdateQuotationForm.doc_number)
            return responseMessageGenerator('success', 'data updated successfully', [])

        } catch (error) {
            console.log(error);
            return responseMessageGenerator('failure', 'something went wrong', error.message)


        }
    }
    async generateDynamicDocNumber(doc_type: string): Promise<any> {
        try {

            const generateInvoiceNumber = (baseNumber: string) => {
                const yearMonth = moment().format('YYMM'); // Formats to '2502' for Feb 2025
                return baseNumber.replace(/\d{4}/, yearMonth); // Replaces '2501' with '2502'
              };
            let docNumber
            let getDocumentData = await this.documentDetailModel.findOne({ where: { doc_type: doc_type } })

            let repoObject = {
                "quotation": this.QuotationFormModel,
                "delivery": this.deliveryChallanModel,
                "sales": this.SalesInvoiceFormModel
            }
            let Quotation = await repoObject[doc_type].findOne({ where: { doc_number: { [Op.not]: null } }, order: [["id", "DESC"]] })

            if (Quotation) {

                if (doc_type == "delivery" && Quotation?.is_form_move_forward && Quotation?.is_record_saved == false) {
                    docNumber = Quotation?.doc_number
                } else if (doc_type == "sales" && Quotation?.is_form_move_forward && Quotation?.is_record_saved == false) {
                    docNumber = generateInvoiceNumber(Quotation?.doc_number)
                } else {
                    let incrementDocNumber
                    if (Quotation.doc_number != null) {


                        let docNum = (Quotation.is_revised == true && doc_type == "quotation") ? Quotation.doc_number.replace(/(\d+).*/, '$1') : Quotation.doc_number
                        /*
                            \d+: Matches one or more digits (dynamic part).
                            .*: Matches everything after the digits.
                            Replace: Replace the match with $1, which refers to the captured digits.
                        */
                        incrementDocNumber = await this.incrementLastDigit(docNum)
                    }
                    if(doc_type == "sales"){
                        docNumber = generateInvoiceNumber(incrementDocNumber)
                    }else{
                        docNumber =incrementDocNumber
                    }
                    
                }
            } else {
                if(doc_type == "sales"){
                    docNumber = generateInvoiceNumber(Quotation?.doc_number)
                }else{
                    docNumber = getDocumentData?.doc_number
                }
               
            }


            return responseMessageGenerator('success', 'data fetched successfully', docNumber)

        } catch (error) {
            console.log(error);
            return responseMessageGenerator('failure', 'something went wrong', error.message)


        }
    }

  
    async incrementLastDigit(invoiceNumber: string): Promise<any> {
        try {

            // Use regex to extract the last numeric part of the string
            const match = invoiceNumber.match(/(\d+)$/);

            if (!match) {
                throw new Error("No numeric part found in the input string");
            }
            // const lastNumber = parseInt(match[1], 10); // Get the last number
            // const incrementedNumber = lastNumber + 1; // Increment the number

            // // Replace the last number with the incremented number
            // const updatedInvoiceNumber = invoiceNumber.replace(
            //     new RegExp(`${lastNumber}$`),
            //     incrementedNumber.toString()
            // );

            let updatedInvoiceNumber = invoiceNumber.replace(/(\d+)(?!.*\d)/, (match) => {
                return (parseInt(match) + 1).toString().padStart(match.length, '0');
            });
            return updatedInvoiceNumber;

        } catch (error) {
            console.log(error);
            return " "

        }


    }
    async createOrUpdateDocument(documentData: documentsDto[]): Promise<any> {
        try {

            for (let singleData of documentData) {

                let isREcordExist = await this.documentDetailModel.findOne({ where: { doc_number: singleData.doc_number, doc_type: singleData.doc_type } })
                await this.documentDetailModel.upsert({ id: isREcordExist?.id, ...singleData })
            }
            return responseMessageGenerator('success', 'data saved successfully', [])

        } catch (error) {
            console.log(error);
            return responseMessageGenerator('failure', 'something went wrong', error.message)


        }
    }
    async generateQuotationTemplate(res: any, id: number,user_id:number =1): Promise<any> {
        try {


            let templateName = "quotation_template"
            let QuotationData = await this.getQuotationFormData(id, "view")
            if (QuotationData.status == "failure") {
                return res.json(QuotationData)
            }

            const logBase64Image = readFileSync('public/images/logo.png', 'base64');
            const footerBase64Image = readFileSync('public/images/shadow-trading-footer-with-data.png', 'base64');
            const sideLogoBase64Image = readFileSync('public/images/sideLogo.png', 'base64');
            const waterMarkBase64Image = readFileSync('public/images/watermark.png', 'base64');
            const logo = `data:image/png;base64,${logBase64Image}`;
            const footer = `data:image/png;base64,${footerBase64Image}`;
            const sidelogo = `data:image/png;base64,${sideLogoBase64Image}`;
            const watermark = `data:image/png;base64,${waterMarkBase64Image}`;
            let numberInWords = await this.helperService.numberToWord(QuotationData.data.grand_total, QuotationData.data.currency)
              let itemsLength = (QuotationData.data.quotation_items).length
                
              let userData = await this.userModel.findOne({where:{id:user_id}})
            //  return res.json(itemsLength)
             let  quotation_items = QuotationData.data.quotation_items
          
             let lessThan15 =[]
             let lessThan40 =[]
             let lessThan65 =[]
             let lessThan90 =[]
             let lessThan115 =[]
             let lessThan140 =[]
             let lessThan165 =[]
             let lessThan190 =[]
             let lessThan215 =[]

             for(let singleItem of QuotationData.data.quotation_items){

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
            //    return res.json(formattedItems)
            let formData = [QuotationData.data].map(singleData => ({
                ...singleData,
                amount_in_words: numberInWords,
                logo: logo,
                footer: footer,
                sidelogo: sidelogo,
                watermark: watermark, 
                is_vat_enable:singleData.currency  == cashType.SAR  ? true:false,
                quotation_items:quotation_items,
                formatted_items:formattedItems,
                user_sign:userData?.user_signature
            }))
            // return res.json(formData) 
            let fileName = (QuotationData.data.customer_name?.trim()?.replace(/ /g, '_')) + "_" + QuotationData.data.doc_number + "_" + moment().format('MMM_YYYY') + ".pdf"
            /*Handlebars is blocking access to object properties inherited from the prototype chain for security reasons. This behavior was introduced to prevent prototype pollution vulnerabilities.*/
            /*By serializing and deserializing the object, you ensure that only own properties are kept, eliminating any issues with prototype access restrictions*/
            const plainContext = JSON.parse(JSON.stringify(formData[0]));

            //   return res.json(plainContext) 

            const generatePayslip = await this.helperService.generatePdfFromTemplate(QUOTATION_UPLOAD_DIRECTORY, templateName, plainContext, 'payslip');
           
            const base64Data = generatePayslip.replace(/^data:application\/pdf;base64,/, '');

            const pdfBuffer = Buffer.from(base64Data, 'base64');

            //  Set headers and send the PDF as a response
            res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
            res.setHeader('Content-Type', 'application/pdf');
            res.send(pdfBuffer);

            //    return responseMessageGenerator('success','Quotation downloaded successfully', { "base64Data": base64Data, "fileName": fileName })

        } catch (error) {
            console.log(error);
            return responseMessageGenerator('failure', 'something went wrong', error.message)


        }
    }
    async downloadQuotationTemplate(id: number,user_id:number): Promise<any> {
        try {


            let templateName = "quotation_template"
            let QuotationData = await this.getQuotationFormData(id, "view")
            if (QuotationData.status == "failure") {
                return QuotationData
            }

            const logBase64Image = readFileSync('public/images/logo.png', 'base64');
            const footerBase64Image = readFileSync('public/images/shadow-trading-footer-with-data.png', 'base64');
            const sideLogoBase64Image = readFileSync('public/images/sideLogo.png', 'base64');
            const waterMarkBase64Image = readFileSync('public/images/watermark.png', 'base64');
            const logo = `data:image/png;base64,${logBase64Image}`;
            const footer = `data:image/png;base64,${footerBase64Image}`;
            const sidelogo = `data:image/png;base64,${sideLogoBase64Image}`;
            const watermark = `data:image/png;base64,${waterMarkBase64Image}`;

            let numberInWords = await this.helperService.numberToWord(QuotationData.data.grand_total, QuotationData.data.currency)
            let itemsLength = (QuotationData.data.quotation_items).length
                
            //  return res.json(itemsLength)
             let  quotation_items = QuotationData.data.quotation_items
          
             let lessThan15 =[]
             let lessThan40 =[]
             let lessThan65 =[]
             let lessThan90 =[]
             let lessThan115 =[]
             let lessThan140 =[]
             let lessThan165 =[]
             let lessThan190 =[]
             let lessThan215 =[]
             let lessThan235 =[]
             let lessThan255 =[]

             for(let singleItem of QuotationData.data.quotation_items){

                if(singleItem.serial_no <= 15){
                  lessThan15.push(singleItem)
                }
                if(singleItem.serial_no >= 16 && singleItem.serial_no <=35 ){
                 lessThan40.push(singleItem)
                }
                if( singleItem.serial_no >= 36 && singleItem.serial_no <=55){
                 lessThan65.push(singleItem)
                }
                if(singleItem.serial_no >= 56 && singleItem.serial_no <=75){
                 lessThan90.push(singleItem)
                }
                if(singleItem.serial_no >= 76 && singleItem.serial_no <=95){
                 lessThan115.push(singleItem)
                }
                if(singleItem.serial_no >=95 && singleItem.serial_no <=115){
                 lessThan140.push(singleItem)
                }
                if(singleItem.serial_no >=116 && singleItem.serial_no <=135){
                 lessThan165.push(singleItem)
                }
                if(singleItem.serial_no >=136 && singleItem.serial_no <= 155){
                 lessThan190.push(singleItem)
                }
                if(singleItem.serial_no >=156 && singleItem.serial_no <= 175){
                 lessThan215.push(singleItem)
                }
                if(singleItem.serial_no >=176 && singleItem.serial_no <= 195){
                 lessThan235.push(singleItem)
                }
                if(singleItem.serial_no >=196 && singleItem.serial_no <= 215){
                 lessThan255.push(singleItem)
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
             "is_value_exist_215":lessThan215.length > 0 ? true :false,
             "lessThan235":lessThan235,
             "is_value_exist_235":lessThan235.length > 0 ? true :false,
             "lessThan255":lessThan255,
             "is_value_exist_255":lessThan255.length > 0 ? true :false
          }
             let userData = await this.userModel.findOne({where:{id:user_id}})
             let sign = await this.getSignatureAsBase64(userData?.user_signature)
              
            let formData = [QuotationData.data].map(singleData => ({
                ...singleData,
                amount_in_words: numberInWords,
                logo: logo,
                footer: footer,
                sidelogo: sidelogo,
                watermark: watermark, 
                is_vat_enable:singleData.currency  == cashType.SAR  ? true:false,
                quotation_items:quotation_items,
                formatted_items:formattedItems,
                user_sign: sign.data
            }))
               
            let fileName =  (QuotationData.data.customer_name?.trim()?.replace(/ /g, '_')) + "_" + QuotationData.data.doc_number + "_" + moment().format('MMM_YYYY') + ".pdf"
            /*Handlebars is blocking access to object properties inherited from the prototype chain for security reasons. This behavior was introduced to prevent prototype pollution vulnerabilities.*/
            /*By serializing and deserializing the object, you ensure that only own properties are kept, eliminating any issues with prototype access restrictions*/
            const plainContext = JSON.parse(JSON.stringify(formData[0]));


            const generatePayslip = await this.helperService.generatePdfFromTemplate(QUOTATION_UPLOAD_DIRECTORY, templateName, plainContext, 'payslip');
           
            const base64Data = generatePayslip.replace(/^data:application\/pdf;base64,/, '');
            return responseMessageGenerator('success', 'Quotation downloaded successfully', { "base64Data": base64Data, "fileName": fileName })

        } catch (error) {
            console.log(error);
            return responseMessageGenerator('failure', 'something went wrong', error)


        }
    }
    async SaveOrUpdateQuotationList(doc_number: string, Quotation_list: QuotationListDto[], record_id?: number): Promise<any> {
        try {
            if (record_id) {
                let getListTotalAmount = (row) => {
                    return (row.price * row.quantity +
                        (row?.tax ? (row.price * row.quantity * row.tax) / 100 : 0) -
                        (row?.discount ? (row.price * row.quantity * row.discount) / 100 : 0))
                }

                let totalAmount = getListTotalAmount(Quotation_list[0])

                let formatedData = Quotation_list.map(singleData => ({
                    ...singleData,
                    doc_number: doc_number,
                    amount: totalAmount
                }))

                let updateQuotation = await this.tempQuotationItemModel.update(formatedData[0], { where: { id: record_id } })
            }
            else if (Quotation_list.length > 0) {

                let getListTotalAmount = (row) => {
                    return (row.price * row.quantity +
                        (row?.tax ? (row.price * row.quantity * row.tax) / 100 : 0) -
                        (row?.discount ? (row.price * row.quantity * row.discount) / 100 : 0))
                }

                let totalAmount = getListTotalAmount(Quotation_list[0])

                let formatedData = Quotation_list.map(singleData => ({
                    ...singleData,
                    doc_number: doc_number,
                    amount: totalAmount
                }))
                let createQuotation = await this.tempQuotationItemModel.bulkCreate(formatedData)
            }

            return responseMessageGenerator('success', 'data saved successfully', [])

        } catch (error) {
            console.log(error);
            return responseMessageGenerator('failure', 'something went wrong', error.message)


        }
    }
    async getAllQuotationList(doc_number: string, currency: string): Promise<any> {
        try {

            let getTempQuotationList = await this.tempQuotationItemModel.findAll({ where: { doc_number: doc_number }, order: [["id", "ASC"]] })
            let totalAmount = getTempQuotationList.reduce((acc, sum) => acc + +sum.amount, 0)
            // let totalTax = getTempQuotationList.reduce((acc, sum) => acc + +sum.tax, 0)
            // let totalDiscount = getTempQuotationList.reduce((acc, sum) => acc + +sum.discount, 0)
            let modifiedData = []
            let i = 1
            for (let singleData of getTempQuotationList) {
                let obj = {}
                Object.assign(obj, {
                    ...singleData.dataValues
                })
                obj['serial_no'] = i
                i++
                modifiedData.push(obj)
            }
            let amountInWords = await this.helperService.numberToWord(Math.floor(totalAmount), currency)
            let objData = {
                "total_discount": "0.00",
                "total_tax": "0.00",
                "sub_total": totalAmount,
                "grand_total": totalAmount,
                "amount_in_words": amountInWords,
                list: modifiedData,
            }

            return responseMessageGenerator('success', 'data fetched successfully', objData)

        } catch (error) {
            console.log(error);
            return responseMessageGenerator('failure', 'something went wrong', error.message)


        }
    }
    async deleteQuotationList(record_id: number): Promise<any> {
        try {

            let dropTempQuotationList = await this.tempQuotationItemModel.destroy({ where: { id: record_id } })
            return responseMessageGenerator('success', 'data deleted successfully', [])

        } catch (error) {
            console.log(error);
            return responseMessageGenerator('failure', 'something went wrong', error.message)


        }
    }

    async getSingleQuotationList(record_id: number): Promise<any> {
        try {

            let getTempQuotationList = await this.tempQuotationItemModel.findOne({ where: { id: record_id } })
            return responseMessageGenerator('success', 'data fetched successfully', getTempQuotationList)

        } catch (error) {
            console.log(error);
            return responseMessageGenerator('failure', 'something went wrong', error.message)


        }
    }
    async resetTempQuotationData(doc_number: string): Promise<any> {
        try {

            let getTempQuotationList = await this.tempQuotationItemModel.destroy({ where: { doc_number: doc_number } })
            return responseMessageGenerator('success', 'data reset successfully', getTempQuotationList)

        } catch (error) {
            console.log(error);
            return responseMessageGenerator('failure', 'something went wrong', error.message)


        }
    }
    async generateSerialNumber(QuotationList: any): Promise<any> {
        try {

            let modifiedData = []
            let i = 1
            for (let singleData of QuotationList) {
                let obj = {}
                Object.assign(obj, {
                    ...singleData
                })
                obj['serial_no'] = i
                i++
                modifiedData.push(obj)
            }
            return modifiedData

        } catch (error) {
            console.log(error);
            return []
        }
    }
    async generateRevisionDocNumber(record_id: number): Promise<any> {
        try {
            let Quotation = await this.QuotationFormModel.findOne({ where: { id: record_id } })
            let revisionCount = Quotation.revision_count + 1
            let docNum = Quotation.doc_number
            Quotation.is_revised == true && (docNum = docNum.replace(/(\d+).*/, '$1'))
            let revisedDocNumber = docNum + "-R" + revisionCount
            return responseMessageGenerator('success', 'data fetched successfully', revisedDocNumber)
        } catch (error) {
            console.log(error);
            return responseMessageGenerator('failure', error.message, null)
        }
    }

    async getUserProfileDetails(user_id: number): Promise<any> {
        try {
            let userData = await this.userModel.findOne({ where: { id: user_id } })

            let userSignature = await this.getSignatureAsBase64(userData.user_signature)
            if (userSignature.status == "failure") {
                return userSignature
            }
            let resData = {
                user_id: userData.id,
                user_name: userData.user_name,
                user_role: "Manager",
                user_signature: userSignature.data,
            }

            return responseMessageGenerator('success', 'data fetch successfully', resData);

        } catch (error) {
            console.error('Error fetching image:', error);
            responseMessageGenerator('failure', "Error fetching image", null)

        }
    }
    async getSignatureAsBase64(filename: string): Promise<any> {
        try {
            // Define the file path
            const filePath = filename

            // Check if file exists
            if (!fs.existsSync(filePath)) {
                return responseMessageGenerator('failure', "File not found", null)
            }

            // Read file and convert to Base64
            const fileBuffer = fs.readFileSync(filePath);
            const base64Image = fileBuffer.toString('base64');

            // Return the Base64 response
            return responseMessageGenerator('success', 'data fetch successfully', `data:image/png;base64,${base64Image}`);
        } catch (error) {
            console.error('Error fetching image:', error);
            responseMessageGenerator('failure', "Error fetching image", null)

        }
    }
    async uploadUserDetails(userId: string, base64Image: string, user_name: string): Promise<any> {
        try {
            // Extract base64 data
            const matches = base64Image.match(/^data:image\/(\w+);base64,(.+)$/);
            if (!matches) return responseMessageGenerator('failure', "Invalid image format", null)

            let userData = await this.userModel.findOne({ where: { id: userId } })

            if (userData && userData.user_signature) {
                const oldSignaturePath = path.join(__dirname, '..', '..', userData.user_signature);

                // Delete old signature file if it exists
                if (fs.existsSync(oldSignaturePath)) {
                    fs.unlinkSync(oldSignaturePath);
                }
            }

            let saveSignature = await this.saveSignature(userId, base64Image)
            if (saveSignature.status == 'failure') {
                return saveSignature
            }
            let condition = {}
            user_name && (condition['user_name'] =user_name )
            condition['user_signature'] = saveSignature?.data
            let updateUserData = await this.userModel.update(condition, { where: { id: userId } })
            return responseMessageGenerator('success', "image saved successfully", [])
        } catch (error) {
            console.log(error);
            return responseMessageGenerator('failure', error.message, null)
        }
    }
    async saveSignature(userId: string, base64Image: string): Promise<any> {
        try {
            // Extract base64 data
            const matches = base64Image.match(/^data:image\/(\w+);base64,(.+)$/);
            if (!matches) throw new Error('Invalid image format');

            const extension = matches[1];
            const buffer = Buffer.from(matches[2], 'base64');

            let userData = await this.userModel.findOne({ where: { id: userId } })
            // Define file path
            const fileName = `${(userData.user_name).toLowerCase()}_${userId}_signature.${extension}`;
            const filePath = join(this.uploadPath, fileName);

            // Save image
            writeFileSync(filePath, buffer);

            return responseMessageGenerator('success', "image saved successfully", filePath)
        } catch (error) {
            console.log(error);
            return responseMessageGenerator('failure', error.message, null)
        }
    }


    /*helper function*/
    // async numberToWord(num) {
    //     const singleDigits = [
    //         "", "One", "Two", "Three", "Four", "Five", "six", "Seven", "Eight", "Nine"
    //     ];
    //     const teens = [
    //         "Ten", "Eleven", "Twelve", "Thirteen", "fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"
    //     ];
    //     const tens = [
    //         "", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"
    //     ];
    //     const thousands = ["", "Thousand", "Lakh", "Crore"];

    //     function convertHundred(num: number): string {
    //         let str = "";
    //         if (num > 99) {
    //             str += singleDigits[Math.floor(num / 100)] + " hundred ";
    //             num = num % 100;
    //         }
    //         if (num > 9 && num < 20) {
    //             str += teens[num - 10] + " ";
    //         } else {
    //             str += tens[Math.floor(num / 10)] + " " + singleDigits[num % 10] + " ";
    //         }
    //         return str.trim();
    //     }

    //     function convertToWords(num: number): string {
    //         if (num === 0) return "zero";
    //         let word = "";
    //         let isCrore = false;
    //         let isLakhs = false;
    //         let isThousands = false;

    //         // Special handling for Indian Numbering System (splitting based on lakh and crore)
    //         const parts = [];
    //         if (num >= 10000000) { // Crores
    //             parts.push(Math.floor(num / 10000000));
    //             isCrore = true
    //             num = num % 10000000;
    //         }
    //         if (num >= 100000) { // Lakhs
    //             parts.push(Math.floor(num / 100000))
    //             isLakhs = true
    //             num = num % 100000;
    //         }
    //         if (num >= 1000) { // Thousands
    //             parts.push(Math.floor(num / 1000));
    //             isThousands = true
    //             num = num % 1000;
    //         }
    //         parts.push(num); // The remaining hundreds or below


    //         // Convert each part to words
    //         for (let i = 0; i < parts.length; i++) {
    //             if (parts[i] > 0) {

    //                 if (isCrore) {
    //                     word += convertHundred(parts[i]) + " " + thousands[3] + " ";
    //                     isCrore = false
    //                     continue;
    //                 } else if (isLakhs) {
    //                     word += convertHundred(parts[i]) + " " + thousands[2] + " ";
    //                     console.log("lakhs" + i);
    //                     isLakhs = false
    //                     continue;
    //                 } else if (isThousands) {
    //                     word += convertHundred(parts[i]) + " " + thousands[1] + " ";
    //                     console.log("thousand" + i);
    //                     isThousands = false
    //                     continue;
    //                 } else {
    //                     word += convertHundred(parts[i]) + " " + thousands[0] + " ";
    //                     console.log(" " + i);
    //                 }

    //             }
    //         }

    //         return word.trim();
    //     }

    //     return convertToWords(num) + " rupees only";

    // }

    async duplicateRecord(record_id: number,count:number): Promise<any> {
        try {

            let getQuotationList:any = await this.QuotationListModel.findOne({ where: { id: record_id }, attributes: {
                exclude: ['createdAt', 'updatedAt','id'] // Exclude the columns you don't want
            } })
            let createQuotationList;
          
            while(count != 0){
              let payload =  {
                    "quotation_id": getQuotationList.quotation_id,
                    "item_number": getQuotationList.item_number,
                    "description": getQuotationList.description,
                    "quantity": getQuotationList.quantity,
                    "units": getQuotationList.units,
                    "price": getQuotationList.price,
                    "discount": getQuotationList.discount,
                    "tax": getQuotationList.tax,
                    "amount": getQuotationList.amount
                  }
                 createQuotationList = await this.QuotationListModel.create(payload)
                count--;
            }
           
           
            return responseMessageGenerator('success', 'data fetched successfully', createQuotationList)

        } catch (error) {
            console.log(error);
            return responseMessageGenerator('failure', 'something went wrong', error.message)


        }
    }



}
