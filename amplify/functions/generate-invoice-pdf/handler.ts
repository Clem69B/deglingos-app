import { type AppSyncResolverHandler } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { DynamoDBDocumentClient, GetCommand } from '@aws-sdk/lib-dynamodb';
import jsPDF from 'jspdf';

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const s3Client = new S3Client({});

interface Invoice {
  id: string;
  invoiceNumber: string;
  patientId: string;
  date: string;
  total?: number;
  price?: number;
  status?: string;
  notes?: string;
  dueDate?: string;
}

interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  address?: string;
}

export const handler: AppSyncResolverHandler<{ invoiceId: string }, { success: boolean; pdfUrl?: string; message: string }> = async (event) => {
  console.log('Generate Invoice PDF event:', JSON.stringify(event, null, 2));

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

    // Get patient details
    const patientTableName = process.env.AMPLIFY_DATA_PATIENT_TABLE_NAME;
    if (!patientTableName) {
      throw new Error('Patient table name not configured');
    }

    const patientResponse = await docClient.send(new GetCommand({
      TableName: patientTableName,
      Key: { id: invoice.patientId }
    }));

    const patient = patientResponse.Item as Patient | undefined;

    // Generate PDF
    const pdf = new jsPDF();
    
    // Add title
    pdf.setFontSize(20);
    pdf.text('FACTURE', 20, 30);
    
    // Add invoice details
    pdf.setFontSize(12);
    pdf.text(`Facture N°: ${invoice.invoiceNumber}`, 20, 50);
    pdf.text(`Date: ${new Date(invoice.date).toLocaleDateString('fr-FR')}`, 20, 60);
    
    if (invoice.dueDate) {
      pdf.text(`Date d'échéance: ${new Date(invoice.dueDate).toLocaleDateString('fr-FR')}`, 20, 70);
    }

    // Add patient information
    if (patient) {
      pdf.text('PATIENT:', 20, 90);
      pdf.text(`${patient.firstName} ${patient.lastName}`, 20, 100);
      if (patient.email) {
        pdf.text(`Email: ${patient.email}`, 20, 110);
      }
      if (patient.phone) {
        pdf.text(`Téléphone: ${patient.phone}`, 20, 120);
      }
      if (patient.address) {
        pdf.text(`Adresse: ${patient.address}`, 20, 130);
      }
    }

    // Add invoice total
    pdf.text('MONTANT:', 20, 150);
    const total = invoice.total || invoice.price || 0;
    pdf.text(`Total TTC: ${total.toFixed(2)} €`, 20, 160);

    if (invoice.notes) {
      pdf.text('NOTES:', 20, 180);
      pdf.text(invoice.notes, 20, 190);
    }

    // Generate PDF buffer
    const pdfBuffer = Buffer.from(pdf.output('arraybuffer'));

    // Upload to S3
    const bucketName = process.env.AMPLIFY_STORAGE_BUCKET_NAME;
    if (!bucketName) {
      throw new Error('Storage bucket name not configured');
    }

    const key = `invoices/${invoice.invoiceNumber}.pdf`;
    
    await s3Client.send(new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: pdfBuffer,
      ContentType: 'application/pdf',
      ContentDisposition: `attachment; filename="${invoice.invoiceNumber}.pdf"`
    }));

    const pdfUrl = `https://${bucketName}.s3.amazonaws.com/${key}`;

    return {
      success: true,
      pdfUrl,
      message: 'PDF generated successfully'
    };

  } catch (error) {
    console.error('Error generating PDF:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};