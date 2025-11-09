import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { storage } from './storage/resource';
import { updateOverdueInvoices } from './functions/update-overdue-invoices/resource';
import { generateInvoicePdf } from './functions/generate-invoice-pdf/resource';
import { sendInvoiceEmail } from './functions/send-invoice-email/resource';
import { downloadInvoicePdf } from './functions/download-invoice-pdf/resource';
import { populateUserProfiles } from './functions/populate-user-profiles/resource';
import { deleteUser } from './functions/delete-user/resource';
import { getUserDetails } from './functions/get-user-details/resource';
import { listUsers } from './functions/list-users/resource';
import { manageUserGroups } from './functions/manage-user-groups/resource';
import { createUser } from './functions/create-user/resource';
import { PolicyStatement } from "aws-cdk-lib/aws-iam";
import { BackupPlan, BackupPlanRule, BackupResource, BackupVault } from 'aws-cdk-lib/aws-backup';
import { Duration } from 'aws-cdk-lib';
import { Schedule } from 'aws-cdk-lib/aws-events';

const currentEnvironment = process.env.AMPLIFY_ENVIRONMENT || 'sandbox';
const isProduction = currentEnvironment === 'production' || currentEnvironment === 'prod';

export const backend = defineBackend({
  auth,
  storage,
  data,
  createUser,
  deleteUser,
  getUserDetails,
  listUsers,
  manageUserGroups,
  updateOverdueInvoices,
  generateInvoicePdf,
  sendInvoiceEmail,
  downloadInvoicePdf,
  populateUserProfiles,
});

// =================== Permissions Configuration ===================

// === Invoice Management ===

// Grant the scheduled function access to the Invoice table
backend.updateOverdueInvoices.addEnvironment('AMPLIFY_DATA_INVOICE_TABLE_NAME', backend.data.resources.tables['Invoice'].tableName);
backend.data.resources.tables['Invoice'].grantReadWriteData(backend.updateOverdueInvoices.resources.lambda);

// Grant PDF generation function access to Invoice, Patient and UserProfile tables and S3 storage
backend.generateInvoicePdf.addEnvironment('AMPLIFY_DATA_INVOICE_TABLE_NAME', backend.data.resources.tables['Invoice'].tableName);
backend.generateInvoicePdf.addEnvironment('AMPLIFY_DATA_PATIENT_TABLE_NAME', backend.data.resources.tables['Patient'].tableName);
backend.generateInvoicePdf.addEnvironment('AMPLIFY_DATA_USERPROFILE_TABLE_NAME', backend.data.resources.tables['UserProfile'].tableName);
backend.generateInvoicePdf.addEnvironment('AMPLIFY_STORAGE_BUCKET_NAME', backend.storage.resources.bucket.bucketName);
backend.data.resources.tables['Invoice'].grantReadData(backend.generateInvoicePdf.resources.lambda);
backend.data.resources.tables['Patient'].grantReadData(backend.generateInvoicePdf.resources.lambda);
backend.data.resources.tables['UserProfile'].grantReadData(backend.generateInvoicePdf.resources.lambda);
backend.storage.resources.bucket.grantReadWrite(backend.generateInvoicePdf.resources.lambda);

// Grant email function access to Invoice and Patient tables and S3 storage
backend.sendInvoiceEmail.addEnvironment('AMPLIFY_DATA_INVOICE_TABLE_NAME', backend.data.resources.tables['Invoice'].tableName);
backend.sendInvoiceEmail.addEnvironment('AMPLIFY_DATA_PATIENT_TABLE_NAME', backend.data.resources.tables['Patient'].tableName);
backend.sendInvoiceEmail.addEnvironment('AMPLIFY_DATA_USERPROFILE_TABLE_NAME', backend.data.resources.tables['UserProfile'].tableName);
backend.sendInvoiceEmail.addEnvironment('AMPLIFY_STORAGE_BUCKET_NAME', backend.storage.resources.bucket.bucketName);
backend.data.resources.tables['Invoice'].grantReadData(backend.sendInvoiceEmail.resources.lambda);
backend.data.resources.tables['Patient'].grantReadData(backend.sendInvoiceEmail.resources.lambda);
backend.data.resources.tables['UserProfile'].grantReadData(backend.sendInvoiceEmail.resources.lambda);
backend.storage.resources.bucket.grantRead(backend.sendInvoiceEmail.resources.lambda);

// Authorize email function to send emails via SES
const sesPolicy = new PolicyStatement({
  sid: "AllowSESSendEmail",
  actions: ['ses:SendEmail', 'ses:SendRawEmail'],
  resources: ['*'],
});
backend.sendInvoiceEmail.resources.lambda.addToRolePolicy(sesPolicy);

