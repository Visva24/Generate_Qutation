import { InferAttributes, InferCreationAttributes } from "sequelize";
import { AutoIncrement, BelongsTo, Column, DataType, ForeignKey, Table,Model, HasMany } from "sequelize-typescript";
import { cashType, paymentModeType } from "../enum/quotation.enum";


@Table({tableName:"quotation_form"})
export class QuotationFormRepository extends Model <InferCreationAttributes<QuotationFormRepository>,InferAttributes<QuotationFormRepository>>{

    @Column({ autoIncrement: true, primaryKey: true })
    id:number

    @Column
    customer_name:string

    @Column
    customer_reference_id:string

    @Column
    doc_number:string

    @Column(DataType.DATE)
    doc_date:Date

    @Column
    contact_person:string

    @Column
    email:string

    @Column
    contact_number:string

    @Column
    customer_reference:string

    @Column(DataType.ENUM(...Object.values(paymentModeType)))
    payment_mode:string

    @Column(DataType.ENUM(...Object.values(cashType)))
    currency:string

    @Column
    quotation_validity:string

    @Column
    address:string

    @Column
    remark_brand:string

    @Column
    delivery:string

    @Column(DataType.DECIMAL)
    sub_total:number

    @Column(DataType.DECIMAL)
    total_discount:number

    @Column(DataType.DECIMAL)
    total_tax:number

    @Column(DataType.DECIMAL)
    grand_total:number

    @Column(DataType.JSON)
    quotation_list:any

    
}

@Table({tableName:"quotation_list"})
export class QuotationListRepository extends Model <InferCreationAttributes<QuotationListRepository>,InferAttributes<QuotationListRepository>>{

    @Column({ autoIncrement: true, primaryKey: true })
    id:number

    @BelongsTo(() => QuotationFormRepository, { as: 'quotation_form' })
    quotation_form: QuotationFormRepository;

    @ForeignKey(() => QuotationFormRepository)
    @Column
    quotation_id:number

    @Column
    item_number:number

    @Column
    description:string

    @Column
    quantity:number

    @Column
    units:string

    @Column(DataType.DECIMAL)
    price:number

    @Column(DataType.DECIMAL)
    discount:number

    @Column(DataType.DECIMAL)
    tax:number
 
}