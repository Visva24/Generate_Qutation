import { Injectable } from '@nestjs/common';
import { ApiResponse, jwtConstants, responseMessageGenerator } from 'src/common/util/helper.config';
import { UserRepository } from './entity/users.entity';
import { InjectModel } from '@nestjs/sequelize';
import { genSaltSync, hashSync, compareSync } from "bcrypt";
import { EmployeeSignUpDto } from './dto/create-user.dto';

@Injectable()
export class AuthenticationService {
    jwtService: any;

    constructor(
        @InjectModel(UserRepository) private userModel : typeof UserRepository
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
            user_password: hashedPassword,
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

    async signIn(email: string, user_password: string): Promise<ApiResponse> {
        try {

          let condition: any = {};
         
          condition = { user_email: (email).toUpperCase().trim() }
    
          const user = await this.userModel.findOne({ where: condition });
          if (!user)
            responseMessageGenerator(
              'failure',
              "Invalid Employee code or Email ID",
              []
            );
    
          const comparing = compareSync(user_password, user.password);
          if (!comparing) {
            responseMessageGenerator(
            'failure',
              "Invalid Password",
              []
            );
          }
    
    
          const accessTokenPayload = {
            user_id: user.id,
            user_name: user.user_name,
            user_email: user.user_email,
            is_owner:user.is_owner,
          };
    
          const accessToken = await this.jwtService.signAsync(accessTokenPayload, {
            expiresIn: "1h",
            secret: jwtConstants.secret,
          });
          const refreshToken = await this.jwtService.signAsync(accessTokenPayload, {
            expiresIn: "7d",
            secret: jwtConstants.secret,
          });
    
          const data = {
            access_token: accessToken,
            refresh_token: refreshToken,
            user: {
              user_email: user.user_email,
              user_name: user.user_name,
            },
          };
        
          return await responseMessageGenerator(
            "success",
            "Logged in successfully",
            data
          );
        } catch (error) {
          console.log(error);
         
        }
      }
}
