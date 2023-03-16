import { Injectable } from '@nestjs/common';
import * as dotenv from 'dotenv';
import { CognitoWrapper } from './cognito.wrapper';

dotenv.config();
@Injectable()
export class CognitoService {
  constructor(private cognitoWrapper: CognitoWrapper) {}

  async validate(jwt: string) {
    return await this.cognitoWrapper.validate(jwt);
  }
}
