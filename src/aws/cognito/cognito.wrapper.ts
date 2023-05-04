import { Injectable } from '@nestjs/common';
import { CognitoJwtVerifier} from "aws-jwt-verify";
import {
  ListUsersCommand,
  CognitoIdentityProviderClient,
} from "@aws-sdk/client-cognito-identity-provider";
import * as dotenv from 'dotenv';
import { CognitoUser} from './User.client';


// incase things break https://github.com/awslabs/aws-jwt-verify 
dotenv.config();
@Injectable()
export class CognitoWrapper {
  userPoolId: string = process.env.AWS_USER_POOL_ID; 

  verifier = CognitoJwtVerifier.create({
    userPoolId: this.userPoolId,  
    tokenUse: "access", 
    clientId: process.env.AWS_ACCESS_KEY, 
  }); 

  // TODO : uhhhhh does this require no credentials? I think that it may have something to with how we set up credentialproviders, but not sure... Can anyone get our users' attributes if they have our region and user pool id?
  serviceProvider = new CognitoIdentityProviderClient({ region: process.env.AWS_USER_POOL_REGION });
 
  async validate(jwt: string) {
    try {
      const payload = await this.verifier.verify(jwt); 
      return payload 
    } catch (error){
      console.log(error); 
      console.log("Authentication error! See cognito wrapper"); 
    }
  }

  /**
   * Gets all user data from the current Cognito user pool.
   * @returns 
   */
  async getUsers() {
    // Reference : https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-cognito-identity-provider/
    try {
      // Create list of users to be returned 
      const userData = await this.listUsers(this.userPoolId);

      console.log(userData);
      if (userData == null) {
        throw new Error("Issue with retrieving user data from user pool.");
      }

      return userData.map(user => CognitoUser.parse(user));
    } catch (error) {
      console.log(error);
      return [];
    }
  }

  /**
   * Gets users that match the userIds passed in by making a separate request for each userId to Cognito.
   */
  async getUsersByIds(userIDs: string[]) {
    // Reference : https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-cognito-identity-provider/
    try {
      // Create list of users to be returned 
      const users: CognitoUser[] = [];

      // TODO : There is a read limit of 30 calls per seconds for ListUsers, will need to do throttling here if over 30.
      // May also want to eventually do re-calls with exponential backoff
      for ( const userID of userIDs ) {
        var filter =  `sub = \"${ userID }\"`;
        var limit = 1

        const data = await this.listUsers(this.userPoolId, filter, limit);

        console.log(data);
        if (data == null || data.length === 0) {
          throw new Error(`User could not be found: ${ userID }`);
        }

        users.push(CognitoUser.parse(data[0]));
      }

      return users;
    } catch (error) {
      console.log(error);
      return [];
    }
  }

  async listUsers (userPoolId: string, filter?: string, limit?: number) {  
    const command = new ListUsersCommand({
      UserPoolId: userPoolId,
      Filter: filter,
      Limit: limit
    });
  
    return this.serviceProvider.send(command)
      .then((data) => data.Users);
  };
}
