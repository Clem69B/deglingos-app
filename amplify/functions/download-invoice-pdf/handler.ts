import { type AppSyncResolverHandler } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { S3Client, GetObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { DynamoDBDocumentClient, GetCommand } from '@aws-sdk/lib-dynamodb';

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const s3Client = new S3Client({});

interface Invoice {
  id: string;
  invoiceNumber: string;
  status?: string;
}

export const handler: AppSyncResolverHandler<{ invoiceId: string }, { success: boolean; downloadUrl?: string; message: string }> = async (event) => {
  console.log('Download Invoice PDF event:', JSON.stringify(event, null, 2));

  try {
    const { invoiceId } = event.arguments;

    if (!invoiceId) {
      return {
        success: false,
        message: 'Invoice ID is required'
      };
    }

    // Get invoice from DynamoDB
    const invoiceTableName = process.env.AMPLIFY_DATA_INVOICE_TABLE_NAME;
    if (!invoiceTableName) {
      throw new Error('Invoice table name not configured');
    }

    const invoiceResponse = await docClient.send(new GetCommand({
      TableName: invoiceTableName,
      Key: { id: invoiceId }
    }));

    if (!invoiceResponse.Item) {
      return {
        success: false,
        message: 'Invoice not found'
      };
    }

    const invoice = invoiceResponse.Item as Invoice;

    // Check if invoice status allows PDF download
    if (invoice.status === 'DRAFT') {
      return {
        success: false,
        message: 'Cannot download PDF for DRAFT invoices. Please mark as PENDING first.'
      };
    }

    // Check if PDF exists in S3
    const bucketName = process.env.AMPLIFY_STORAGE_BUCKET_NAME;
    if (!bucketName) {
      throw new Error('Storage bucket name not configured');
    }

    const pdfKey = `invoices/${invoice.invoiceNumber}.pdf`;
    
    try {
      // Check if PDF exists
      await s3Client.send(new HeadObjectCommand({
        Bucket: bucketName,
        Key: pdfKey
      }));
    } catch (error) {
      return {
        success: false,
        message: 'PDF not found in storage. Please generate the PDF first by marking the invoice as PENDING.'
      };
    }

    // Generate presigned URL for download (valid for 1 hour)
    const downloadUrl = await getSignedUrl(
      s3Client,
      new GetObjectCommand({
        Bucket: bucketName,
        Key: pdfKey,
        ResponseContentDisposition: `attachment; filename="${invoice.invoiceNumber}.pdf"`
      }),
      { expiresIn: 3600 } // 1 hour
    );

    return {
      success: true,
      downloadUrl,
      message: 'Download URL generated successfully'
    };

  } catch (error) {
    console.error('Error generating download URL:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};