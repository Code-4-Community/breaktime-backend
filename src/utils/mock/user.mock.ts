export default interface User {
  sub: string; // user's unique identifier
  email: string; // user's email address
  given_name: string; // user's first name
  family_name: string; // user's last name
  phone_number: string; // user's phone number
  "cognito:groups"?: string[]; // array of user's group names (optional)
}

export const mockSupervisor: User = {
  sub: "d396491c-22cf-4d63-af1e-4e70e95a29c7",
  email: "testemail@test.com",
  given_name: "Test",
  family_name: "Admin",
  phone_number: "+11234567890",
  "cognito:groups": ["breaktime-supervisor"],
};
