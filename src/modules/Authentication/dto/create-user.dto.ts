export class userDto{
    user_name:string
    user_email:string    
    password:string
    phone_number: number;
    user_temp_password: string
    verification_code: number;
}

export class EmployeeSignUpDto {
    user_name: string
    user_email: string
    phone_number: number;
    password: string
}