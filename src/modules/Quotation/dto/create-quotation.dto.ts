
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
        is_revised:boolean
        revision_count:number
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

/*challan*/

export class deliveryChallanFormDto {
            customer_name:string
            customer_reference_id:string
            doc_number:string
            doc_date:Date
            contact_person:string
            email:string
            contact_number:string
            customer_reference:string
            address:string
            remark_brand:string
            reference_date:Date
            auth_signature:any
            delivery_by:string
            receiver_sign_stamp:string
            is_revised:boolean
            revision_count:number
            created_user_id:number
            quotation_id:number
            is_form_move_forward:boolean
            is_record_saved:boolean
}
export class InvoiceFormDto {
            customer_name:string
            customer_reference_id:string
            doc_number:string
            doc_date:Date
            contact_person:string
            email:string
            contact_number:string
            customer_reference:string
            address:string
            remark_brand:string
            reference_date:Date
            auth_signature:any
            delivery_by:string
            receiver_sign_stamp:string
            is_revised:boolean
            revision_count:number
            created_user_id:number
            quotation_id:number
            delivery_challan_id:number
            sub_total:number
            total_discount:number
            total_tax:number
            grand_total:number
            dn_number:number
            quotation_validity:string
            payment_terms:string
            sales_employee:string
            amount_in_words:string
            payment_mode:string
            currency:string
            is_form_move_forward:boolean
            is_record_saved:boolean
}

export class InvoiceListDto {
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


export class ChallanListDto {
          delivery_id: number;
          item_number: string;
          description: string;
          quantity: number;
          units: string;        
}