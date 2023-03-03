import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
// import { User } from '../user/types/user.entity';
// import { InjectRepository } from '@nestjs/typeorm';
// import { Repository } from 'typeorm';
import { CognitoService } from './cognito/cognito.service';

@Injectable()
export class AuthService {
  constructor(
    // @InjectRepository(User) private userRepository: Repository<User>,
    private cognitoService: CognitoService,
  ) {}

  async verifyJwt(jwt: string): Promise<Boolean> {
    try {
      const userPayload = await this.cognitoService.validate(jwt);
      // if (!userPayload || !userPayload.email) throw new NotFoundException();
      // // const user = await this.userRepository.findOneOrFail({
      // //   email: userPayload.email,
      // // });
      // return user;
    
      return true; 
    } catch (e) {
      throw new UnauthorizedException();
    }
  }
}
