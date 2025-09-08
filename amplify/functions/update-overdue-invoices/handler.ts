import { env } from '$amplify/env/update-overdue-invoices';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { ScheduledEvent } from 'aws-lambda';

// Initialize DynamoDB client
const dynamoClient = new DynamoDBClient({ region: env.AWS_REGION });
const docClient = DynamoDBDocumentClient.from(dynamoClient);

export const handler = async (event: ScheduledEvent) => {
  console.log('Starting overdue invoice update job', JSON.stringify(event, null, 2));
  
  try {
    const tableName = env.AMPLIFY_DATA_INVOICE_TABLE_NAME;
    const today = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD
    
    console.log(`Checking for overdue invoices as of ${today}`);
    
    // Scan for invoices with status PENDING and dueDate < today
    const scanParams = {
      TableName: tableName,
      FilterExpression: '#status = :status AND #dueDate < :today',
      ExpressionAttributeNames: {
        '#status': 'status',
        '#dueDate': 'dueDate',
      },
      ExpressionAttributeValues: {
        ':status': 'PENDING',
        ':today': today,
      },
    };
    
    const scanResult = await docClient.send(new ScanCommand(scanParams));
    const overdueInvoices = scanResult.Items || [];
    
    console.log(`Found ${overdueInvoices.length} overdue invoices`);
    
    if (overdueInvoices.length === 0) {
      return {
        statusCode: 200,
        message: 'No overdue invoices found',
        processedCount: 0,
      };
    }
    
    // Update each overdue invoice to OVERDUE status
    let successCount = 0;
    let errorCount = 0;
    const errors: string[] = [];
    
    for (const invoice of overdueInvoices) {
      try {
        const updateParams = {
          TableName: tableName,
          Key: {
            id: invoice.id,
          },
          UpdateExpression: 'SET #status = :newStatus, updatedAt = :updatedAt',
          ExpressionAttributeNames: {
            '#status': 'status',
          },
          ExpressionAttributeValues: {
            ':newStatus': 'OVERDUE',
            ':updatedAt': new Date().toISOString(),
            ':currentStatus': 'PENDING',
          },
          // Only update if the invoice is still PENDING to avoid race conditions
          ConditionExpression: '#status = :currentStatus',
        };
        
        await docClient.send(new UpdateCommand(updateParams));
        successCount++;
        
        console.log(`Updated invoice ${invoice.invoiceNumber} (ID: ${invoice.id}) to OVERDUE status`);
        
      } catch (updateError: any) {
        errorCount++;
        const errorMsg = `Failed to update invoice ${invoice.invoiceNumber} (ID: ${invoice.id}): ${updateError.message}`;
        console.error(errorMsg);
        errors.push(errorMsg);
      }
    }
    
    const result = {
      statusCode: 200,
      message: `Overdue invoice update completed`,
      totalFound: overdueInvoices.length,
      successCount,
      errorCount,
      errors: errors.length > 0 ? errors : undefined,
    };
    
    console.log('Overdue invoice update job completed:', JSON.stringify(result, null, 2));
    
    return result;
    
  } catch (error: any) {
    console.error('Error in overdue invoice update job:', error);
    
    return {
      statusCode: 500,
      message: `Failed to update overdue invoices: ${error.message}`,
      error: error.message,
    };
  }
};