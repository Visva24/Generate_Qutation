import { Injectable, InternalServerErrorException, NestMiddleware, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';


@Injectable()
export class JwtMiddleware implements NestMiddleware {
  constructor(private readonly jwtService: JwtService) { }

  async use(req: any, res: any, next: () => void) {
    const { url, baseUrl, method, headers } = req;
    if (baseUrl === '/users/sign-in' || baseUrl === '/Users/verify-user-with-otp' || baseUrl === '/users/activate-employee-domain'
      || baseUrl === '/users/forget-password' || baseUrl === '/users/sign-up'
      || baseUrl === '/users/sign-up-google-email' || baseUrl === '/users/rest-password'
      || baseUrl === '/users/get-user-validation'
      || method === 'GET' && method === 'POST') {
      // Exclude sign-in route from bearer token authentication

      // Exclude sign-in route from bearer token authentication
      return next();
    }
    const authorizationHeader = req.headers.authorization;
    if (!authorizationHeader || !authorizationHeader.startsWith('Bearer')) {
      throw new InternalServerErrorException('Unauthorized');
    }
    const token = authorizationHeader.split(' ')[1];
    req.token = token; // Attach token to request for JwtAuthGuard to access
    try {
      const decoded = this.jwtService.verify(token, { secret: jwtConstants.secret });
      if (decoded) {
        next();
      } else {
        throw new InternalServerErrorException('Unauthorized');
      }
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        throw new UnauthorizedException('Token expired', 'EXPIRED_TOKEN');
      } else {
        throw new InternalServerErrorException('Unauthorized');
      }
    }

  }

}

const jwtConstants = {
    secret: 'f98baadf322a8a7fac3a.',
 
}
