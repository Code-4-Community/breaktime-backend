import { Module } from "@nestjs/common";

import { AuthService } from "./auth.service";
import { AuthController } from "./auth.controller";
import { CognitoService } from "./cognito/cognito.service";
import { CognitoWrapper } from "./cognito/cognito.wrapper";

@Module({
  imports: [],
  providers: [AuthService, CognitoService, CognitoWrapper],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
