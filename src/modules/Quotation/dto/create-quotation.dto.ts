
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
        created_user_id:number
        quotation_list_array:QuotationListDto[]
}
export class QuotationListDto {
        // quotation_id:number
        item_number:string
        description:string
        quantity:number
        units:string
        price:number
        discount:number
        tax:number
        amount:number
        doc_number:string

         
}
export class documentsDto {
           id?:number
           doc_number:string
           doc_type:string
           is_deleted:boolean
}