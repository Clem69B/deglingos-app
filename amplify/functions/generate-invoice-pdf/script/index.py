import json
import os
import boto3
from datetime import datetime
from decimal import Decimal
from weasyprint import HTML, CSS
from jinja2 import Template
from io import BytesIO

# AWS Clients
dynamodb = boto3.resource('dynamodb')
s3_client = boto3.client('s3')

def decimal_to_float(obj):
    """Convert Decimal objects to float for JSON serialization"""
    if isinstance(obj, Decimal):
        return float(obj)
    raise TypeError

def get_invoice_data(invoice_id, invoice_table_name, patient_table_name, user_profile_table_name, user_id):
    """Fetch invoice, patient and user profile data from DynamoDB"""
    # Get invoice
    invoice_table = dynamodb.Table(invoice_table_name)
    invoice_response = invoice_table.get_item(Key={'id': invoice_id})
    
    if 'Item' not in invoice_response:
        return None, None, None
    
    invoice = invoice_response['Item']
    
    # Get patient
    patient_table = dynamodb.Table(patient_table_name)
    patient_response = patient_table.get_item(Key={'id': invoice['patientId']})
    
    patient = patient_response.get('Item')
    
    # Get user profile
    user_profile = None
    if user_id and user_profile_table_name:
        user_profile_table = dynamodb.Table(user_profile_table_name)
        user_profile_response = user_profile_table.get_item(Key={'userId': user_id})
        user_profile = user_profile_response.get('Item')
    
    return invoice, patient, user_profile

def format_date(date_str):
    """Format date string to French format"""
    if not date_str:
        return ''
    try:
        if isinstance(date_str, str):
            # Try different date formats
            for fmt in ['%Y-%m-%d', '%Y-%m-%dT%H:%M:%S.%fZ', '%Y-%m-%dT%H:%M:%SZ']:
                try:
                    date_obj = datetime.strptime(date_str, fmt)
                    return date_obj.strftime('%d/%m/%Y')
                except ValueError:
                    continue
        return date_str
    except Exception as e:
        print(f"Error formatting date: {e}")
        return date_str

def get_signature_base64(signature_s3_key, bucket_name):
    """Download signature from S3 and convert to base64"""
    if not signature_s3_key or not bucket_name:
        return None
    
    try:
        response = s3_client.get_object(Bucket=bucket_name, Key=signature_s3_key)
        signature_data = response['Body'].read()
        
        # Convert to base64
        import base64
        signature_base64 = base64.b64encode(signature_data).decode('utf-8')
        
        # Detect content type
        content_type = response.get('ContentType', 'image/png')
        
        return f"data:{content_type};base64,{signature_base64}"
    except Exception as e:
        print(f"Error loading signature from S3: {e}")
        return None

def generate_html(invoice, patient, user_profile, bucket_name):
    """Generate HTML content from template"""
    
    # Load template from file
    template_path = os.path.join(os.path.dirname(__file__), 'templates', 'invoice.html')
    
    try:
        with open(template_path, 'r', encoding='utf-8') as f:
            html_template = f.read()
    except FileNotFoundError:
        print(f"Template not found at {template_path}, using inline template")
        # Fallback to inline template if file not found
        html_template = """
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Reçu d'honoraires - {{ invoice_number }}</title>
    <style>
        body { font-family: Arial; padding: 20px; }
        .header { margin-bottom: 40px; }
        .title { text-align: center; font-size: 18pt; margin: 40px 0; }
    </style>
</head>
<body>
    <div class="header">
        <h1>{{ practitioner_name }}</h1>
        <p>{{ address }}</p>
    </div>
    <div class="title">REÇU D'HONORAIRES</div>
    <p>Montant: {{ amount }} €</p>
    <p>Date: {{ consultation_date }}</p>
    <p>Patient: {{ patient_name }}</p>
</body>
</html>
        """
    
    # Extract user profile data with empty strings as fallback
    if user_profile:
        given_name = user_profile.get('givenName', '')
        family_name = user_profile.get('familyName', '')
        practitioner_name = f"{given_name} {family_name}".strip() or ''
        professional_title = user_profile.get('professionalTitle', '')
        rpps_number = user_profile.get('rpps', '')
        siret_number = user_profile.get('siret', '')
        address = user_profile.get('postalAddress', '')
        phone_raw = user_profile.get('phoneNumber', '')
        phone = phone_raw if phone_raw and phone_raw != 'None' else ''
        email = user_profile.get('email', '')
        invoice_footer = user_profile.get('invoiceFooter', '')
        signature_s3_key = user_profile.get('signatureS3Key', '')
    else:
        # If no user profile, use empty strings
        practitioner_name = ''
        professional_title = ''
        rpps_number = ''
        siret_number = ''
        address = ''
        phone = ''
        email = ''
        invoice_footer = ''
        signature_s3_key = ''
    
    # Get signature from S3 if available
    signature_data_uri = None
    if signature_s3_key:
        signature_data_uri = get_signature_base64(signature_s3_key, bucket_name)
    
    # Prepare template data
    template_data = {
        'practitioner_name': practitioner_name,
        'professional_title': professional_title,
        'rpps_number': rpps_number,
        'siret_number': siret_number,
        'address': address,
        'postal_code': '',  # Not in UserProfile, keep empty
        'city': '',  # Not in UserProfile, keep empty
        'phone': phone,
        'email': email,
        'invoice_footer': invoice_footer,
        'signature_data_uri': signature_data_uri,
        'invoice_number': invoice.get('invoiceNumber', ''),
        'amount': float(invoice.get('total', invoice.get('price', 0))),
        'consultation_date': format_date(invoice.get('date')),
        'patient_name': f"{patient.get('firstName', '')} {patient.get('lastName', '')}".strip() if patient else '',
    }
    
    # Render template
    template = Template(html_template)
    html_content = template.render(**template_data)
    
    return html_content

