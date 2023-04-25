import { CognitoJwtVerifier} from "aws-jwt-verify";
import { CognitoIdentityServiceProvider } from "aws-sdk";
import { mockSupervisor } from "src/utils/mock/user.mock";

export class JWTVerifier {
    verifier = CognitoJwtVerifier.create({
    userPoolId: process.env.AWS_USER_POOL_ID,  
    tokenUse: "access", 
    clientId:process.env.AWS_ACCESS_KEY, 
    }); 


    public async grabUserID (headers:any): Promise<string> {
        if (process.env.ENV_TYPE && process.env.ENV_TYPE === "test") {
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