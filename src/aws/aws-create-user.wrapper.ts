import { Injectable } from '@nestjs/common';
import * as AWS from 'aws-sdk';
import * as dotenv from 'dotenv';
dotenv.config();

@Injectable()
export class AwsCreateUserServiceWrapper {
  configureAws(): void {
    AWS.config.update({
      accessKeyId: process.env.AWS_ACCESS_KEY,
      secretAccessKey: process.env.AWS_SECRET_KEY,
      region: process.env.AWS_USER_POOL_REGION,
    });
  }

  instantiateCognitoClient(): AWS.CognitoIdentityServiceProvider {
    return new AWS.CognitoIdentityServiceProvider({
      apiVersion: '2016-04-19',
      region: process.env.AWS_USER_POOL_REGION,
    });
  }
}
