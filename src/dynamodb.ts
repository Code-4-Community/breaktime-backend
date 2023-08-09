import {
  DynamoDBClient,
  DynamoDB,
  ScanCommand,
  QueryCommand,
  BatchGetItemCommand,
} from "@aws-sdk/client-dynamodb";
import { unmarshall, marshall } from "@aws-sdk/util-dynamodb";
import * as dotenv from "dotenv";
import moment = require("moment");

import { timesheetToUpload } from "./utils";
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
// EndDate should be start date plus one week
export async function getTimesheetsForUsersInGivenTimeFrame(uuids: string[], StartDate:number = moment().startOf('week').subtract(1, 'week').unix() , EndDate:number = moment().endOf('week').unix()): Promise<any> {

  if (StartDate > EndDate) {
    throw new Error("Invalid EndDate")
  }

  let result = []

  for (let uuid of uuids) {
    const command = new QueryCommand({
      TableName: "BreaktimeTimesheets",
      KeyConditionExpression: "UserID = :s",
      ExpressionAttributeValues: {
        ":s": { S: `${uuid}` },
      },
      ExpressionAttributeNames: {
        "#S": "Status"
      },
      ProjectionExpression: "UserID, TimesheetID, CompanyID, ScheduleData, StartDate, #S, WeekNotes"
    });

    // get the items from DynamoDB with our query
    const dynamoRawResult = await client.send(command);

    if (dynamoRawResult == null || dynamoRawResult.Items == null) {
      throw new Error("Invalid response from DynamoDB, got undefined/null");
    }

    // Convert Dynamo items to JS objects
    const unmarshalledItems = dynamoRawResult.Items.map((i) => unmarshall(i));
  
    // Parse the items into our expected Company schema.
    const timesheetData = unmarshalledItems.map((i) => TimeSheetSchema.parse(i));

    const uuidSet = new Set(uuids)


    // TODO: have to check here the timesheets for all weeks exist then and create empty if not
    let modifiedTimesheetData = timesheetData.filter((sheet) => {return uuidSet.has(sheet.UserID) && sheet.StartDate >= StartDate && sheet.StartDate < EndDate})

    let existingWeeks = new Set()

    for (const sheet of modifiedTimesheetData) {
    // maybe move to utils and can in theory have locale based issues so configure moment project wide
      const beginningOfWeekDate = moment.unix(sheet.StartDate).set('second', 0).set('minute', 0).set('hour', 0).set('millisecond', 0).startOf('week').unix()
      existingWeeks.add(beginningOfWeekDate) // make it sunday 00:00:00
    }

    console.log(existingWeeks, StartDate)
    for (const m = moment.unix(StartDate); m.isBefore(moment.unix(EndDate)); m.add(1, 'week')) {
      if (!(m.unix() in existingWeeks)) {
        const newSheet = timesheetToUpload(uuid, "Company 55"); // TODO: should loop through companies user was active in and do it like that
        WriteEntryToTable(newSheet);
        // add to modifiedTimesheetData
        modifiedTimesheetData.push(newSheet);
      }
      
    }
  
    // go through modified timesheets
    // make a set of what weeks it has
    // go through start to end and check that it has all weeks

    // modifiedTimesheetData not sorted by date but can be sorted

    const uuidToTimesheet = {"uuid": uuid, timesheet: modifiedTimesheetData}
    
    result.push(uuidToTimesheet);
  };

  return result
}

export async function doUUIDSExistInCompanies(uuids: string[], companies: string[]): Promise<Boolean> {
  // check if given uuids exist in given companies
  return true
}

export async function areUUIDsValid(uuids: string[]): Promise<Boolean> {
  // check if uuids are valid
  return true
}
