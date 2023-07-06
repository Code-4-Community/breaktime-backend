import {TimeSheetSchema, TimesheetEntrySchema, ScheduleEntrySchema, NoteSchema} from '../schemas/Timesheet'
import {UpdateRequest, InsertRequest, DeleteRequest, TimesheetListItems} from '../schemas/UpdateTimesheet'
import { ExceptionsHandler } from '@nestjs/core/exceptions/exceptions-handler';
//Not sure why but only works if imported like this :| 
const moment = require('moment-timezone'); 

/* Interface holding all operations available for a field in the timesheet that should support 
    updates, inserts, and deletions. 
*/
interface ItemsOperations {
    // Insert into the list of items 
    Insert(timesheet: TimeSheetSchema, body:InsertRequest): TimeSheetSchema 
    // Delete a specific item from the list of items 
    Delete(timesheet: TimeSheetSchema, body:DeleteRequest): TimeSheetSchema 
    // Update a specific item in the list of items 
    Update(timesheet: TimeSheetSchema, body:UpdateRequest) : TimeSheetSchema 
}

/*
    Delegator for delegating to the correct Type (Field) on the timesheet for processing for. 
    I.e. when we want to update a piece of the table data, go to the implementation of this interface above for table data. 
*/
export class ItemsDelegator {
    // Class to determine what field of the timesheet we are performing item operations on 
    tableData = new HoursDataOperations() 
    scheduleData = new ScheduledDataOperations() 
    notesData = new NotesOperations() 

    public AttributeToModify(body: InsertRequest | DeleteRequest | UpdateRequest) {
        switch (body.Type) {
            case TimesheetListItems.TABLEDATA:
                return this.tableData;
            case TimesheetListItems.SCHEDULEDATA:
                return this.scheduleData; 
            case TimesheetListItems.WEEKNOTES:
                return this.notesData; 
            default:
                throw new Error ("Invalid operation provided"); 
        }
    }
}


/*
    Implementation for processing operations on the TableData (HoursData) of our timesheet 
    i.e. the user entered rows of the time they worked. 
*/
export class HoursDataOperations implements ItemsOperations {
    public  Insert(timesheet: TimeSheetSchema, body:InsertRequest)  {
        const data = timesheet.HoursData; 

        const item = TimesheetEntrySchema.parse(body.Item); 
        // Sorting is currently only day by day based - need some way of minute by minute 
        var idx = 0; 
        for (idx; idx < data.length; idx += 1) {
            const row = data[idx]; 
            if (moment.unix(row.Date).isAfter(moment.unix(item.Date), 'day')) {
                break; 
            }
        }
        //Insert into front of list 
        if (idx === 0) {
            return {
                ...timesheet, 
                HoursData: [
                    item,
                    ...data 
                ]
            }; 
        } else if (idx === data.length) {
            //End of list 
            return {
                ...timesheet, 
                HoursData: [
                    ...data,
                    item
                ]
            }; 
        } else {
            return {
                ...timesheet, 
                HoursData: [
                    ...data.slice(0, idx), 
                    item, 
                    ...data.slice(idx + 1 )
                ]
            }
        }
    }
    public Delete(timesheet: TimeSheetSchema, body:DeleteRequest)  {
        return {
            ...timesheet, 
            HoursData: timesheet.HoursData.filter((row) => row.EntryID !== body.Id)
        }; 
         
    }

    public  Update(timesheet: TimeSheetSchema, body:UpdateRequest)  {
        if (timesheet.HoursData?.filter((row) => row.EntryID === body.Id).length === 0) {
            throw new Error("Could not find a row with that ID"); 
        }
        return {
            ...timesheet, 
            HoursData: timesheet.HoursData.map((row) => {
                // Only update the one specific id 
                if (row.EntryID === body.Id) {
                    return {
                        ...row, 
                        [body.Attribute] : body.Data
                    }; 
                }
                return row; 
            })
        }
    }
}

// Class for operations on the schedule data field - i.e. the supervisor reported hours they should have worked. 
export class ScheduledDataOperations implements ItemsOperations {
    public  Insert(timesheet: TimeSheetSchema, body:InsertRequest)  {
        const data = timesheet.ScheduleData; 
        const item = ScheduleEntrySchema.parse(body.Item); 
        //TODO - Fledge out the sorting to be simplified / actually accurate on the minute by minute. Currently is only based on day
        var idx = 0; 
        for (idx; idx < data.length; idx += 1) {
            const row = data[idx]; 
            if (moment.unix(row.Date).isAfter(moment.unix(item.Date), 'day')) {
                break; 
            }
        }
        //Insert into front of list 
        if (idx === 0) {
            return {
                ...timesheet, 
                ScheduleData: [
                    item,
                    ...data 
                ]
            }; 
        } else if (idx === data.length) {
            //End of list 
            return {
                ...timesheet, 
                ScheduleData: [
                    ...data,
                    item
                ]
            }; 
        } else {
            return {
                ...timesheet, 
                ScheduleData: [
                    ...data.slice(0, idx), 
                    item, 
                    ...data.slice(idx + 1 )
                ]
            }
        }
    }
    public Delete(timesheet: TimeSheetSchema, body:DeleteRequest)  {
        return {
            ...timesheet, 
            ScheduleData: timesheet.ScheduleData.filter((row) => row.EntryID !== body.Id)
        }
    }

    public  Update(timesheet: TimeSheetSchema, body:UpdateRequest)  {
        //TODO - Add in functionality to trigger insert instead of update if ID does not yet exist
        return {
            ...timesheet, 
            ScheduleData: timesheet.ScheduleData.map((row) => {
                // Only update the one specific id 
                if (row.EntryID === body.Id) {
                    return {
                        ...row, 
                        [body.Attribute] : body.Data
                    };  
                } 
                return row; 
            })
        }
    }
}

// Operations on the weekly notes on the timesheet - i.e. comments relating to the entire timesheet / specific day worked. 
export class NotesOperations implements ItemsOperations {
    public  Insert(timesheet: TimeSheetSchema, body:InsertRequest)  {
        return {
            ...timesheet, 
            WeekNotes: [
                ...timesheet.WeekNotes, 
                NoteSchema.parse(body.Item)
            ]
        }; 
    }
    public Delete(timesheet: TimeSheetSchema, body:DeleteRequest)  {
        return {
            ...timesheet, 
            WeekNotes: timesheet.WeekNotes.filter((note) => note.EntryID !== body.Id)
        }
    }

    public  Update(timesheet: TimeSheetSchema, body:UpdateRequest)   {
        //TODO - Add in functionality to trigger insert instead of update if ID does not yet exist

        return {
            ...timesheet,
            WeekNotes: timesheet.WeekNotes.map((note) => {
                if (note.EntryID === body.Id) {
                    return {
                        ...note, 
                        [body.Attribute] : body.Data
                    }
                }
                return note ;
            })
        }
    }
}

 