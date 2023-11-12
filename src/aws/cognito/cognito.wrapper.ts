import { Injectable } from "@nestjs/common";
import { CognitoJwtVerifier } from "aws-jwt-verify";
import {
  ListUsersCommand,
  CognitoIdentityProviderClient,
  ListUsersInGroupCommand,
} from "@aws-sdk/client-cognito-identity-provider";
import * as dotenv from "dotenv";
import { CognitoUser } from "./User.client";
import { CognitoRoles } from "./Roles";

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
      // const userData = await this.listUsers(this.userPoolId);

      // Loop through all roles (aka Cognito groups) to get the user data in that group
      // A user can only ever be in one group, so there should be no duplicate users
      var userData = []

      const groups = Object.values(CognitoRoles)
      for (let role of groups) {
        console.log(role)
        console.log("Getting users in group %s", role)
        const usersInGroup = await this.listUsersInGroup(this.userPoolId, role)

        if (userData == null) {
          throw new Error("Issue with retrieving user data from user pool for group.");
        }

        // Parse each user into a CognitoUser object, and set their group attribute
        const modifiedUsers = usersInGroup.map((user) => { 
          const parsedUser = CognitoUser.parse(user);
          parsedUser.Attributes.push({Name: "cognito:groups", Value: role});
          return parsedUser;
        })
        console.log("MODIFIED USERS FOR %s", role)
        userData = [...userData, ...modifiedUsers]
      }

      console.log(userData);
      return userData;
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
      // Get all users first
      const userData = await this.getUsers();

      return userData
        .filter((user) =>
          userIDs.includes(
            user.Attributes.find((attribute) => (attribute.Name = "sub")).Value
          )
        );
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

  /**
   * Gets a list of raw user data from a specified Cognito user pool for the given group, with maximum of 'limit' users.
   * If an error occurs, log the error and return an empty list.
   */
  async listUsersInGroup(userPoolId: string, groupName: string, limit?: number) {
    try {
      const command = new ListUsersInGroupCommand({
        UserPoolId: userPoolId,
        GroupName: groupName,
        Limit: limit,
      })

      return this.serviceProvider.send(command).then((data) => data.Users);
    } catch (error) {
      console.log(
        `Error getting users from Cognito user pool ${userPoolId} and group ${groupName}: ${error}`
      );
      return [];
    }
  }
}
