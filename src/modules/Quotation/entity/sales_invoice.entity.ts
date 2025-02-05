import { InferAttributes, InferCreationAttributes } from "sequelize";
import { AutoIncrement, BelongsTo, Column, DataType, ForeignKey, Table,Model, HasMany } from "sequelize-typescript";
import { cashType, documentType, paymentModeType } from "../enum/quotation.enum";
import { UserRepository } from "src/modules/authentication/entity/users.entity";
import { QuotationFormRepository } from "./quotation.entity";
import { deliveryChallanRepository } from "./delivery_challan.entity";


@Table({tableName:"sales_invoice"})
export class SalesInvoiceFormRepository extends Model <InferCreationAttributes<SalesInvoiceFormRepository>,InferAttributes<SalesInvoiceFormRepository>>{

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

    @Column(DataType.DATE)
    reference_date:Date

    @Column
    dn_number:number

    @Column
    quotation_validity:string

    @Column
    address:string

    @Column
    remark_brand:string

    @Column
    payment_terms:string

    @Column
    sales_employee:string

    @Column
    amount_in_words:string

    @Column(DataType.DECIMAL)
    sub_total:number

    @Column(DataType.DECIMAL)
    total_discount:number

    @Column(DataType.DECIMAL)
    total_tax:number

    @Column(DataType.DECIMAL)
    grand_total:number

    @Column(DataType.JSON)
    auth_signature:any

    @Column
    delivery_by:string

    @Column
    receiver_sign_stamp:string

    @Column({defaultValue:false})
    is_revised:boolean

    @Column({defaultValue:0})
    revision_count:number

    @BelongsTo(()=>UserRepository,{as:"users",foreignKey:'created_user_id'})
    users:UserRepository
    @ForeignKey(()=>UserRepository)
    @Column
    created_user_id:number

    @BelongsTo(()=>QuotationFormRepository,{as:"quotation_form",foreignKey:'quotation_id'})
      quotation_form:QuotationFormRepository
    
    @ForeignKey(()=>QuotationFormRepository)
    @Column({ type: DataType.INTEGER, allowNull: true })
    quotation_id:number

    @BelongsTo(()=>deliveryChallanRepository,{as:"delivery_challan",foreignKey:'delivery_challan_id'})
    delivery_challan:deliveryChallanRepository
    
    @ForeignKey(()=>deliveryChallanRepository)
    @Column({ type: DataType.INTEGER, allowNull: true })
    delivery_challan_id:number

    @HasMany(() => SalesItemRepository)
    sales_items: SalesItemRepository[];
    
}
@Table({tableName: 'sales_items'})
export class SalesItemRepository extends Model <InferCreationAttributes<SalesItemRepository>,InferAttributes<SalesItemRepository>>{
    @Column({autoIncrement: true,primaryKey: true})
    id: number;
  
    @ForeignKey(() => SalesInvoiceFormRepository)
    @Column({type: DataType.INTEGER})
    invoice_id: number;
  
    @BelongsTo(() => SalesInvoiceFormRepository)
    sales_invoice: SalesInvoiceFormRepository;
  
    @Column({type: DataType.STRING})
    item_number: string;
  
    @Column({type: DataType.STRING})
    description: string;
  
    @Column({type: DataType.INTEGER})
    quantity: number;

    @Column({type: DataType.STRING})
    units: string;
  
    @Column({type: DataType.DECIMAL(10, 2), allowNull: false})
    price: number;
  
    @Column({type: DataType.DECIMAL(10, 2), allowNull: false})
    discount: number;
  
    @Column({type: DataType.DECIMAL(10, 2), allowNull: false})
    amount: number;
}
@Table({tableName: 'temp_sales_items'})
export class TempSalesItemRepository extends Model <InferCreationAttributes<TempSalesItemRepository>,InferAttributes<TempSalesItemRepository>>{
    @Column({autoIncrement: true, primaryKey: true})
    id: number;
    
    @Column({type: DataType.STRING})
    item_number: string;

    @Column({type: DataType.STRING})
    doc_number: string;
  
    @Column({type: DataType.STRING})
    description: string;
  
    @Column({type: DataType.INTEGER})
    quantity: number;
  
    @Column({type: DataType.STRING})
    units: string;
  
    @Column({type: DataType.DECIMAL(10, 2), allowNull: false})
    price: number;
  
    @Column({type: DataType.DECIMAL(10, 2), allowNull: false})
    discount: number;
  
    @Column({type: DataType.DECIMAL(10, 2), allowNull: false})
    amount: number;
}