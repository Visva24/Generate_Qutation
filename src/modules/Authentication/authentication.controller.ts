import { Body, Controller, Post, Query } from '@nestjs/common';
import { ApiBody, ApiTags } from '@nestjs/swagger';
import { ApiResponse } from 'src/common/util/helper.config';
import { AuthenticationService } from './authentication.service';
import { EmployeeSignInDto, EmployeeSignUpDto } from './dto/create-user.dto';
import { saveSignInDetails, saveSignUpDetails } from './sample/user.sample';

@ApiTags('Users')
@Controller('authentication')
export class AuthenticationController {
    constructor(
        private readonly authenticationService: AuthenticationService,  
      ) { }
      

  @ApiBody({
    schema: {
      type: 'array'
    },
    examples: {
      example: {
        value: saveSignInDetails
      }
    }

  })
  @Post("sign-in")
  async signIn(@Body() userData: EmployeeSignInDto) {
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
