import {TimeSheetSchema, TimesheetEntrySchema, ScheduleEntrySchema, NoteSchema} from '../schemas/Timesheet'
import {UpdateRequest, InsertRequest, DeleteRequest, TimesheetListItems} from '../schemas/UpdateTimesheet'
import { ExceptionsHandler } from '@nestjs/core/exceptions/exceptions-handler';
//Not sure why but only works if imported like this :| 
const moment = require('moment-timezone'); 


interface ItemsOperations {
    Insert(timesheet: TimeSheetSchema, body:InsertRequest): TimeSheetSchema 
    Delete(timesheet: TimeSheetSchema, body:DeleteRequest): TimeSheetSchema 
    Update(timesheet: TimeSheetSchema, body:UpdateRequest) : TimeSheetSchema 
}

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

export class ScheduledDataOperations implements ItemsOperations {
    public  Insert(timesheet: TimeSheetSchema, body:InsertRequest)  {
        const data = timesheet.ScheduleData; 
        const item = ScheduleEntrySchema.parse(body.Item); 
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

 