import { InferAttributes, InferCreationAttributes } from "sequelize";
import {BelongsTo, Column, DataType, ForeignKey, Model, Table } from "sequelize-typescript";

@Table({tableName:"users"})
export class UserRepository extends Model<InferCreationAttributes<UserRepository>,InferAttributes<UserRepository>>{
    @Column({ autoIncrement: true, primaryKey: true })
    id: number;
  
    @Column
    user_name: string;
  
    @Column
    user_email: string;

    @Column
    phone_number: number;
  
    @Column
    password: string;
  
    @Column
    user_temp_password: string
  
    @Column
    verification_code: number;
  
    @Column(DataType.JSON())
    avatar: any;
  

    @Column({ defaultValue: false })
    is_default_password_updated: boolean
  
    @Column({ defaultValue: false })
    is_owner: boolean;
  
    @Column({ defaultValue: false })
    is_deleted: boolean;

}