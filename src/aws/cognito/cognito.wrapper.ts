import { Injectable } from '@nestjs/common';
import { CognitoJwtVerifier} from "aws-jwt-verify";
import { CognitoIdentityServiceProvider } from 'aws-sdk';

import * as dotenv from 'dotenv';


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
  serviceProvider = new CognitoIdentityServiceProvider({ region: process.env.AWS_USER_POOL_REGION });
 
  async validate(jwt: string) {
    try {
      const payload = await this.verifier.verify(jwt); 
      return payload 
    } catch (error){
      console.log(error); 
      console.log("Authentication error! See cognito wrapper"); 
    }
  }

  async getUsers(userIDs: string[]) {
    try {
      for ( const userID of userIDs ) {
        var params = {
          UserPoolId: process.env.AWS_USER_POOL_ID,  
          Filter: `sub = \"${ userID }\"`,
          Limit: 1,
        };

        this.serviceProvider.listUsers(params, function(err, data) {
          if (err) console.log(err, err.stack); // an error occurred
          else     console.log(data);           // successful response
        });
      }
    } catch (error) {
      console.log(error);
    }
  }
}
