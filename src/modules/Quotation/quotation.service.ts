import { Injectable } from '@nestjs/common';
import { log } from 'node:console';
import { ApiResponse, responseMessageGenerator } from 'src/common/util/helper.config';
import { documentsDto, QuotationFormDto, QuotationListDto } from './dto/create-quotation.dto';
import { InjectModel } from '@nestjs/sequelize';
import { documentDetailRepository, QuotationFormRepository, QuotationItemRepository, TempQuotationItemRepository } from './entity/quotation.entity';
import { UpdateQuotationFormDto } from './dto/update-quotation.dto';
import * as moment from 'moment';
import { HelperService } from 'src/common/services/helper/helper.service';
import { QUOTATION_UPLOAD_DIRECTORY } from 'src/common/app.constant';
import { UserRepository } from '../authentication/entity/users.entity';

@Injectable()
export class QuotationService {
    constructor(
        @InjectModel(QuotationFormRepository) private QuotationFormModel : typeof QuotationFormRepository,
        @InjectModel(documentDetailRepository) private documentDetailModel : typeof documentDetailRepository,
        @InjectModel(QuotationItemRepository) private QuotationListModel : typeof QuotationItemRepository,
        @InjectModel(TempQuotationItemRepository) private tempQuotationItemModel : typeof TempQuotationItemRepository,
        @InjectModel(UserRepository) private userModel: typeof UserRepository,
        private readonly helperService:HelperService
       
    ){

    }

