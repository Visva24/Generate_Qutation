import { Injectable } from '@nestjs/common';
import { existsSync, mkdirSync, readFileSync } from 'fs';
import handlebars, { log } from 'handlebars';
import puppeteer from 'puppeteer';
import { promises as fsPromises } from 'fs';
import { join } from 'path';
import { InjectModel } from '@nestjs/sequelize';
import { UserRepository } from 'src/modules/authentication/entity/users.entity';
import { ApiResponse, responseMessageGenerator } from 'src/common/util/helper.config';


@Injectable()
export class HelperService {
    constructor(@InjectModel(UserRepository) private userModel: typeof UserRepository){
      
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
    async getUserDetails(user_id:number): Promise<ApiResponse> {
    try{
         let userData = await this.userModel.findOne({where:{id:user_id}})
         return responseMessageGenerator('success','data fetched successfully',userData)
     } catch (error) {
        console.log(error);
        return responseMessageGenerator('failure','something went wrong',error.message)  
     }
 
  }
}
