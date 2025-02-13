import { Injectable } from '@nestjs/common';
import { existsSync, mkdirSync, readFileSync } from 'fs';
import handlebars, { log } from 'handlebars';
// import puppeteer from 'puppeteer';
import { promises as fsPromises } from 'fs';
import { join } from 'path';
import { InjectModel } from '@nestjs/sequelize';
import { ApiResponse, responseMessageGenerator } from 'src/common/util/helper.config';
import puppeteer from 'puppeteer';
import { UserRepository } from 'src/modules/Authentication/entity/users.entity';
import { cashType } from 'src/modules/Quotation/enum/quotation.enum';


@Injectable()
export class HelperService {
    constructor(@InjectModel(UserRepository) private userModel: typeof UserRepository) {

    }

    async generatePdfFromTemplate(uploadDir: string, templateName: string, data: any, file: string): Promise<any> {
        try {
            // Ensure directory exists
            const quotationDir = `${uploadDir}`;
            if (!existsSync(quotationDir)) {
                mkdirSync(quotationDir, { recursive: true });
                console.log('Directory created successfully!');
            }

            // Load and compile Handlebars template
            // const templateHtml = readFileSync(`/app/dist/modules/Mail/templates/letter/${templateName}.hbs`, 'utf-8');
            const templateHtml = readFileSync(`src/modules/Mail/templates/letter/${templateName}.hbs`, 'utf-8');
            const compiledTemplate = handlebars.compile(templateHtml);
            const htmlContent = compiledTemplate(data);

            // Launch Puppeteer
            const browser = await puppeteer.launch({
                headless: true,
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-gpu',
                ],
            });

            const page = await browser.newPage();
            await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

            // Generate PDF path
            const currentTimestamp = Date.now();
            const pdfPath = join(uploadDir, `${file}_${data.user_code}_${currentTimestamp}.pdf`);

            // Generate and save PDF
            await page.pdf({ path: pdfPath, format: 'A4', printBackground: true });
            await browser.close();

            // Encode PDF to Base64
            const pdfBuffer = await fsPromises.readFile(pdfPath);
            const pdfBase64 = pdfBuffer.toString('base64');

            // Delete temporary PDF
            await fsPromises.unlink(pdfPath).catch((err) => console.warn('Failed to delete PDF:', err));

            // Return as Data URL
            return `data:application/pdf;base64,${pdfBase64}`;
        } catch (error) {
            console.error('Error generating PDF:', error);
            throw new Error('PDF generation failed');
        }
    }
    async getUserDetails(user_id: number): Promise<ApiResponse> {
        try {
            let userData = await this.userModel.findOne({ where: { id: user_id } })
            return responseMessageGenerator('success', 'data fetched successfully', userData)
        } catch (error) {
            console.log(error);
            return responseMessageGenerator('failure', 'something went wrong', error.message)
        }

    }
    async getShortName(fullName: string): Promise<any> {
        const nameParts = fullName?.split(' ');
        if (!nameParts) return '';

        let shortName = '';

        if (nameParts.length === 1) {
            // Case 1: Single-word name
            shortName = nameParts[0]?.substring(0, 2).toUpperCase();
        } else if (nameParts.length >= 2) {
            // Case 2 and 3: Two or more words
            const firstNameInitial = nameParts[0]?.charAt(0).toUpperCase() || '';
            const secondNameInitial = nameParts[1]?.charAt(0).toUpperCase() || '';
            shortName = `${firstNameInitial}${secondNameInitial}`;
        }

        return shortName;
    }


    //    async numberToWord(num: number, currency: string = "INR"): Promise<string> {
    //         const singleDigits = [
    //             "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine"
    //         ];
    //         const teens = [
    //             "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"
    //         ];
    //         const tens = [
    //             "", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"
    //         ];

    //         // Define number units based on the currency type
    //         const thousands = currency === "INR" ? ["", "Thousand", "Lakh", "Crore"] : ["", "Thousand", "Million", "Billion"];

    //         function convertHundred(num: number): string {
    //             let str = "";
    //             if (num > 99) {
    //                 str += singleDigits[Math.floor(num / 100)] + " Hundred ";
    //                 num = num % 100;
    //             }
    //             if (num > 9 && num < 20) {
    //                 str += teens[num - 10] + " ";
    //             } else {
    //                 str += tens[Math.floor(num / 10)] + " " + singleDigits[num % 10] + " ";
    //             }
    //             return str.trim();
    //         }

    //         function convertToWords(num: number): string {
    //             if (num === 0) return "Zero";
    //             let word = "";
    //             let isBillion = false;
    //             let isMillion = false;
    //             let isThousands = false;

    //             const parts = [];
    //             if (currency !== "INR") {
    //                 if (num >= 1000000000) { // Billions
    //                     parts.push(Math.floor(num / 1000000000));
    //                     isBillion = true;
    //                     num = num % 1000000000;
    //                 }
    //                 if (num >= 1000000) { // Millions
    //                     parts.push(Math.floor(num / 1000000));
    //                     isMillion = true;
    //                     num = num % 1000000;
    //                 }
    //             } else {
    //                 if (num >= 10000000) { // Crores
    //                     parts.push(Math.floor(num / 10000000));
    //                     isBillion = true;
    //                     num = num % 10000000;
    //                 }
    //                 if (num >= 100000) { // Lakhs
    //                     parts.push(Math.floor(num / 100000));
    //                     isMillion = true;
    //                     num = num % 100000;
    //                 }
    //             }

    //             if (num >= 1000) { // Thousands
    //                 parts.push(Math.floor(num / 1000));
    //                 isThousands = true;
    //                 num = num % 1000;
    //             }
    //             parts.push(num); // Remaining hundreds or below

    //             for (let i = 0; i < parts.length; i++) {
    //                 if (parts[i] > 0) {
    //                     if (isBillion) {
    //                         word += convertHundred(parts[i]) + " " + thousands[3] + " ";
    //                         isBillion = false;
    //                         continue;
    //                     } else if (isMillion) {
    //                         word += convertHundred(parts[i]) + " " + thousands[2] + " ";
    //                         isMillion = false;
    //                         continue;
    //                     } else if (isThousands) {
    //                         word += convertHundred(parts[i]) + " " + thousands[1] + " ";
    //                         isThousands = false;
    //                         continue;
    //                     } else {
    //                         word += convertHundred(parts[i]) + " ";
    //                     }
    //                 }
    //             }

    //             return word.trim();
    //         }

    //         // Determine currency label
    //         let currencyLabel = "Rupees";
    //         if (currency === "QAR") {
    //             currencyLabel = "Qatari Riyals";
    //         } else if (currency === "SAR") {
    //             currencyLabel = "Saudi Riyals";
    //         }

    //         return convertToWords(num) + ` ${currencyLabel} only`;
    //     }

    async numberToWord(num: number, currency: string): Promise<string> {
        const singleDigits = [
            "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine"
        ];
        const teens = [
            "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"
        ];
        const tens = [
            "", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"
        ];

        // Define numbering system based on currency type
        const thousands = (currency === "INR")
            ? ["", "Thousand", "Lakh", "Crore"]
            : ["", "Thousand", "Million", "Billion"];

        function convertHundred(num: number): string {
            let str = "";
            if (num > 99) {
                str += singleDigits[Math.floor(num / 100)] + " Hundred ";
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
            if (num === 0) return "Zero";
            let word = "";
            let isBillion = false;
            let isMillion = false;
            let isThousands = false;

            const parts = [];

            if (currency !== "INR") {
                // USD, QAR, SAR -> Millions/Billions format
                if (num >= 1000000000) { // Billions
                    parts.push(Math.floor(num / 1000000000));
                    isBillion = true;
                    num = num % 1000000000;
                }
                if (num >= 1000000) { // Millions
                    parts.push(Math.floor(num / 1000000));
                    isMillion = true;
                    num = num % 1000000;
                }
            } else {
                // INR -> Lakhs/Crores format
                if (num >= 10000000) { // Crores
                    parts.push(Math.floor(num / 10000000));
                    isBillion = true;
                    num = num % 10000000;
                }
                if (num >= 100000) { // Lakhs
                    parts.push(Math.floor(num / 100000));
                    isMillion = true;
                    num = num % 100000;
                }
            }

            if (num >= 1000) { // Thousands
                parts.push(Math.floor(num / 1000));
                isThousands = true;
                num = num % 1000;
            }
            console.log(num);


            parts.push(num); // Remaining hundreds or below

            for (let i = 0; i < parts.length; i++) {
                if (parts[i] > 0) {
                    if (isBillion) {
                        word += convertHundred(parts[i]) + " " + thousands[3] + " ";
                        isBillion = false;
                        continue;
                    } else if (isMillion) {
                        word += convertHundred(parts[i]) + " " + thousands[2] + " ";
                        isMillion = false;
                        continue;
                    } else if (isThousands) {
                        word += convertHundred(parts[i]) + " " + thousands[1] + " ";
                        isThousands = false;
                        continue;
                    } else {
                        word += convertHundred(parts[i]) + " ";
                    }
                }
                console.log(word);

            }

            return word.trim();
        }

        // Determine currency label
        let currencyLabel = "Rupees";
        if (currency === cashType.QAR) {
            currencyLabel = "Qatari Riyals";
        } else if (currency === cashType.SAR) {
            currencyLabel = "Saudi Riyals";
        } else if (currency === cashType.USD) {
            currencyLabel = "US Dollars";
        }
        //   return convertToWords(num)
        return convertToWords(num) + ` ${currencyLabel} only`;
    }

}
