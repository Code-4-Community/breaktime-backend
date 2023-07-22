import {
  DynamoDBClient,
  DynamoDB,
  ScanCommand,
  QueryCommand,
  BatchGetItemCommand,
} from "@aws-sdk/client-dynamodb";
import { unmarshall, marshall } from "@aws-sdk/util-dynamodb";
import * as dotenv from "dotenv";

import {TimeSheetSchema} from './db/schemas/Timesheet'
import { CompanySchema, UserCompaniesSchema } from './db/schemas/CompanyUsers';

dotenv.config();

if (process.env.AWS_ACCESS_KEY_ID == null) {
  throw new Error("AWS Access Key not configured");
}
if (process.env.AWS_SECRET_ACCESS_KEY == null) {
  throw new Error("AWS Secret Access Key not configured");
}
console.log("key", process.env.AWS_ACCESS_KEY_ID);
console.log("secret", process.env.AWS_SECRET_ACCESS_KEY!);

const client = new DynamoDB({ region: "us-east-2" });

export async function UserTimesheets(uuid: string): Promise<TimeSheetSchema[]> {
  // Set up the query to get all timesheets for a given uuid
  const command = new QueryCommand({
    TableName: "BreaktimeTimesheets",
    KeyConditionExpression: "UserID = :s",
    ExpressionAttributeValues: {
      ":s": { S: `${uuid}` },
    },
  });

  const dynamoRawResult = await client.send(command);

  if (dynamoRawResult == null || dynamoRawResult.Items == null) {
    throw new Error("Invalid response from DynamoDB, got undefined/null");
  }
  const unmarshalledItems = dynamoRawResult.Items.map((i) => unmarshall(i));
  const timesheetData = unmarshalledItems.map((i) => TimeSheetSchema.parse(i));

  return timesheetData;
}

/**
 * Retrieves the UserCompanies object (mapping userID to the list of companyIDs they work at) for the given user.
 * @param uuid the user id to search for in the DB table
 * @throws error if no items are found or multiple entries are found for a given user ID
 * @returns the user to company object that contains the approrpiate list of company IDs
 */
export async function GetCompaniesForUser(
  uuid: string
): Promise<UserCompaniesSchema> {
  const command = new QueryCommand({
    TableName: "BreaktimeUserToCompanies",
    KeyConditionExpression: "UserID = :s",
    ExpressionAttributeValues: {
      ":s": { S: `${uuid}` },
    },
  });

  // get the items from DynamoDB with our query
  const dynamoRawResult = await client.send(command);

  if (dynamoRawResult == null || dynamoRawResult.Items == null) {
    throw new Error("Invalid response from DynamoDB, got undefined/null");
  }

  // Convert Dynamo items to JS objects
  const unmarshalledItems = dynamoRawResult.Items.map((i) => unmarshall(i));

  // Parse the items into our expected UserCompanies schema.
  const userCompaniesData = unmarshalledItems.map((i) =>
    UserCompaniesSchema.parse(i)
  );

  // There should only ever be one entry per user in the table (since there's no sort key, the partition key is the only unique index used)
  if (userCompaniesData.length != 1) {
    throw new Error(
      "Invalid entries in DynamoDB, should only have a single entry per user"
    );
  }

  return userCompaniesData[0];
}

/**
 * Retrive the any necessary company data for the specified companyId, including users belonging to that company, from DynamoDB
 * and map to appropriate schema objects.
 * @param companyID the requested company to pull data for
 * @throws Error if there are no results returned from DynamoDB for the companyId, or if there are multiple companies found for the same id
 * @returns DynamoDB company data mapped to JS company schema
 */
export async function GetCompanyData(
  companyID: string
): Promise<CompanySchema> {
  const command = new QueryCommand({
    TableName: "BreaktimeCompanyToUsers",
    KeyConditionExpression: "CompanyID = :s",
    ExpressionAttributeValues: {
      ":s": { S: `${companyID}` },
    },
  });

  // get the items from DynamoDB with our query
  const dynamoRawResult = await client.send(command);

  if (dynamoRawResult == null || dynamoRawResult.Items == null) {
    throw new Error("Invalid response from DynamoDB, got undefined/null");
  }

  // Convert Dynamo items to JS objects
  const unmarshalledItems = dynamoRawResult.Items.map((i) => unmarshall(i));

  // Parse the items into our expected Company schema.
  const companyData = unmarshalledItems.map((i) => CompanySchema.parse(i));

  // There should only ever be one entry per company in the table (since there's no sort key, the partition key is the only unique index used)
  if (companyData.length != 1) {
    throw new Error(
      "Invalid entries in DynamoDB, should only have a single entry per user"
    );
  }

  return companyData[0];
}

export async function WriteEntryToTable(table:TimeSheetSchema): Promise<Boolean> {
  const options = {
    removeUndefinedValues: true
  };

  const params = {
    TableName: 'BreaktimeTimesheets',
    Item: marshall(table, options), 
    removeUndefinedValues: true, 
  }; 

  
  
  try {
    //Input validation - if this fails we do not upload following this as it did not have appropriate types
    TimeSheetSchema.parse(table);
  } catch (error) {
    console.log("Table failed to parse: ", error);
    return false;
  }

  client.putItem(params, function (err, data) {
    if (err) {
      console.log("Error", err);
      return err;
    } else {
      console.log("Success", data);
      return true;
    }
  });
  return true;
}

export async function getTimesheetsForUsersInGivenTimeFrame(uuids: string[], timeframe=7) {
  // timeframe - startdate - end date 
  // UserID - string PageName: { S: "Home" },

  const userKeys = uuids.map((uuid) =>
    {return {UserID: {S : uuid}}}
  )

  const command = new BatchGetItemCommand({
    RequestItems: {
      BreaktimeTimesheets: {
        Keys: userKeys
      }
    }
  });

  // get the items from DynamoDB with our query
  const dynamoRawResult = await client.send(command);
  
  return dynamoRawResult;
}
