import { Injectable } from "@nestjs/common";
import { CognitoService } from "src/aws/cognito/cognito.service";

@Injectable()
export class UserService {
  constructor(
    private cognitoService: CognitoService,
  ) {}

  async getUsersFromCognito(userIDs: string[]): Promise<void> {
    try {
      const users = await this.cognitoService.getUsers(userIDs);

      // Parse out user data, map to the correct object here?

    } catch (err) {
      console.log(err);
    }
  }
}