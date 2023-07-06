import { Injectable } from "@nestjs/common";
import { CognitoUser } from "src/aws/cognito/User.client";
import { CognitoService } from "src/aws/cognito/cognito.service";
import { User } from "./User.model";
import { last } from "rxjs";

@Injectable()
export class UserService {
  constructor(private cognitoService: CognitoService) {}

  async getUsersFromCognito(userIDs: string[]): Promise<User[]> {
    try {
      const users = await this.cognitoService.getUsers(userIDs);

      // Parse out user data, map to the correct object here?
      for (const user of users) {
        console.log(user.Attributes);
      }

      return users.map((user) => UserService.convertClientToModelUser(user));
    } catch (err) {
      console.log(err);
      return [];
    }
  }

  static convertClientToModelUser(user: CognitoUser): User {
    var sub = user.Attributes.find((attribute) => attribute.Name === "sub");
    var email = user.Attributes.find((attribute) => attribute.Name === "email");
    var firstName = user.Attributes.find(
      (attribute) => attribute.Name === "given_name"
    );
    var lastName = user.Attributes.find(
      (attribute) => attribute.Name === "family_name"
    );

    // TODO : refactor into separate 'getAttribute' function so we don't repeat this code

    return {
      firstName: firstName != null ? firstName.Value : "",
      lastName: lastName != null ? lastName.Value : "",
      userEmail: email != null ? email.Value : "",
      userID: sub.Value,
    };
  }
}