def handler(event, context):
    """AWS Lambda handler"""
    print('Generate Invoice PDF event:', json.dumps(event, default=str))
    
    try:
        # Get arguments
        arguments = event.get('arguments', {})
        invoice_id = arguments.get('invoiceId')
        
        if not invoice_id:
            return {
                'success': False,
                'message': 'Invoice ID is required'
            }
        
        # Get user ID from identity (Cognito)
        user_id = None
        identity = event.get('identity', {})
        if identity:
            user_id = identity.get('sub') or identity.get('username')
        
        # Get environment variables
        invoice_table_name = os.environ.get('AMPLIFY_DATA_INVOICE_TABLE_NAME')
        patient_table_name = os.environ.get('AMPLIFY_DATA_PATIENT_TABLE_NAME')
        user_profile_table_name = os.environ.get('AMPLIFY_DATA_USERPROFILE_TABLE_NAME')
        bucket_name = os.environ.get('AMPLIFY_STORAGE_BUCKET_NAME')
        
        if not invoice_table_name or not patient_table_name or not bucket_name:
            raise Exception('Required environment variables not configured')
        
        print(f'User ID: {user_id}')
        print(f'UserProfile table: {user_profile_table_name}')
        
        # Get data
        invoice, patient, user_profile = get_invoice_data(
            invoice_id, 
            invoice_table_name, 
            patient_table_name,
            user_profile_table_name,
            user_id
        )
        
        if not invoice:
            return {
                'success': False,
                'message': 'Invoice not found'
            }
        
        print('Invoice data:', json.dumps(invoice, default=decimal_to_float))
        if patient:
            print('Patient data:', json.dumps(patient, default=decimal_to_float))
        if user_profile:
            print('UserProfile data:', json.dumps(user_profile, default=decimal_to_float))
        
        # Generate HTML
        html_content = generate_html(invoice, patient, user_profile, bucket_name)
        
        # Generate PDF with WeasyPrint
        pdf_file = HTML(string=html_content).write_pdf()
        
        # Upload to S3
        invoice_number = invoice.get('invoiceNumber', invoice_id)
        key = f"invoices/{invoice_number}.pdf"
        
        s3_client.put_object(
            Bucket=bucket_name,
            Key=key,
            Body=pdf_file,
            ContentType='application/pdf',
            ContentDisposition=f'attachment; filename="{invoice_number}.pdf"'
        )
        
        pdf_url = f"https://{bucket_name}.s3.amazonaws.com/{key}"
        
        return {
            'success': True,
            'pdfUrl': pdf_url,
            'message': 'PDF generated successfully'
        }
        
    except Exception as error:
        print(f'Error generating PDF: {error}')
        import traceback
        traceback.print_exc()
        
        return {
            'success': False,
            'message': f'{str(error)}\n\nStack: {traceback.format_exc()}'
        }
