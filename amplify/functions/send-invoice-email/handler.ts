import { env } from '$amplify/env/send-invoice-email';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand } from '@aws-sdk/lib-dynamodb';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';

// Initialize clients
const dynamoClient = new DynamoDBClient({ region: env.AWS_REGION });
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const sesClient = new SESClient({ region: env.AWS_REGION });

export const handler = async (event: any) => {
  console.log('sendInvoiceEmail event:', JSON.stringify(event, null, 2));
  
  try {
    const { invoiceId } = event.arguments;
    
    if (!invoiceId) {
      throw new Error('invoiceId is required');
    }
    
    // Fetch invoice details from DynamoDB
    const invoiceParams = {
      TableName: env.AMPLIFY_DATA_INVOICE_TABLE_NAME,
      Key: { id: invoiceId },
    };
    
    const invoiceResult = await docClient.send(new GetCommand(invoiceParams));
    const invoice = invoiceResult.Item;
    
    if (!invoice) {
      throw new Error(`Invoice with ID ${invoiceId} not found`);
    }
    
    // Fetch patient details
    const patientParams = {
      TableName: env.AMPLIFY_DATA_PATIENT_TABLE_NAME,
      Key: { id: invoice.patientId },
    };
    
    const patientResult = await docClient.send(new GetCommand(patientParams));
    const patient = patientResult.Item;
    
    if (!patient) {
      throw new Error(`Patient with ID ${invoice.patientId} not found`);
    }
    
    if (!patient.email) {
      throw new Error(`Patient ${patient.firstName} ${patient.lastName} has no email address`);
    }
    
    // Validate invoice data
    if (!invoice.invoiceNumber) {
      throw new Error('Invoice number is missing');
    }
    
    if (!invoice.date) {
      throw new Error('Invoice date is missing');
    }
    
    // Create email content
    const cabinetName = env.CABINET_NAME || 'Cabinet d\'Ostéopathie';
    const subject = `Facture ${invoice.invoiceNumber} - ${cabinetName}`;
    const htmlBody = generateInvoiceEmailHTML(invoice, patient, cabinetName);
    const textBody = generateInvoiceEmailText(invoice, patient, cabinetName);
    
    // Send email via SES
    const emailParams = {
      Source: env.SENDER_EMAIL || 'noreply@deglingos-app.com', // Cette adresse doit être vérifiée dans SES
      Destination: {
        ToAddresses: [patient.email],
      },
      Message: {
        Subject: {
          Data: subject,
          Charset: 'UTF-8',
        },
        Body: {
          Html: {
            Data: htmlBody,
            Charset: 'UTF-8',
          },
          Text: {
            Data: textBody,
            Charset: 'UTF-8',
          },
        },
      },
    };
    
    const emailResult = await sesClient.send(new SendEmailCommand(emailParams));
    
    console.log('Email sent successfully:', emailResult.MessageId);
    
    return {
      success: true,
      message: `Email sent successfully to ${patient.email}`,
      messageId: emailResult.MessageId,
    };
    
  } catch (error: any) {
    console.error('Error sending invoice email:', error);
    
    return {
      success: false,
      message: `Failed to send email: ${error.message}`,
      error: error.message,
    };
  }
};

// Generate HTML email template
function generateInvoiceEmailHTML(invoice: any, patient: any, cabinetName: string): string {
  const invoiceDate = new Date(invoice.date).toLocaleDateString('fr-FR');
  const dueDate = invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString('fr-FR') : 'Non spécifiée';
  const total = invoice.total ? `${invoice.total.toFixed(2)} €` : 'Non spécifié';
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Facture ${invoice.invoiceNumber}</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin-bottom: 20px; }
        .invoice-details { background-color: #ffffff; border: 1px solid #e9ecef; padding: 20px; border-radius: 5px; }
        .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #e9ecef; font-size: 12px; color: #6c757d; }
        h1 { color: #495057; margin: 0; }
        .detail-row { margin: 10px 0; }
        .label { font-weight: bold; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>${cabinetName}</h1>
          <p>Votre facture est disponible</p>
        </div>
        
        <p>Bonjour ${patient.firstName} ${patient.lastName},</p>
        
        <p>Nous vous prions de trouver ci-dessous les détails de votre facture :</p>
        
        <div class="invoice-details">
          <div class="detail-row">
            <span class="label">Numéro de facture :</span> ${invoice.invoiceNumber}
          </div>
          <div class="detail-row">
            <span class="label">Date de facturation :</span> ${invoiceDate}
          </div>
          <div class="detail-row">
            <span class="label">Date d'échéance :</span> ${dueDate}
          </div>
          <div class="detail-row">
            <span class="label">Montant total :</span> ${total}
          </div>
          ${invoice.notes ? `
          <div class="detail-row">
            <span class="label">Notes :</span> ${invoice.notes}
          </div>
          ` : ''}
        </div>
        
        <p>Nous vous remercions de votre confiance et restons à votre disposition pour tout renseignement complémentaire.</p>
        
        <div class="footer">
          <p>Cet email a été envoyé automatiquement, merci de ne pas y répondre.</p>
          <p>En cas de question, veuillez contacter directement le cabinet.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

// Generate plain text email template
function generateInvoiceEmailText(invoice: any, patient: any, cabinetName: string): string {
  const invoiceDate = new Date(invoice.date).toLocaleDateString('fr-FR');
  const dueDate = invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString('fr-FR') : 'Non spécifiée';
  const total = invoice.total ? `${invoice.total.toFixed(2)} €` : 'Non spécifié';
  
  return `
${cabinetName}
Votre facture est disponible

Bonjour ${patient.firstName} ${patient.lastName},

Nous vous prions de trouver ci-dessous les détails de votre facture :

Numéro de facture : ${invoice.invoiceNumber}
Date de facturation : ${invoiceDate}
Date d'échéance : ${dueDate}
Montant total : ${total}
${invoice.notes ? `Notes : ${invoice.notes}` : ''}

Nous vous remercions de votre confiance et restons à votre disposition pour tout renseignement complémentaire.

---
Cet email a été envoyé automatiquement, merci de ne pas y répondre.
En cas de question, veuillez contacter directement le cabinet.
  `;
}