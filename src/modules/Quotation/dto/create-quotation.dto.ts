
export class QuotationFormDto {
        customer_name:string
        customer_reference_id:string
        doc_number:string
        doc_date:Date
        contact_person:string    
        email:string
        contact_number:string     
        customer_reference:string
        payment_mode:string
        currency:string
        quotation_validity:string
        address:string
        remark_brand:string
        delivery:string
        sub_total:number
        total_discount:number
        total_tax:number
        grand_total:number
        quotation_list_array:QuotationListDto[]
}
export class QuotationListDto {
        quotation_id:number
        item_number:number
        description:string
        quantity:number
        units:string
        price:number
        discount:number
        tax:number
         
}