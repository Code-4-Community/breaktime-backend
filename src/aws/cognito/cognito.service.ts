import { Injectable } from "@nestjs/common";
import * as dotenv from "dotenv";
import { CognitoWrapper } from "./cognito.wrapper";

dotenv.config();
@Injectable()
export class CognitoService {
  constructor(private cognitoWrapper: CognitoWrapper) {}

  async validate(jwt: string) {
    return await this.cognitoWrapper.validate(jwt);
  }

  /**
   * Gets a list of users from Cognito user pool. If no user ids are provided, will return
   * all users by default.
   *
   * @param userIDs optional list of user ids to search for
   * @param roles optional list of roles to search for
   * @returns
   */
  async getUsers(userIDs?: string[], roles?: string[]) {
    if (!userIDs) {
      return await this.cognitoWrapper.getUsers();
    }

    return await this.cognitoWrapper.getUsersByIds(userIDs);
  }
}
