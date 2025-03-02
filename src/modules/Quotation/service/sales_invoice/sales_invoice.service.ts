import { Injectable } from '@nestjs/common';
import { log } from 'node:console';
import { ApiResponse, responseMessageGenerator } from 'src/common/util/helper.config';
import { InjectModel } from '@nestjs/sequelize';
import * as moment from 'moment';
import { HelperService } from 'src/common/services/helper/helper.service';
import { QUOTATION_UPLOAD_DIRECTORY, SALES_INVOICE_UPLOAD_DIRECTORY } from 'src/common/app.constant';

import { readFileSync } from 'fs';
import { deliveryChallanRepository, DeliveryItemRepository, TempDeliveryItemRepository } from '../../entity/delivery_challan.entity';
import { UpdateDeliveryChallanFormDto, UpdateInvoiceFormDto, UpdateQuotationFormDto } from '../../dto/update-quotation.dto';
import { ChallanListDto, deliveryChallanFormDto, documentsDto, filterData, InvoiceFormDto, InvoiceListDto, QuotationFormDto, QuotationListDto } from '../../dto/create-quotation.dto';
import { documentDetailRepository, QuotationFormRepository, QuotationItemRepository, TempQuotationItemRepository } from '../../entity/quotation.entity';
import { SalesInvoiceFormRepository, SalesItemRepository, TempSalesItemRepository } from '../../entity/sales_invoice.entity';
import { QuotationService } from '../../quotation.service';
import { documentType } from '../../enum/quotation.enum';
import { Op, Sequelize } from 'sequelize';
import { UserRepository } from 'src/modules/Authentication/entity/users.entity';

@Injectable()
export class SalesInvoiceService {

    constructor(
        @InjectModel(QuotationFormRepository) private QuotationFormModel: typeof QuotationFormRepository,
        @InjectModel(documentDetailRepository) private documentDetailModel: typeof documentDetailRepository,
        @InjectModel(QuotationItemRepository) private QuotationListModel: typeof QuotationItemRepository,
        @InjectModel(TempQuotationItemRepository) private tempQuotationItemModel: typeof TempQuotationItemRepository,
        @InjectModel(deliveryChallanRepository) private deliveryChallanModel: typeof deliveryChallanRepository,
        @InjectModel(SalesInvoiceFormRepository) private SalesInvoiceFormModel: typeof SalesInvoiceFormRepository,
        @InjectModel(SalesItemRepository) private SalesItemModel: typeof SalesItemRepository,
        @InjectModel(TempSalesItemRepository) private TempSalesItemModel: typeof TempSalesItemRepository,
        @InjectModel(UserRepository) private userModel: typeof UserRepository,
        private readonly helperService: HelperService,
        private readonly quotationService: QuotationService

    ) {

    }

