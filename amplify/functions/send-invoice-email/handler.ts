import type { Schema } from '../../data/resource';
import { env } from '$amplify/env/send-invoice-email'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { SESClient, SendRawEmailCommand } from '@aws-sdk/client-ses';
import { DynamoDBDocumentClient, GetCommand } from '@aws-sdk/lib-dynamodb';

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const s3Client = new S3Client({});
const sesClient = new SESClient({});

export const handler: Schema["sendInvoiceEmail"]["functionHandler"] = async (event) => {
  console.log('Send Invoice Email event:', JSON.stringify(event, null, 2));

  try {
    const { invoiceId, recipientEmail } = event.arguments;

    if (!invoiceId) {
      return {
        success: false,
        message: 'Invoice ID is required'
      };
    }

    if (!recipientEmail) {
      return {
        success: false,
        message: 'Recipient email is required'
      };
    }

    // Get user ID from identity (Cognito)
    let userId: string | undefined;
    if (event.identity && 'sub' in event.identity) {
      userId = event.identity.sub;
    } else if (event.identity && 'username' in event.identity) {
      userId = event.identity.username;
    }

    // Get invoice from DynamoDB
    const invoiceTableName = env.AMPLIFY_DATA_INVOICE_TABLE_NAME;
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

    const invoice = invoiceResponse.Item as Schema['Invoice']['type'];

    // Get patient details
    const patientTableName = env.AMPLIFY_DATA_PATIENT_TABLE_NAME;
    if (!patientTableName) {
      throw new Error('Patient table name not configured');
    }

    const patientResponse = await docClient.send(new GetCommand({
      TableName: patientTableName,
      Key: { id: invoice.patientId }
    }));

    const patient = patientResponse.Item as Schema['Patient']['type'] | undefined;

    // Get user profile
    const userProfileTableName = env.AMPLIFY_DATA_USERPROFILE_TABLE_NAME;
    let userProfile: Schema['UserProfile']['type'] | undefined;
    
    if (userId && userProfileTableName) {
      try {
        const userProfileResponse = await docClient.send(new GetCommand({
          TableName: userProfileTableName,
          Key: { userId }
        }));
        userProfile = userProfileResponse.Item as Schema['UserProfile']['type'] | undefined;
      } catch (error) {
        console.warn('Could not fetch user profile:', error);
      }
    }

    // Get PDF from S3
    const bucketName = env.AMPLIFY_STORAGE_BUCKET_NAME;
    if (!bucketName) {
      throw new Error('Storage bucket name not configured');
    }

    const pdfKey = `invoices/${invoice.invoiceNumber}.pdf`;
    
    let pdfBuffer: Buffer;
    try {
      const pdfResponse = await s3Client.send(new GetObjectCommand({
        Bucket: bucketName,
        Key: pdfKey
      }));

      if (!pdfResponse.Body) {
        return {
          success: false,
          message: 'PDF not found in storage. Please generate the PDF first.'
        };
      }

      pdfBuffer = Buffer.from(await pdfResponse.Body.transformToByteArray());
    } catch (error) {
      return {
        success: false,
        message: 'PDF not found in storage. Please generate the PDF first.'
      };
    }

    // Prepare email
    const senderEmail = env.SES_SENDER_EMAIL || 'noreply@deglingos.eu';
    const patientName = patient ? `${patient.firstName} ${patient.lastName}` : 'Cher patient';
    
    // Get practitioner name from user profile
    let practitionerName = 'L\'équipe Deglingos';
    if (userProfile) {
      const givenName = userProfile.givenName || '';
      const familyName = userProfile.familyName || '';
      const fullName = `${givenName} ${familyName}`.trim();
      if (fullName) {
        practitionerName = fullName;
      }
    }
    
    const subject = `Facture ${invoice.invoiceNumber}`;
    const bodyText = `Bonjour ${patientName},

Veuillez trouver ci-joint votre facture ${invoice.invoiceNumber} en date du ${new Date(invoice.date).toLocaleDateString('fr-FR')}.

${invoice.total || invoice.price ? `Montant: ${(invoice.total || invoice.price || 0).toFixed(2)} €` : ''}

Cordialement,
${practitionerName}`;

    const bodyHtml = `
      <html>
        <body>
          <p>Bonjour ${patientName},</p>
          <p>Veuillez trouver ci-joint votre facture ${invoice.invoiceNumber} en date du ${new Date(invoice.date).toLocaleDateString('fr-FR')}.</p>
          ${invoice.total || invoice.price ? `<p><strong>Montant: ${(invoice.total || invoice.price || 0).toFixed(2)} €</strong></p>` : ''}
          <p>Cordialement,<br/>${practitionerName}</p>
        </body>
      </html>
    `;

    // Create raw email message with attachment
    const boundary = `----=_Part_${Date.now()}_${Math.random()}`;
    
    const rawMessage = [
      `From: ${senderEmail}`,
      `To: ${recipientEmail}`,
      `Subject: ${subject}`,
      `MIME-Version: 1.0`,
      `Content-Type: multipart/mixed; boundary="${boundary}"`,
      '',
      `--${boundary}`,
      `Content-Type: multipart/alternative; boundary="${boundary}_alt"`,
      '',
      `--${boundary}_alt`,
      `Content-Type: text/plain; charset=UTF-8`,
      '',
      bodyText,
      '',
      `--${boundary}_alt`,
      `Content-Type: text/html; charset=UTF-8`,
      '',
      bodyHtml,
      '',
      `--${boundary}_alt--`,
      '',
      `--${boundary}`,
      `Content-Type: application/pdf; name="${invoice.invoiceNumber}.pdf"`,
      `Content-Transfer-Encoding: base64`,
      `Content-Disposition: attachment; filename="${invoice.invoiceNumber}.pdf"`,
      '',
      pdfBuffer.toString('base64'),
      '',
      `--${boundary}--`,
      ''
    ].join('\r\n');

    // Send email via SES
    await sesClient.send(new SendRawEmailCommand({
      Source: senderEmail,
      Destinations: [recipientEmail],
      RawMessage: {
        Data: Buffer.from(rawMessage)
      }
    }));

    return {
      success: true,
      message: `Email sent successfully to ${recipientEmail}`
    };

  } catch (error) {
    console.error('Error sending email:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};