import { DynamoDBClient, DynamoDB, ScanCommand, QueryCommand, BatchGetItemCommand } from '@aws-sdk/client-dynamodb';
import { unmarshall, marshall } from '@aws-sdk/util-dynamodb';
import * as dotenv from 'dotenv';

import {TimeSheetSchema} from './db/Timesheet'

dotenv.config();

if (process.env.AWS_ACCESS_KEY_ID == null) {
  throw new Error('AWS Access Key not configured');
}
if (process.env.AWS_SECRET_ACCESS_KEY == null) {
  throw new Error('AWS Secret Access Key not configured');
}
console.log('key', process.env.AWS_ACCESS_KEY_ID);
console.log('secret', process.env.AWS_SECRET_ACCESS_KEY!);

const client = new DynamoDB({ region: 'us-east-2' });

export async function UserTimesheets(uuid:string): Promise<TimeSheetSchema[]> {
  // Set up the query to get all timesheets for a given uuid
  const command = new QueryCommand({
    TableName: 'BreaktimeTimesheets',
    KeyConditionExpression: "UserID = :s", 
    ExpressionAttributeValues: {
      ":s": { S: `${uuid}` }}, 
  });

  const dynamoRawResult = await client.send(command);

  if (dynamoRawResult == null || dynamoRawResult.Items == null) {
    throw new Error('Invalid response from DynamoDB, got undefined/null');
  }
  const unmarshalledItems = dynamoRawResult.Items.map((i) => unmarshall(i));
  const timesheetData = unmarshalledItems.map((i) =>
   TimeSheetSchema.parse(i)
  );

  console.log(timesheetData);
  return timesheetData;
}

export async function WriteEntryToTable(table:TimeSheetSchema): Promise<Boolean> {
  const params = {
    TableName: 'BreaktimeTimesheets',
    Item: marshall(table)
  }; 
  
  try {
    //Input validation - if this fails we do not upload following this as it did not have appropriate types
    TimeSheetSchema.parse(table); 
  } catch (error) {
    console.log("Table failed to parse: ", error); 
    return false; 
  }
  
  client.putItem(params, function(err, data) {
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