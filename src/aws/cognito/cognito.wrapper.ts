import { Injectable } from '@nestjs/common';
import { CognitoJwtVerifier} from "aws-jwt-verify";
import {
  ListUsersCommand,
  CognitoIdentityProviderClient,
} from "@aws-sdk/client-cognito-identity-provider";
import * as dotenv from 'dotenv';
import { CognitoUser} from './User.client';


const u_pool:string = process.env.AWS_USER_POOL_ID; 

// incase things break https://github.com/awslabs/aws-jwt-verify 
dotenv.config();
@Injectable()
export class CognitoWrapper {
  verifier = CognitoJwtVerifier.create({
    userPoolId: process.env.AWS_USER_POOL_ID,  
    tokenUse: "access", 
    clientId: process.env.AWS_ACCESS_KEY, 
  }); 

  // TODO : uhhhhh this requires no credentials?? Can anyone get our users' attributes if they have our region and user pool id????
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
   * 
   * @param userIDs 
   */
  async getUsers(userIDs: string[]) {
    // Reference : https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-cognito-identity-provider/
    try {
      // Create list of users to be returned 
      const users: CognitoUser[] = [];

      // TODO : There is a read limit of 30 calls per seconds for ListUsers, will need to do throttling here if over 30.
      // May also want to eventually do re-calls with exponential backoff
      for ( const userID of userIDs ) {
        var params = {
          userPoolId: process.env.AWS_USER_POOL_ID,  
          filter: `sub = \"${ userID }\"`,
          limit: 1,
        };

        const data = await this.listUsers(params);

        console.log(data);
        if (data == null || data.length === 0) {
          throw new Error(`User could not be found: ${ userID }`);
        }

        users.push(CognitoUser.parse(data[0]));
      }

      return users;
    } catch (error) {
      console.log(error);
    }
  }

  listUsers = async ({ userPoolId, filter, limit  }) => {  
    const command = new ListUsersCommand({
      UserPoolId: userPoolId,
      Filter: filter,
      Limit: limit
    });
  
    return this.serviceProvider.send(command)
      .then((data) => data.Users);
  };
}
