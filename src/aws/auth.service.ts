import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";

import { CognitoService } from "./cognito/cognito.service";
import { mockSupervisor } from "src/utils/mock/user.mock";

@Injectable()
export class AuthService {
  constructor(private cognitoService: CognitoService) {}

  /**
   *
   * @param jwt The access token to be validated
   * @returns if the validation was successful and what Cognito groups the user is a part of
   */
  async verifyJwt(jwt: string): Promise<AuthVerificationResponse> {
    if (process.env.ENV_TYPE && process.env.ENV_TYPE === "test") {
      console.log(
        "Testing environment - mock user will be used, authentication skipped"
      );
      return { isValidated: true, groups: mockSupervisor["cognito:groups"] };
    }
    try {
      const userPayload = await this.cognitoService.validate(jwt);

      // grab cognito groups from the user Payload to reutrn in the verification response.
      // This is so that the role-based access is determined by Cognito groups
      const groups = userPayload["cognito:groups"];

      return { isValidated: true, groups: groups };
    } catch (e) {
      throw new UnauthorizedException();
    }
  }
}

export type AuthVerificationResponse = {
  isValidated: boolean;
  groups: string[];
};
