import { Injectable } from '@nestjs/common';
import * as AWS from 'aws-sdk';
import 'cross-fetch/polyfill';
import * as dotenv from 'dotenv';
import { AwsCreateUserServiceWrapper } from './aws-create-user.wrapper';

dotenv.config();

@Injectable()
export class AwsCreateUserService {
  private cognitoClient: AWS.CognitoIdentityServiceProvider;
  constructor(private awsCreateUserServiceWrapper: AwsCreateUserServiceWrapper) {
    this.awsCreateUserServiceWrapper.configureAws();
    this.cognitoClient = this.awsCreateUserServiceWrapper.instantiateCognitoClient();
  }

  public async adminCreateUser(
    email: string,
  ): Promise<AWS.CognitoIdentityServiceProvider.UserType> {
    const poolData = {
      UserPoolId: process.env.AWS_USER_POOL_ID,
      Username: email,
      DesiredDeliveryMediums: ['EMAIL'],
      UserAttributes: [
        {
          Name: 'email',
          Value: email,
        },
        {
          Name: 'email_verified',
          Value: 'true',
        },
      ],
    };
    return new Promise((resolve, reject) => {
      this.cognitoClient.adminCreateUser(poolData, (error, data) => {
        if (error) {
          reject(error);
        } else {
          resolve(data.User);
        }
      });
    });
  }
}