    async getSalesInvoiceCustomerDropDown(): Promise<ApiResponse> {
        try {

            let revisedDocNumber = null;
            let getInvoiceData = await this.deliveryChallanModel.findAll({
                where: { customer_name: { [Op.not]: null } },
                attributes: [
                    [Sequelize.fn('DISTINCT', Sequelize.col('customer_name')), 'customer_name'], "id"
                ],
            })

            return responseMessageGenerator('success', 'data fetched successfully', getInvoiceData)


        } catch (error) {
            console.log(error);
            return responseMessageGenerator('failure', 'something went wrong', error.message)
        }
    }
    async getSalesInvoiceFormData(user_id:number,Invoice_id: number, type: string): Promise<ApiResponse> {
        try {

            let revisedDocNumber = null
            let getInvoiceData = await this.SalesInvoiceFormModel.findAll({
                where: { id: Invoice_id },
                include: [
                    { association: "sales_items" }
                ],
            })
            let modifiedListData = []
            let i = 1
            // if(type =="revision"){
            //      revisedDocNumber =  (await this.generateRevisionDocNumber(getQuotationData[0].id)).data
            // }
            for (let singleData of getInvoiceData[0].sales_items) {
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

            let modifiedOverAllData = await Promise.all(getInvoiceData.map(async singleData => {
                return {
                    ...singleData.dataValues,
                    reference_date: moment(singleData.reference_date).format('DD-MMM-YYYY'),
                    doc_date: moment(singleData.doc_date).format('DD-MMM-YYYY'),
                    sub_total: await this.helperService.formatAmount(singleData.sub_total,singleData.currency),
                    grand_total: await this.helperService.formatAmount(singleData.grand_total,singleData.currency),
                    // doc_number:singleData.doc_number,
                    sales_items: modifiedListData,
                    amount_in_words: await this.helperService.numberToWord(singleData.grand_total, singleData.currency)
                }
            }))


            return responseMessageGenerator('success', 'data fetched successfully', modifiedOverAllData[0])

        } catch (error) {
            console.log(error);
            return responseMessageGenerator('failure', 'something went wrong', error.message)
        }
    }
    async getSalesInvoiceFormHistory(filter:filterData): Promise<ApiResponse> {
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
            let getInvoiceData = await this.SalesInvoiceFormModel.findAll({where:condition, order: [['id', 'DESC']] })
            let modifiedData = await Promise.all(getInvoiceData.map(async singleData => {
                return {
                    id: singleData.id,
                    Date: moment(singleData.doc_date).format('DD/M/YYYY'),
                    remarks: singleData.remark_brand,
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
    async createSalesInvoiceForm(user_id:number,InvoiceForm: InvoiceFormDto): Promise<any> {
        try {
            let getTempInvoiceList = await this.TempSalesItemModel.findAll({
                where: {user_id:user_id, doc_number: InvoiceForm.doc_number },
                attributes: ["item_number", "description", "quantity", "units", "price", "discount", "amount"],
                order: [["id", "ASC"]]
            })
            let resetDocNumber = InvoiceForm.doc_number
            InvoiceForm.is_record_saved = true;
            let SalesInvoiceData = await this.SalesInvoiceFormModel.findOne({ where: { doc_number: InvoiceForm.doc_number } })
            let doc_number =  await this.quotationService.generateDynamicDocNumber('sales')
            if(doc_number?.data != null && doc_number?.data != InvoiceForm.doc_number){
                InvoiceForm.doc_number = doc_number?.data
                InvoiceForm.is_doc_num_differ = true
            }
            let totalAmount = getTempInvoiceList.reduce((acc, sum) => acc + +sum.amount, 0)
            // let totalTax = getTempQuotationList.reduce((acc, sum) => acc + +sum.tax, 0)
            // let totalDiscount = getTempQuotationList.reduce((acc, sum) => acc + +sum.discount, 0)
            // QuotationForm.total_discount = 0
            // QuotationForm.total_tax = 0
            InvoiceForm.sub_total = totalAmount
            InvoiceForm.grand_total = totalAmount

            let [createSalesInvoice, update] = await this.SalesInvoiceFormModel.upsert({ id: SalesInvoiceData?.id, ...InvoiceForm })


            if (createSalesInvoice) {
                let invoice_id = createSalesInvoice.id

                for (let singleData of getTempInvoiceList) {
                    let obj = {}
                    Object.assign(obj, {
                        ...singleData.dataValues,
                        invoice_id: invoice_id
                    })

                    await this.SalesItemModel.create(obj)

                }
            }
            //reset the temp data
            await this.resetTempSalesInvoiceData(user_id,resetDocNumber)
            return responseMessageGenerator('success', 'data saved successfully', [])

        } catch (error) {
            console.log(error);
            return responseMessageGenerator('failure', 'something went wrong', error.message)


        }
    }
    async updateSalesInvoiceForm(user_id:number,id: number, UpdateInvoiceForm: UpdateInvoiceFormDto): Promise<any> {
        try {

            let getTempInvoiceList = await this.TempSalesItemModel.findAll({
                where: {user_id:user_id, doc_number: UpdateInvoiceForm.doc_number },
                attributes: ["item_number", "description", "quantity", "units"],
                order: [["id", "ASC"]]
            })

            let totalAmount = getTempInvoiceList.reduce((acc, sum) => acc + +sum.amount, 0)
            // let totalTax = getTempQuotationList.reduce((acc, sum) => acc + +sum.tax, 0)
            // let totalDiscount = getTempQuotationList.reduce((acc, sum) => acc + +sum.discount, 0)
            // QuotationForm.total_discount = 0
            // QuotationForm.total_tax = 0
            UpdateInvoiceForm.sub_total = totalAmount
            UpdateInvoiceForm.grand_total = totalAmount

            let updateInvoice = await this.deliveryChallanModel.update({ ...UpdateInvoiceForm }, { where: { id: id } })
            //  let itemCount = getTempQuotationList.length
            if (updateInvoice && getTempInvoiceList.length > 0) {
                await this.SalesItemModel.destroy({ where: { invoice_id: id } })
                for (let singleData of getTempInvoiceList) {
                    /* destroy previous data*/
                    let obj = {}
                    Object.assign(obj, {
                        ...singleData.dataValues,
                        delivery_id: id
                    })
                    let update = await this.SalesItemModel.create(obj)
                }
            }
            await this.resetTempSalesInvoiceData(user_id,UpdateInvoiceForm.doc_number)
            return responseMessageGenerator('success', 'data updated successfully', [])

        } catch (error) {
            console.log(error);
            return responseMessageGenerator('failure', 'something went wrong', error.message)


        }
    }
    async generateSalesInvoiceTemplate(res: any, id: number): Promise<any> {
        try {


            let templateName = "sale_invoice"
            let invoiceData = await this.getSalesInvoiceFormData(1,id, "view")
            if (invoiceData.status == "failure") {
                return res.json(invoiceData)
            }

            const logBase64Image = readFileSync('public/images/logo.png', 'base64');
            const footerBase64Image = readFileSync('public/images/shadow-trading-footer-with-data.png', 'base64');
            const sideLogoBase64Image = readFileSync('public/images/sideLogo.png', 'base64');
            const waterMarkBase64Image = readFileSync('public/images/watermark.png', 'base64');
            const logo = `data:image/png;base64,${logBase64Image}`;
            const footer = `data:image/png;base64,${footerBase64Image}`;
            const sidelogo = `data:image/png;base64,${sideLogoBase64Image}`;
            const watermark = `data:image/png;base64,${waterMarkBase64Image}`;
            let grand_total=  await this.helperService.formatAmount((Number(invoiceData.data.grand_total.replace(/,/g, ''))),invoiceData.data.currency)
            let  sub_total = await this.helperService.formatAmount((Number(invoiceData.data.sub_total.replace(/,/g, ''))),invoiceData.data.currency)
            let numberInWords = await this.helperService.numberToWord(invoiceData.data.grand_total, invoiceData.data.currency)
            let formData = [invoiceData.data].map(singleData => ({
                ...singleData,
                amount_in_words: numberInWords,
                grand_total: grand_total,
                sub_total: sub_total,
                logo: logo,
                footer: footer,
                sidelogo: sidelogo,
                watermark: watermark, 
            }))
            // return res.json(formData) 
            let fileName = (invoiceData.data.customer_name?.trim()?.replace(/ /g, '_')) + "_" + invoiceData.data.doc_number + "_" + moment().format('MMM_YYYY') + ".pdf"
            /*Handlebars is blocking access to object properties inherited from the prototype chain for security reasons. This behavior was introduced to prevent prototype pollution vulnerabilities.*/
            /*By serializing and deserializing the object, you ensure that only own properties are kept, eliminating any issues with prototype access restrictions*/
            const plainContext = JSON.parse(JSON.stringify(formData[0]));

            //   return res.json(plainContext) 

            const generateInvoice = await this.helperService.generatePdfFromTemplate(SALES_INVOICE_UPLOAD_DIRECTORY, templateName, plainContext, 'sales_invoice');
            const base64Data = generateInvoice.replace(/^data:application\/pdf;base64,/, '');

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
    async downloadSalesInvoiceTemplate(user_id:number,id: number): Promise<any> {
        try {


            let templateName = "sale_invoice"
            let invoiceData = await this.getSalesInvoiceFormData(user_id,id, "view")
            if (invoiceData.status == "failure") {
                return invoiceData
            }

            const logBase64Image = readFileSync('public/images/logo.png', 'base64');
            const footerBase64Image = readFileSync('public/images/shadow-trading-footer-with-data.png', 'base64');
            const sideLogoBase64Image = readFileSync('public/images/sideLogo.png', 'base64');
            const waterMarkBase64Image = readFileSync('public/images/watermark.png', 'base64');
            const logo = `data:image/png;base64,${logBase64Image}`;
            const footer = `data:image/png;base64,${footerBase64Image}`;
            const sidelogo = `data:image/png;base64,${sideLogoBase64Image}`;
            const watermark = `data:image/png;base64,${waterMarkBase64Image}`;

            let numberInWords = await this.helperService.numberToWord(invoiceData.data.grand_total, invoiceData.data.currency)
            let itemsLength = (invoiceData.data.sales_items).length
                
            //  return res.json(itemsLength)
             let  invoice_items = invoiceData.data.sales_items
           
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

             for(let singleItem of invoiceData.data.sales_items){

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
            //  return  formattedItems.lessThan215
            let grand_total=  await this.helperService.formatAmount((Number(invoiceData.data.grand_total.replace(/,/g, ''))),invoiceData.data.currency)
            let  sub_total = await this.helperService.formatAmount((Number(invoiceData.data.sub_total.replace(/,/g, ''))),invoiceData.data.currency)
            let formData = [invoiceData.data].map(singleData => ({
                ...singleData,
                amount_in_words: numberInWords,
                grand_total: grand_total,
                sub_total: sub_total,
                logo: logo,
                footer: footer,
                sidelogo: sidelogo,
                watermark: watermark, 
                formatted_items:formattedItems
            }))

            let fileName =(invoiceData.data.customer_name?.trim()?.replace(/ /g, '_'))  + "_" + invoiceData.data.doc_number + "_" + moment().format('MMM_YYYY') + ".pdf"
            /*Handlebars is blocking access to object properties inherited from the prototype chain for security reasons. This behavior was introduced to prevent prototype pollution vulnerabilities.*/
            /*By serializing and deserializing the object, you ensure that only own properties are kept, eliminating any issues with prototype access restrictions*/
            const plainContext = JSON.parse(JSON.stringify(formData[0]));


            const generateInvoice = await this.helperService.generatePdfFromTemplate(SALES_INVOICE_UPLOAD_DIRECTORY, templateName, plainContext, 'sales_invoice');
            const base64Data = generateInvoice.replace(/^data:application\/pdf;base64,/, '');

            return responseMessageGenerator('success', 'Delivery Challan downloaded successfully', { "base64Data": base64Data, "fileName": fileName })

        } catch (error) {
            console.log(error);
            return responseMessageGenerator('failure', 'something went wrong', error.message)


        }
    }
    async SaveOrUpdateSalesInvoiceList(user_id:number,doc_number: string, invoice_list: InvoiceListDto[], record_id?: number): Promise<any> {
        try {
            if (record_id) {


                let getListTotalAmount = (row) => {
                    return (row.price * row.quantity +
                        (row?.tax ? (row.price * row.quantity * row.tax) / 100 : 0) -
                        (row?.discount ? (row.price * row.quantity * row.discount) / 100 : 0))
                }

                let totalAmount = getListTotalAmount(invoice_list[0])

                let formatedData = invoice_list.map(singleData => ({
                    ...singleData,
                    doc_number: doc_number,
                    amount: totalAmount,
                    user_id:user_id
                }))

                let updateInvoice = await this.TempSalesItemModel.update(formatedData[0], { where: { id: record_id } })
            }
            else if (invoice_list.length > 0) {
                let getListTotalAmount = (row) => {
                    return (row.price * row.quantity +
                        (row?.tax ? (row.price * row.quantity * row.tax) / 100 : 0) -
                        (row?.discount ? (row.price * row.quantity * row.discount) / 100 : 0))
                }


                let totalAmount = getListTotalAmount(invoice_list[0])

                let formatedData = invoice_list.map(singleData => ({
                    ...singleData,
                    doc_number: doc_number,
                    amount: totalAmount,
                    user_id:user_id
                }))
                let createInvoice = await this.TempSalesItemModel.bulkCreate(formatedData)
            }

            return responseMessageGenerator('success', 'data saved successfully', [])

        } catch (error) {
            console.log(error);
            return responseMessageGenerator('failure', 'something went wrong', error.message)


        }
    }
    async getAllSalesInvoiceList(user_id:number,doc_number: string, currency: string): Promise<any> {
        try {

            let getInvoiceList = await this.TempSalesItemModel.findAll({ where: { user_id:user_id,doc_number: doc_number }, order: [["id", "ASC"]] })
            let modifiedData = []
            let totalAmount = getInvoiceList.reduce((acc, sum) => acc + +sum.amount, 0)
            let i = 1
            for (let singleData of getInvoiceList) {
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
                "sub_total": await this.helperService.formatAmount(totalAmount,currency),
                "grand_total": await this.helperService.formatAmount(totalAmount,currency),
                "amount_in_words": amountInWords,
                list: modifiedData,
            }

            return responseMessageGenerator('success', 'data fetched successfully', objData)

        } catch (error) {
            console.log(error);
            return responseMessageGenerator('failure', 'something went wrong', error.message)


        }
    }
    async deleteSalesInvoiceListItems(record_id: number): Promise<any> {
        try {

            let dropTempInvoiceList = await this.TempSalesItemModel.destroy({ where: { id: record_id } })
            return responseMessageGenerator('success', 'data deleted successfully', [])

        } catch (error) {
            console.log(error);
            return responseMessageGenerator('failure', 'something went wrong', error.message)


        }
    }
    async getSingleSalesInvoiceList(record_id: number): Promise<any> {
        try {

            let getTempInvoiceList = await this.TempSalesItemModel.findOne({ where: { id: record_id } })
            return responseMessageGenerator('success', 'data fetched successfully', getTempInvoiceList)

        } catch (error) {
            console.log(error);
            return responseMessageGenerator('failure', 'something went wrong', error.message)


        }
    }
    async resetTempSalesInvoiceData(user_id:number,doc_number: string): Promise<any> {
        try {

            let dropTempInvoiceList = await this.TempSalesItemModel.destroy({ where: {user_id:user_id, doc_number: doc_number } })
            let getInvoiceFormAgainstDoc = await this.SalesInvoiceFormModel.findOne({ where: { doc_number: doc_number,is_form_move_forward:true,is_record_saved:false } })
            if(getInvoiceFormAgainstDoc){
                await this.SalesInvoiceFormModel.destroy({ where: { doc_number: doc_number ,is_form_move_forward:true,is_record_saved:false } })
            }
            // let dropInvoiceFormAgainstDoc = await this.SalesInvoiceFormModel.destroy({ where: { doc_number: doc_number } })
            return responseMessageGenerator('success', 'data reset successfully', dropTempInvoiceList)

        } catch (error) {
            console.log(error);
            return responseMessageGenerator('failure', 'something went wrong', error.message)


        }
    }
    async moveForwardSalesInvoice(user_id:number,quotation_id: number, current_user_id: number): Promise<any> {
        try {


            let getQuotationData: any = await this.QuotationFormModel.findAll({
                where: { id: quotation_id },
                include: [
                    { association: "quotation_items", attributes: ["item_number", "description", "quantity", "units", "price", "discount", "tax", "amount"] }
                ],
            })
           
            let sales_doc_number = (await this.quotationService.generateDynamicDocNumber(documentType.Sales))?.data
            let isRecordExists = await this.SalesInvoiceFormModel.findAll({ where: { quotation_id: getQuotationData[0].id, doc_number: sales_doc_number, customer_name: getQuotationData[0].customer_name } })
           
            let createSalesInvoice
            if (isRecordExists.length > 0) {
                createSalesInvoice = isRecordExists[0]
            } else {
                getQuotationData = await Promise.all(getQuotationData.map(singleData => {
                    return {
                        ...singleData.dataValues,
                        doc_number: sales_doc_number,
                        quotation_id: singleData.dataValues.id,
                        is_form_move_forward: true,
                        current_user_id: current_user_id
                    }
                }))
                delete getQuotationData[0]['id']
                createSalesInvoice = await this.SalesInvoiceFormModel.create(getQuotationData[0])

            }

            for (let singleData of getQuotationData[0].quotation_items) {
                let doc_number = createSalesInvoice.doc_number
                let object = {
                    ...singleData.dataValues,
                    invoice_id: createSalesInvoice.id,
                    doc_number: doc_number,
                }
                let existingQuotationItem = await this.TempSalesItemModel.findOne({ where: { doc_number: doc_number, item_number: singleData.item_number, description: singleData.description } })
                if (existingQuotationItem == null) {
                    let savedData = await this.SaveOrUpdateSalesInvoiceList(user_id,doc_number, [object], null)
                }
            }

            let SalesInvoiceData = await this.SalesInvoiceFormModel.findAll({ where: { id: createSalesInvoice.id } })

            return responseMessageGenerator('success', 'data saved successfully', SalesInvoiceData)

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

            let getInvoiceList:any = await this.SalesItemModel.findOne({ where: { id: record_id }, attributes: {
                exclude: ['createdAt', 'updatedAt','id'] // Exclude the columns you don't want
            } })
            let createInvoiceList;
          
            while(count != 0){
              let payload =  {
                    "invoice_id": getInvoiceList.invoice_id,
                    "item_number": getInvoiceList.item_number,
                    "description": getInvoiceList.description,
                    "quantity": getInvoiceList.quantity,
                    "units": getInvoiceList.units,
                    "price": getInvoiceList.price,
                    "discount": getInvoiceList.discount,
                    "amount": getInvoiceList.amount
                  }
                  createInvoiceList = await this.SalesItemModel.create(payload)
                count--;
            }
           
           
            return responseMessageGenerator('success', 'data fetched successfully', createInvoiceList)

        } catch (error) {
            console.log(error);
            return responseMessageGenerator('failure', 'something went wrong', error.message)


        }
    }


}
