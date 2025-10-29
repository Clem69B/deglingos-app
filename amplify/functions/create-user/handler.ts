import { env } from '$amplify/env/create-user';
import {
  AdminCreateUserCommand,
  AdminAddUserToGroupCommand,
  CognitoIdentityProviderClient,
  MessageActionType,
} from '@aws-sdk/client-cognito-identity-provider';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';

const client = new CognitoIdentityProviderClient();
const dynamoClient = DynamoDBDocumentClient.from(new DynamoDBClient({}));

export const handler = async (event: any) => {
  try {
    console.log('createUser event:', JSON.stringify(event, null, 2));
    
    const { email, givenName, familyName, phoneNumber, groups } = event.arguments;
    
    // Validation des groupes autorisés
    const validGroups = ['osteopaths', 'assistants', 'admins'];
    const invalidGroups = groups.filter((group: string) => !validGroups.includes(group));
    if (invalidGroups.length > 0) {
      throw new Error(`Invalid groups: ${invalidGroups.join(', ')}. Valid groups are: ${validGroups.join(', ')}`);
    }
    
    // Préparer les attributs utilisateur
    const userAttributes = [
      { Name: 'email', Value: email },
      { Name: 'given_name', Value: givenName },
      { Name: 'family_name', Value: familyName },
      { Name: 'email_verified', Value: 'true' },
    ];
    
    if (phoneNumber) {
      userAttributes.push({ Name: 'phone_number', Value: phoneNumber });
    }
    
    // Créer l'utilisateur
    const createCommand = new AdminCreateUserCommand({
      UserPoolId: env.AMPLIFY_AUTH_USERPOOL_ID,
      Username: email,
      UserAttributes: userAttributes,
      DesiredDeliveryMediums: ['EMAIL'],
    });
    
    const createResponse = await client.send(createCommand);
    const userId = createResponse.User?.Username;
    
    if (!userId) {
      throw new Error('Failed to create user: no userId returned');
    }
    
    // Ajouter l'utilisateur aux groupes spécifiés
    for (const groupName of groups) {
      try {
        const addToGroupCommand = new AdminAddUserToGroupCommand({
          UserPoolId: env.AMPLIFY_AUTH_USERPOOL_ID,
          Username: userId,
          GroupName: groupName,
        });
        
        await client.send(addToGroupCommand);
        console.log(`User ${userId} added to group ${groupName}`);
      } catch (groupError) {
        console.error(`Error adding user to group ${groupName}:`, groupError);
        // Continue avec les autres groupes
      }
    }
    
    // Create UserProfile record in DynamoDB
    try {
      const userProfileTableName = env.AMPLIFY_DATA_USERPROFILE_TABLE_NAME;
      const now = new Date().toISOString();
      
      const userProfile = {
        userId: userId,
        email: email,
        givenName: givenName,
        familyName: familyName,
        phoneNumber: phoneNumber || null,
        createdAt: now,
        updatedAt: now,
      };
      
      await dynamoClient.send(new PutCommand({
        TableName: userProfileTableName,
        Item: userProfile,
      }));
      
      console.log(`UserProfile created for ${userId}`);
    } catch (profileError) {
      console.error('Error creating UserProfile:', profileError);
      // Continue - profile can be created later via migration
    }
    
    const result = {
      success: true,
      userId: userId,
      message: `User created successfully. Welcome email sent to ${email}`,
    };
    
    console.log('createUser result:', JSON.stringify(result, null, 2));
    return result;
    
  } catch (error: any) {
    console.error('Error creating user:', error);
    
    // Messages d'erreur plus spécifiques
    if (error.name === 'UsernameExistsException') {
      throw new Error('A user with this email already exists');
    }
    
    throw new Error(`Failed to create user: ${error.message || 'Unknown error'}`);
  }
};
