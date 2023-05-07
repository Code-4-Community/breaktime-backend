import { CognitoJwtVerifier} from "aws-jwt-verify";
import { CognitoIdentityServiceProvider } from "aws-sdk";
import { mockSupervisor } from "src/utils/mock/user.mock";
import { VerifiedUserInfo } from "./User.client";

export class JWTVerifier {
    verifier = CognitoJwtVerifier.create({
    userPoolId: process.env.AWS_USER_POOL_ID,  
    tokenUse: "access", 
    clientId:process.env.AWS_ACCESS_KEY, 
    }); 

    public async getUserInfo (headers:any): Promise<VerifiedUserInfo> {
        if (process.env.ENV_TYPE && process.env.ENV_TYPE === "test") {
            console.log("Testing environment - mock user sub will be used with token client");
            return { sub: mockSupervisor.sub, groups: mockSupervisor["cognito:groups"] };
        }

        if (headers.hasOwnProperty('authorization')) {
            const payload = await this.verifyJWT(headers.authorization);
            return { sub: payload.sub, groups: payload['cognito:groups']}
        } 

        return undefined;
    }

    // TODO : refactor this into the above method, and also potentially move this into Cognito service or call the validate methods in cognito service
    public async grabUserID (headers:any): Promise<string> {
        if (process.env.ENV_TYPE && process.env.ENV_TYPE === "test") {
            console.log("Testing environment - mock user sub will be used with token client");
            return mockSupervisor.sub;
        }

        if (headers.hasOwnProperty('authorization')) {
            const resp = await this.verifyJWT(headers.authorization); 
            return resp.sub; 
        } 
        return "" 
    }

    private async verifyJWT (jwt: string) {
        try{
            const token = jwt.split(' ')[1] 
            if (!token) {
                throw new Error("Token Error - JWT must have Bearer in front")
            }
            const payload = await this.verifier.verify(token);
            return payload 
        } catch (error) {
            console.log(`Error when parsing JWT: \n ${error}`)
        }

    }

}

export default new JWTVerifier() 