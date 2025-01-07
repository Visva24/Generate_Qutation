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

  @Post("sign-in")
  async signIn(@Query('user_email') user_email: string,@Query('user_password') user_password: string) {
    return this.authenticationService.signIn( user_email,user_password)
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
