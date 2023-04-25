
export default interface User {
  sub: string; // user's unique identifier
  email: string; // user's email address
  given_name: string; // user's first name
  family_name: string; // user's last name
  phone_number: string; // user's phone number
  "cognito:groups"?: string[]; // array of user's group names (optional)
}

export const mockSupervisor: User = {
  sub: "9d4f45ed-25cf-4da2-a01c-50aeae1c8e83",
  email: "testemail@test.com",
  given_name: "Test",
  family_name: "Admin",
  phone_number: "+11234567890",
  "cognito:groups": ["breaktime-supervisor"]
}