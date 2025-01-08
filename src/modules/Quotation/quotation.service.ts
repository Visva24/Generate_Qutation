import { Injectable } from '@nestjs/common';
import { log } from 'node:console';
import { responseMessageGenerator } from 'src/common/util/helper.config';
import { QuotationFormDto } from './dto/create-quotation.dto';
import { InjectModel } from '@nestjs/sequelize';
import { QuotationFormRepository, QuotationListRepository } from './entity/quotation.entity';
import { UpdateQuotationFormDto } from './dto/update-quotation.dto';

@Injectable()
export class QuotationService {
    constructor(
        @InjectModel(QuotationFormRepository) private QuotationFormModel : typeof QuotationFormRepository,
        @InjectModel(QuotationListRepository) private QuotationListModel : typeof QuotationListRepository,
    ){

    }

    async getQuotationFormData():Promise<any>{
        try{

        let getQuotationData =  await this.QuotationFormModel.findAll()

        }catch(error){
            console.log(error);
            
        }
    }

    async createQuotationForm(QuotationForm:QuotationFormDto):Promise<any>{
        try{

             let createQuotation = await this.QuotationFormModel.create(QuotationForm)
            //  if(createQuotation){
            //     let quotationId =createQuotation.id
            //     for(let singleData of QuotationForm.quotation_list_array){
            //         let obj ={}
            //         Object.assign(obj,{
            //             ...singleData,
            //             quotation_id:quotationId
            //         })
            //         let createQuotation = await this.QuotationListModel.create(obj)
            //     }
            //  }
             return responseMessageGenerator('success','data saved successfully',[])

        }catch(error){
            console.log(error);
            return responseMessageGenerator('failure','something went wrong',error.message)
            

        }
    }
    async updateQuotationForm(id:number,UpdateQuotationForm:UpdateQuotationFormDto):Promise<any>{
        try{

             let updateQuotation = await this.QuotationFormModel.update({...UpdateQuotationForm},{where:{id:id}})
            //  if(updateQuotation){
                
            //     for(let singleData of UpdateQuotationForm.quotation_list_array){
            //         let obj ={}
            //         Object.assign(obj,{
            //             ...singleData,
            //             quotation_id:id
            //         })
            //         let update = await this.QuotationListModel.create(obj)
            //     }
            //  }
             return responseMessageGenerator('success','data updated successfully',[])

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
