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


// TODO: Write persitence level test using local DB
// This is kind of a pain, and a "slow" test so we elide it
export async function SelectAllFromHourTable(): Promise<TimeSheetSchema[]> {
  const command = new ScanCommand({
    TableName: 'BreaktimeTimesheetTable',
    
  });
  const dynamoRawResult = await client.send(command);
  if (dynamoRawResult == null || dynamoRawResult.Items == null) {
    throw new Error('Invalid response from DynamoDB, got undefined/null');
  }
  const unmarshalledItems = dynamoRawResult.Items.map((i) => unmarshall(i));

  const timesheetData = unmarshalledItems.map((i) =>
   TimeSheetSchema.parse(i)
  );
  return unmarshalledItems;
}

export async function UserTimesheets(uuid:number): Promise<TimeSheetSchema[]> {
  const command = new QueryCommand({
    TableName: 'BreaktimeTimesheetTable',
    KeyConditionExpression: "#UserID = :s", 
    ExpressionAttributeValues: {
      ":s": { N: "1293219" }}, 
    ExpressionAttributeNames: {
      "#UserID":"TimesheetID"
    }  
  });
  const dynamoRawResult = await client.send(command);

  if (dynamoRawResult == null || dynamoRawResult.Items == null) {
    throw new Error('Invalid response from DynamoDB, got undefined/null');
  }
  const unmarshalledItems = dynamoRawResult.Items.map((i) => unmarshall(i));

  const timesheetData = unmarshalledItems.map((i) =>
   TimeSheetSchema.parse(i)
  );
  return timesheetData;
}

export async function WriteEntryToTable(table:TimeSheetSchema): Promise<Boolean> {
  const params = {
    TableName: 'BreaktimeTimesheetTable',
    Item: marshall(table)
  }; 
  
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