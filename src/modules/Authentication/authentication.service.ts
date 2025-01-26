import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ApiResponse, jwtConstants, responseMessageGenerator } from 'src/common/util/helper.config';
import { UserRepository } from './entity/users.entity';
import { InjectModel } from '@nestjs/sequelize';
import { genSaltSync, hashSync, compareSync } from "bcrypt";
import { EmployeeSignUpDto } from './dto/create-user.dto';
import { HelperService } from 'src/common/services/helper/helper.service';

@Injectable()
export class AuthenticationService {
   
    

    constructor(
        @InjectModel(UserRepository) private userModel : typeof UserRepository,
        private readonly JwtService :JwtService,
        private readonly helperService :HelperService
    ){

    }

    async signUp(signUpDetails: EmployeeSignUpDto): Promise<ApiResponse> {
        try {
    
          const userData = await this.userModel.findOne({
            where: {
              is_deleted: false,
              user_email: signUpDetails.user_email
            }
          })
    
          if (userData) {
            return await responseMessageGenerator('failure',
              "Email already exists. Please try logging in or use a different email.",
              []
            )
          }
         
          const salt = genSaltSync(10);
          const hashedPassword = hashSync(signUpDetails.password, salt);
          const UserData = {
            user_name: signUpDetails.user_name,
            user_email: signUpDetails.user_email,
            password: hashedPassword,
            phone_number: signUpDetails.phone_number,
            is_owner: true
          }
    
          await this.userModel.create(UserData)
    
          return await responseMessageGenerator('success',
            "Signup successful! You can now log in to your account",
            []
          )
    
        } catch (error) {
          console.log(error);
          return await responseMessageGenerator('failure',
            "something went wrong",
            []
          )
          
        }
    }

    async signIn(user_email: string, user_password: string): Promise<ApiResponse> {
        try {
     
          let condition: any = {};
          
         
            let emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            let isEmail = emailRegex.test(user_email);
          condition = { user_email: (user_email).toUpperCase().trim() }
          if (isEmail == false)
            return  responseMessageGenerator(
               'failure',
               "Invalid email address. Please enter a valid email",
               []
             );
    
          const user = await this.userModel.findOne({ where: condition });
          if (user == null){
            return responseMessageGenerator(
              'failure',
              "Invalid email address. Please enter a valid email",
              []
            );
          }
         
          const comparing = compareSync(user_password, user.password);
          if (!comparing) {
            return responseMessageGenerator(
             'failure',
              "Invalid password. Please try again",
              []
            );
          }
    
    
          const accessTokenPayload = {
            user_id: user.id,
            user_name: user.user_name,
            user_email: user.user_email,
            is_owner:user.is_owner,
          };
    
          const accessToken = await this.JwtService.signAsync(accessTokenPayload, {
            expiresIn: "1h",
            secret: jwtConstants.secret,
          });
          const refreshToken = await this.JwtService.signAsync(accessTokenPayload, {
            expiresIn: "7d",
            secret: jwtConstants.secret,
          });
          let shortName = await this.helperService.getShortName(user.user_name)
    
          const data = {
            access_token: accessToken,
            refresh_token: refreshToken,
            user: {
              user_id: user.id,
              user_email: user.user_email,
              user_name: user.user_name,
              employee: {
                user_name: user.user_name,
                avatar_type: 'short_name',
                avatar_value: shortName
              },
            },
          };
        
          return await responseMessageGenerator(
            "success",
            "Logged in successfully",
            data
          );
        } catch (error) {
          console.log(error);
          return await responseMessageGenerator(
            "success",
            "something went wrong",
            []
          );
        }
    }
}
