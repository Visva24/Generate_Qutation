import { IsEmail, IsNotEmpty } from 'class-validator';

export class userDto{
    user_name:string
    user_email:string    
    password:string
    phone_number: string;
    user_temp_password: string
    verification_code: number;
}

export class EmployeeSignUpDto {
    user_name: string
    user_email: string
    phone_number: string;
    user_password: string
    passcode: string
}
export class EmployeeSignInDto {  
    @IsNotEmpty({ message: 'Email is required.' })
    @IsEmail({}, { message: 'Invalid email address. Please enter a valid email.' })
    user_email: string

    @IsNotEmpty({ message: 'Password is required.' })
    user_password: string
}