# Automated Invoice Overdue Status Update

## Overview
This feature implements an automated Lambda function that runs daily to update invoice statuses from "PENDING" to "OVERDUE" when their due date has passed.

## Implementation Details

### Lambda Function
- **Location**: `amplify/functions/update-overdue-invoices/`
- **Schedule**: Daily at 02:00 UTC via EventBridge cron expression
- **Cron Expression**: `cron(0 2 * * ? *)` 

### Functionality
The function performs the following operations:

1. **Query**: Scans the Invoice table for invoices with:
   - Status = "PENDING" 
   - dueDate < current date

2. **Update**: Changes the status from "PENDING" to "OVERDUE" for matching invoices

3. **Safety**: Uses conditional updates to prevent race conditions

4. **Logging**: Comprehensive logging for monitoring and debugging

### Configuration

#### Environment Variables
- `AMPLIFY_DATA_INVOICE_TABLE_NAME`: DynamoDB table name (automatically configured)
- `AWS_REGION`: AWS region (inherited from Amplify environment)

#### Permissions
The function has read/write permissions on the Invoice DynamoDB table, configured in `amplify/backend.ts`.

### Monitoring

#### Success Response
```json
{
  "statusCode": 200,
  "message": "Overdue invoice update completed",
  "totalFound": 5,
  "successCount": 5,
  "errorCount": 0
}
```

#### Error Response
```json
{
  "statusCode": 500,
  "message": "Failed to update overdue invoices: Error details",
  "error": "Specific error message"
}
```

#### Logs
The function logs:
- Start of execution
- Number of overdue invoices found
- Individual invoice updates
- Final results summary
- Any errors encountered

### Deployment

The function is automatically deployed when deploying the Amplify backend:

```bash
npx ampx pipeline-deploy --branch main
```

For local development/testing:

```bash
npx ampx sandbox
```

### Architecture

```
EventBridge (Cron) → Lambda Function → DynamoDB (Invoice Table)
     ↓
   Daily 02:00 UTC
     ↓
   Scan PENDING invoices with overdue dates
     ↓
   Update to OVERDUE status
```

### Testing

The logic has been validated with test scenarios to ensure:
- Only PENDING invoices are processed
- Only invoices with past due dates are updated
- PAID/OVERDUE invoices are ignored
- Future due dates are not processed

### Time Zone Considerations

- Function runs at 02:00 UTC daily
- Due date comparisons use ISO date format (YYYY-MM-DD)
- Local time zones should be considered when setting invoice due dates

### Troubleshooting

#### Common Issues
1. **No invoices updated**: Check if there are actually overdue PENDING invoices
2. **Permission errors**: Verify DynamoDB permissions are properly configured
3. **Schedule not working**: Check EventBridge rule configuration

#### Monitoring
- Check CloudWatch logs for the function execution details
- Monitor CloudWatch metrics for function duration and errors
- Set up alarms for function failures if needed

### Future Enhancements

Potential improvements:
- Email notifications for overdue invoices
- Configurable grace period before marking as overdue
- Batch processing for large numbers of invoices
- Additional invoice status transitions (e.g., VERY_OVERDUE)