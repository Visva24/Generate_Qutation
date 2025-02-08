import { InferAttributes, InferCreationAttributes } from "sequelize";
import { AutoIncrement, BelongsTo, Column, DataType, ForeignKey, Table,Model, HasMany } from "sequelize-typescript";
import { cashType, documentType, paymentModeType } from "../enum/quotation.enum";
import { UserRepository } from "src/modules/authentication/entity/users.entity";
import { QuotationFormRepository } from "./quotation.entity";


@Table({tableName:"delivery_challan"})
export class deliveryChallanRepository extends Model <InferCreationAttributes<deliveryChallanRepository>,InferAttributes<deliveryChallanRepository>>{

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

    @Column
    address:string

    @Column
    remark_brand:string

    @Column(DataType.DATE)
    reference_date:Date

    @Column(DataType.JSON)
    auth_signature:any

    // @Column
    // delivery:string

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

    @HasMany(() => DeliveryItemRepository)
    delivery_items: DeliveryItemRepository[];
    
    @Column({defaultValue:false})
    is_form_move_forward:boolean

    @Column({defaultValue:false})
    is_record_saved:boolean
    
}


interface QuotationItem {
    quotation_id: number;
    item_number: number;
    description: string;
    quantity: number;
    units: string;
    price: number;
    discount: number;
    tax: number;
    amount:number
  }

@Table({tableName: 'delivery_items'})
export class DeliveryItemRepository extends Model <InferCreationAttributes<DeliveryItemRepository>,InferAttributes<DeliveryItemRepository>>{
    @Column({ autoIncrement: true,primaryKey: true})
    id: number;
  
    @ForeignKey(() => deliveryChallanRepository)
    @Column({type: DataType.INTEGER})
    delivery_id: number;
  
    @BelongsTo(() => deliveryChallanRepository)
    delivery_challan: deliveryChallanRepository;
  
    @Column({type: DataType.STRING})
    item_number: string;
  
    @Column({type: DataType.STRING})
    description: string;
  
    @Column({type: DataType.INTEGER,})
    quantity: number;
  
    @Column({type: DataType.STRING})
    units: string;

}
@Table({tableName: 'temp_delivery_items'})
export class TempDeliveryItemRepository extends Model <InferCreationAttributes<TempDeliveryItemRepository>,InferAttributes<TempDeliveryItemRepository>>{
    @Column({autoIncrement: true,primaryKey: true})
    id: number;
    
    @Column({type: DataType.STRING})
    item_number: string;

    @Column({type: DataType.STRING})
    doc_number: string;
  
    @Column({ type: DataType.STRING})
    description: string;
  
    @Column({type: DataType.INTEGER})
    quantity: number;
  
    @Column({ type: DataType.STRING})
    units: string;
}