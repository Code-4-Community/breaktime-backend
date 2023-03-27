import { CognitoJwtVerifier} from "aws-jwt-verify";


// const verifier = CognitoJwtVerifier.create({
//     userPoolId: process.env.AWS_USER_POOL_ID,  
//     tokenUse: "access", 
//     clientId:process.env.AWS_ACCESS_KEY, 
//   }); 


export class JWTVerifier {
    verifier = CognitoJwtVerifier.create({
    userPoolId: process.env.AWS_USER_POOL_ID,  
    tokenUse: "access", 
    clientId:process.env.AWS_ACCESS_KEY, 
    }); 

    public async verifyJWT (jwt: string) {
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