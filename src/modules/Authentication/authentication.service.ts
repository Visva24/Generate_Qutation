import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ApiResponse, jwtConstants, responseMessageGenerator } from 'src/common/util/helper.config';
import { UserRepository } from './entity/users.entity';
import { InjectModel } from '@nestjs/sequelize';
import { genSaltSync, hashSync, compareSync } from "bcrypt";
import { EmployeeSignUpDto } from './dto/create-user.dto';

@Injectable()
export class AuthenticationService {
   
    

    constructor(
        @InjectModel(UserRepository) private userModel : typeof UserRepository,
        private jwtService: JwtService,
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
              "This email ID already exists in our database. Please log in with the same ID or use a different email to sign up for Think",
              []
            )
          }
         
          const salt = genSaltSync(10);
          const hashedPassword = hashSync(signUpDetails.password, salt);
          const UserData = {
            user_name: signUpDetails.user_name,
            user_email: signUpDetails.user_email,
            user_password: hashedPassword,
            status: 1,
            active_status: 1,
            is_owner: true
          }
    
          const saveUserData = await this.userModel.create(UserData)
    
          return await responseMessageGenerator('success',
            "Congratulations! Welcome to our Think family! We are preparing your customized world-class HR technology application",
            { }
          )
    
        } catch (error) {
          console.error((error as Error).message);
          
        }
      }

    async signIn(user_email: string, user_password: string): Promise<ApiResponse> {
        try {

          let condition: any = {};
            let emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            let isEmail = emailRegex.test(user_email);
          condition = { user_email: (user_email).toUpperCase().trim() }
          //  if(isEmail == false){
          //    return responseMessageGenerator(
          //     'failure',
          //     "Invalid Email ID",
          //     []
          //   );
          //  }
          const user = await this.userModel.findOne({ where: condition });
          
          if (user == null)
            return responseMessageGenerator(
              'failure',
              "Invalid  Email ID",
              []
            );
         
          const comparing = compareSync(user_password, user?.password);
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
            // user: {
            //   user_email: user.user_email,
            //   user_name: user.user_name,
            // },
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
