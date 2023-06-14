import { Injectable } from "@nestjs/common";
import { CognitoJwtVerifier } from "aws-jwt-verify";
import {
  ListUsersCommand,
  CognitoIdentityProviderClient,
} from "@aws-sdk/client-cognito-identity-provider";
import * as dotenv from "dotenv";
import { CognitoUser } from "./User.client";

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
  serviceProvider = new CognitoIdentityProviderClient({
    region: process.env.AWS_USER_POOL_REGION,
  });

  async validate(jwt: string) {
    try {
      const payload = await this.verifier.verify(jwt);
      return payload;
    } catch (error) {
      console.log(error);
      console.log("Authentication error! See cognito wrapper");
    }
  }

  /**
   * Gets all user data from the current Cognito user pool.
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

      return userData.map((user) => CognitoUser.parse(user));
    } catch (error) {
      console.log(error);
      return [];
    }
  }

  /**
   * Gets users from Cognito that match the userIds passed in.
   */
  async getUsersByIds(userIDs: string[]) {
    try {
      // Create list of users to be returned
      const userData = await this.listUsers(this.userPoolId);

      if (userData == null) {
        throw new Error("Issue with retrieving user data from user pool.");
      }

      return userData
        .filter((user) =>
          userIDs.includes(
            user.Attributes.find((attribute) => (attribute.Name = "sub")).Value
          )
        )
        .map((user) => CognitoUser.parse(user));
    } catch (error) {
      console.log(error);
      return [];
    }
  }

  /**
   * Gets a list of raw user data from a specified Cognito user pool with given filter queries and returned user limit.
   * If an error occurs, log the error and return an empty list.
   */
  async listUsers(userPoolId: string, filter?: string, limit?: number) {
    try {
      const command = new ListUsersCommand({
        UserPoolId: userPoolId,
        Filter: filter,
        Limit: limit,
      });

      return this.serviceProvider.send(command).then((data) => data.Users);
    } catch (error) {
      console.log(
        `Error getting users from Cognito user pool ${userPoolId} and filter ${filter}: ${error}`
      );
      return [];
    }
  }
}
