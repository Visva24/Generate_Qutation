import { Body, Controller, Post, Query } from '@nestjs/common';
import { ApiBody, ApiTags } from '@nestjs/swagger';
import { ApiResponse } from 'src/common/util/helper.config';
import { AuthenticationService } from './authentication.service';
import { EmployeeSignUpDto } from './dto/create-user.dto';
import { saveSignUpDetails } from './sample/user.sample';

@ApiTags('Users')
@Controller('authentication')
export class AuthenticationController {
    constructor(
        private readonly authenticationService: AuthenticationService,  
      ) { }
  @ApiBody({
    schema:{
      type:"array"
    },examples:{
      example:{
        value:{user_email:"qg123@gmail.com",
          user_password: "Abs@123123"
      }
    }
}})
  @Post("sign-in")
  async signIn(@Body() userData: {user_email: string,user_password: string}) {
    return this.authenticationService.signIn( userData.user_email,userData.user_password)
  }

  
  
  @Post('sign-up')
  @ApiBody({
    schema: {
      type: 'array'
    },
    examples: {
      example: {
        value: saveSignUpDetails
      }
    }

  })
  async create(@Body() signUpDetails: EmployeeSignUpDto): Promise<ApiResponse> {
    return await this.authenticationService.signUp(signUpDetails);
  } 
}