// Grant download function access to Invoice table and S3 storage
backend.downloadInvoicePdf.addEnvironment('AMPLIFY_DATA_INVOICE_TABLE_NAME', backend.data.resources.tables['Invoice'].tableName);
backend.downloadInvoicePdf.addEnvironment('AMPLIFY_STORAGE_BUCKET_NAME', backend.storage.resources.bucket.bucketName);
backend.data.resources.tables['Invoice'].grantReadData(backend.downloadInvoicePdf.resources.lambda);
backend.storage.resources.bucket.grantRead(backend.downloadInvoicePdf.resources.lambda);

// === User Management ===

// Grant Lambda functions access to Cognito User Pool
const cognitoPolicy = new PolicyStatement({
  sid: "AllowCognitoUserPoolAccess",
  actions: [
    'cognito-idp:AdminGetUser',
    'cognito-idp:ListUsers',
    'cognito-idp:AdminCreateUser',
    'cognito-idp:AdminDeleteUser',
    'cognito-idp:AdminAddUserToGroup',
    'cognito-idp:AdminRemoveUserFromGroup',
    'cognito-idp:AdminListGroupsForUser'
  ],
  resources: [
    // Get ARN from auth
    backend.auth.resources.userPool.userPoolArn
  ],
});

// Apply to all user management functions
backend.getUserDetails.resources.lambda.addToRolePolicy(cognitoPolicy);
backend.listUsers.resources.lambda.addToRolePolicy(cognitoPolicy);
backend.createUser.resources.lambda.addToRolePolicy(cognitoPolicy);
backend.deleteUser.resources.lambda.addToRolePolicy(cognitoPolicy);
backend.manageUserGroups.resources.lambda.addToRolePolicy(cognitoPolicy);

// Pass the User Pool ID to all user management functions
backend.createUser.addEnvironment('AMPLIFY_AUTH_USERPOOL_ID', backend.auth.resources.userPool.userPoolId);
backend.deleteUser.addEnvironment('AMPLIFY_AUTH_USERPOOL_ID', backend.auth.resources.userPool.userPoolId);
backend.getUserDetails.addEnvironment('AMPLIFY_AUTH_USERPOOL_ID', backend.auth.resources.userPool.userPoolId);
backend.listUsers.addEnvironment('AMPLIFY_AUTH_USERPOOL_ID', backend.auth.resources.userPool.userPoolId);
backend.manageUserGroups.addEnvironment('AMPLIFY_AUTH_USERPOOL_ID', backend.auth.resources.userPool.userPoolId);

// Grant the create user function access to the UserProfile table
backend.createUser.addEnvironment('AMPLIFY_DATA_USERPROFILE_TABLE_NAME', backend.data.resources.tables['UserProfile'].tableName);
backend.data.resources.tables['UserProfile'].grantReadWriteData(backend.createUser.resources.lambda);

// TODO: Migration specific, to remove on next version
backend.populateUserProfiles.resources.lambda.addToRolePolicy(cognitoPolicy);
backend.populateUserProfiles.addEnvironment('AMPLIFY_AUTH_USERPOOL_ID', backend.auth.resources.userPool.userPoolId);
backend.populateUserProfiles.addEnvironment('AMPLIFY_DATA_USERPROFILE_TABLE_NAME', backend.data.resources.tables['UserProfile'].tableName);
backend.data.resources.tables['UserProfile'].grantReadWriteData(backend.populateUserProfiles.resources.lambda);

// =================== Environment & Backup Configuration ===================

backend.addOutput({
  custom: {
    region: process.env.AWS_REGION || 'eu-west-3',
  },
});

if (isProduction) {
  console.log('🔒 Enable backup for all tables (Prod only)');

  const backupStack = backend.createStack("backup-stack");

  const vault = new BackupVault(backupStack, "BackupVault", {
    backupVaultName: `${currentEnvironment}-backup-vault`,
  });

  const plan = new BackupPlan(backupStack, "BackupPlan", {
    backupPlanName: `${currentEnvironment}-backup-plan`,
    backupVault: vault,
  });

  // Weekly backup rule with 90 days retention
  plan.addRule(
    new BackupPlanRule({
      deleteAfter: Duration.days(90),
      ruleName: `${currentEnvironment}-backup-plan-rule`,
      scheduleExpression: Schedule.cron({
        minute: "0",
        hour: "0",
        weekDay: "1",
        month: "*",
        year: "*",
      }),
    })
  );
 
  // Add all DynamoDB tables to the backup plan
  const myTables = Object.values(backend.data.resources.tables);
  plan.addSelection("DynamoDBTables", {
    resources: myTables.map((table) => BackupResource.fromDynamoDbTable(table)),
    allowRestores: true,
  });

  // Enable Point-in-time Recovery for all DynamoDB tables
  const { amplifyDynamoDbTables } = backend.data.resources.cfnResources;
  for (const table of Object.values(amplifyDynamoDbTables)) {
    table.pointInTimeRecoveryEnabled = true;
  }

} else {
  console.log(`⚠️  AWS Backup deactivated for : ${currentEnvironment}`);
}

