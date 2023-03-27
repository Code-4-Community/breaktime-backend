import { Injectable } from '@nestjs/common';
import { CognitoJwtVerifier} from "aws-jwt-verify";

import * as dotenv from 'dotenv';


const u_pool:string = process.env.AWS_USER_POOL_ID; 

// incase things break https://github.com/awslabs/aws-jwt-verify 
dotenv.config();
@Injectable()
export class CognitoWrapper {
  verifier = CognitoJwtVerifier.create({
    userPoolId: process.env.AWS_USER_POOL_ID,  
    tokenUse: "access", 
    clientId:process.env.AWS_ACCESS_KEY, 
  }); 
 
  async validate(jwt: string) {
    try {
      const payload = await this.verifier.verify(jwt); 
      return payload 
    } catch (error){
      console.log(error); 
      console.log("Authentication error! See cognito wrapper"); 
    }
  }
}


