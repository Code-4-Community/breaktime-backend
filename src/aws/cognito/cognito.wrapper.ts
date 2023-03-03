import { Injectable } from '@nestjs/common';
import { CognitoJwtVerifier} from "aws-jwt-verify";

import * as dotenv from 'dotenv';


const u_pool:string = process.env.AWS_USER_POOL_ID; 

// incase things break https://github.com/awslabs/aws-jwt-verify 
dotenv.config();
@Injectable()
export class CognitoWrapper {
  // private verifier: Object;
  constructor() { 
    // this.verifier = CognitoJwtVerifier.create({})
    // this.verifier = CognitoJwtVerifier.create({
    //   userPoolId: "",  
    //   tokenUse: "",
    //   clientId:"", 
    // })
    // this.validator = new Validator(
    //   'https://cognito-idp.us-east-2.amazonaws.com/us-east-2_zG2SfHpXC',
    //   '9v01t6v5p685510n0q5b6i9co',
    // );
    
  }

  async validate(jwt: string) {
    console.log("Trying some login shit"); 
    const verifier = CognitoJwtVerifier.create({
      userPoolId: process.env.AWS_USER_POOL_ID,  
      tokenUse: "access",
      clientId:process.env.AWS_ACCESS_KEY, 
    }); 

    try {
      const payload = await verifier.verify(jwt); 
      console.log("YAY ! STUFF WORKED :)"); 
      console.log(payload); 
      return payload 
    } catch (error){
      console.log(error); 
      console.log("Authentication error! See cognito wrapper"); 
    }
  }
}
