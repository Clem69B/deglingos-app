import { env } from '$amplify/env/populate-user-profiles';
import {
  CognitoIdentityProviderClient,
  ListUsersCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, GetCommand } from '@aws-sdk/lib-dynamodb';

const cognitoClient = new CognitoIdentityProviderClient();
const dynamoClient = DynamoDBDocumentClient.from(new DynamoDBClient({}));

export const handler = async (event: any) => {
  try {
    console.log('Starting UserProfile migration...');
    
    const userProfileTableName = env.AMPLIFY_DATA_USERPROFILE_TABLE_NAME;
    let paginationToken: string | undefined = undefined;
    let totalUsers = 0;
    let createdProfiles = 0;
    let skippedProfiles = 0;
    
    do {
      // List users from Cognito
      const listCommand = new ListUsersCommand({
        UserPoolId: env.AMPLIFY_AUTH_USERPOOL_ID,
        Limit: 60,
        PaginationToken: paginationToken,
      });
      
      const response = await cognitoClient.send(listCommand);
      
      if (response.Users) {
        for (const user of response.Users) {
          totalUsers++;
          
          const userId = user.Username;
          if (!userId) continue;
          
          // Check if profile already exists
          const existingProfile = await dynamoClient.send(new GetCommand({
            TableName: userProfileTableName,
            Key: { userId },
          }));
          
          if (existingProfile.Item) {
            console.log(`Profile already exists for ${userId}, skipping`);
            skippedProfiles++;
            continue;
          }
          
          // Extract user attributes
          const attributes = user.Attributes || [];
          const attributeMap: { [key: string]: string } = {};
          attributes.forEach((attr: any) => {
            if (attr.Name && attr.Value) {
              attributeMap[attr.Name] = attr.Value;
            }
          });
          
          const now = new Date().toISOString();
          
          // Create UserProfile
          const userProfile = {
            userId: userId,
            email: attributeMap['email'] || '',
            givenName: attributeMap['given_name'] || '',
            familyName: attributeMap['family_name'] || '',
            phoneNumber: attributeMap['phone_number'] || null,
            createdAt: now,
            updatedAt: now,
          };
          
          await dynamoClient.send(new PutCommand({
            TableName: userProfileTableName,
            Item: userProfile,
          }));
          
          console.log(`Created UserProfile for ${userId}`);
          createdProfiles++;
        }
      }
      
      paginationToken = response.PaginationToken;
    } while (paginationToken);
    
    const result = {
      success: true,
      message: 'Migration completed',
      totalUsers,
      createdProfiles,
      skippedProfiles,
    };
    
    console.log('Migration result:', JSON.stringify(result, null, 2));
    return result;
    
  } catch (error: any) {
    console.error('Error during migration:', error);
    throw new Error(`Migration failed: ${error.message || 'Unknown error'}`);
  }
};