    async getQuotationFormData(quotation_id):Promise<ApiResponse>{
        try{

        let getQuotationData =  await this.QuotationFormModel.findAll({
            where:{id:quotation_id},
            include:[
                {association:"quotation_items"}
            ]
        })
       return responseMessageGenerator('success','data fetched successfully',getQuotationData) 

        }catch(error){
            console.log(error);
            return responseMessageGenerator('failure','something went wrong',error.message) 
        }
    }
    async getQuotationFormHistory():Promise<ApiResponse>{
        try{

            let userName = async (user_id)=>{
                let userData = await this.userModel.findOne({where:{id:user_id}})
                return userData?.user_name
            }
            
        let getQuotationData =  await this.QuotationFormModel.findAll()
        let modifiedData = await Promise.all(getQuotationData.map( async singleData =>{
            return {
            id:singleData.id,
            Date:moment(singleData.doc_date).format('DD/M/YYYY'),
            remarks:singleData.remark_brand,
            total_amount:singleData.grand_total,
            document_number:singleData.doc_number,
            created_by: await userName(singleData.created_user_id),
        }}))
       return responseMessageGenerator('success','data fetched successfully',modifiedData) 

        }catch(error){
            console.log(error);
            return responseMessageGenerator('failure','something went wrong',error.message) 
        }
    }
    async createQuotationForm(QuotationForm:QuotationFormDto):Promise<any>{
        try{

             let createQuotation = await this.QuotationFormModel.create(QuotationForm)

            if(createQuotation){
                let quotationId =createQuotation.id
                for(let singleData of QuotationForm.quotation_list_array){
                    let obj ={}
                    Object.assign(obj,{
                        ...singleData,
                        quotation_id:quotationId
                    })
                    let createQuotation = await this.QuotationListModel.create(obj)
                }
             }
             return responseMessageGenerator('success','data saved successfully',[])

        }catch(error){
            console.log(error);
            return responseMessageGenerator('failure','something went wrong',error.message)
            

        }
    }
    async updateQuotationForm(id:number,UpdateQuotationForm:UpdateQuotationFormDto):Promise<any>{
        try{

             let updateQuotation = await this.QuotationFormModel.update({...UpdateQuotationForm},{where:{id:id}})
               if(updateQuotation){
                
                for(let singleData of UpdateQuotationForm.quotation_list_array){
                    let obj ={}
                    Object.assign(obj,{
                        ...singleData,
                        quotation_id:id
                    })
                    let update = await this.QuotationListModel.create(obj)
                }
             }
            
             return responseMessageGenerator('success','data updated successfully',[])

        }catch(error){
            console.log(error);
            return responseMessageGenerator('failure','something went wrong',error.message)
            

        }
    }
    async generateDynamicDocNumber(doc_type:string):Promise<any>{
        try{
             let docNumber
             let getDocumentData = await this.documentDetailModel.findOne({where:{doc_type:doc_type}})
           
              let repoObject ={
                 "quotation":this.QuotationFormModel
              }
              let Quotation = await repoObject[doc_type].findOne({order:[["id","DESC"]]})  
             
              if(Quotation){
                 let incrementDocNumber
                 if(Quotation.doc_number != null ){
                     incrementDocNumber = await this.incrementLastDigit( Quotation.doc_number )
                 }
                 docNumber = incrementDocNumber
              }else{
                docNumber = getDocumentData?.doc_number
              }
              
              
             return responseMessageGenerator('success','data fetched successfully',docNumber)

        }catch(error){
            console.log(error);
            return responseMessageGenerator('failure','something went wrong',error.message)
            

        }
    }
    async incrementLastDigit(invoiceNumber: string): Promise<any> {
        try{

       // Use regex to extract the last numeric part of the string
        const match = invoiceNumber.match(/(\d+)$/);
        
        if (!match) {
          throw new Error("No numeric part found in the input string");
        }
        const lastNumber = parseInt(match[1], 10); // Get the last number
        const incrementedNumber = lastNumber + 1; // Increment the number
      
        // Replace the last number with the incremented number
        const updatedInvoiceNumber = invoiceNumber.replace(
          new RegExp(`${lastNumber}$`),
          incrementedNumber.toString()
        );
      
        return updatedInvoiceNumber;

        }catch(error){
            console.log(error);
            return " "

        }
        
        
    }
    async createOrUpdateDocument(documentData:documentsDto[]):Promise<any>{
        try{
             
            for(let singleData of documentData){
                
                let isREcordExist = await this.documentDetailModel.findOne({where:{doc_number:singleData.doc_number,doc_type:singleData.doc_type}})
                await this.documentDetailModel.upsert({id:isREcordExist?.id,...singleData})
            }
             return responseMessageGenerator('success','data saved successfully',[])

        }catch(error){
            console.log(error);
            return responseMessageGenerator('failure','something went wrong',error.message)
            

        }
    }
    async generateQuotationTemplate(res:any,id:number):Promise<any>{
        try{

           let fileName = "Quatation1" + "_" + moment().format('MMM_YYYY') + ".pdf"
           let templateName ="quotation_template"
            let QuotationData = await this.getQuotationFormData(id)
            if(QuotationData.status =="failure"){
                return QuotationData 
            }
            let formData =QuotationData.data[0]
            //  return res.json(formData) 
            const generatePayslip = await this.helperService.generatePdfFromTemplate(QUOTATION_UPLOAD_DIRECTORY, templateName, formData, 'payslip');
            const base64Data = generatePayslip.replace(/^data:application\/pdf;base64,/, '');

                 const pdfBuffer = Buffer.from(base64Data, 'base64');
   
               //  Set headers and send the PDF as a response
               res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
               res.setHeader('Content-Type', 'application/pdf');
               res.send(pdfBuffer);
               return responseMessageGenerator('success','Quotation downloaded successfully',[])

        }catch(error){
            console.log(error);
            return responseMessageGenerator('failure','something went wrong',error.message)
            

        }
    }
    async getAndSaveQuotationList(doc_number:string,Quotation_list:QuotationListDto[],record_id?:number):Promise<any>{
        try{

            if(record_id){
                let createQuotation = await this.tempQuotationItemModel.update(Quotation_list[0],{where:{id:record_id}})
            }else{
                let formatedData = Quotation_list.map(singleData=>({
                     ...singleData,
                     doc_number:doc_number
                }))
                return formatedData
                let createQuotation = await this.tempQuotationItemModel.bulkCreate(formatedData)
            }

            let getTempQuotationList = await this.tempQuotationItemModel.findAll({where:{doc_number:doc_number},order:[["id","ASC"]]})
            return responseMessageGenerator('success','data saved successfully',getTempQuotationList)

        }catch(error){
            console.log(error);
            return responseMessageGenerator('failure','something went wrong',error.message)
            

        }
    }
    async getSingleQuotationList(record_id:number):Promise<any>{
        try{

            let getTempQuotationList = await this.tempQuotationItemModel.findOne({where:{id:record_id}})
            return responseMessageGenerator('success','data fetched successfully',getTempQuotationList)

        }catch(error){
            console.log(error);
            return responseMessageGenerator('failure','something went wrong',error.message)
            

        }
    }
    async resetTempQuotationData(doc_number:string):Promise<any>{
        try{

            let getTempQuotationList = await this.tempQuotationItemModel.destroy({where:{doc_number:doc_number}})
            return responseMessageGenerator('success','data reset successfully',getTempQuotationList)

        }catch(error){
            console.log(error);
            return responseMessageGenerator('failure','something went wrong',error.message)
            

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
}
