import { env } from '$amplify/env/get-user-details';
import type { Schema } from "../../data/resource"
import {
  AdminGetUserCommand,
  AdminListGroupsForUserCommand,
  CognitoIdentityProviderClient,
} from '@aws-sdk/client-cognito-identity-provider';

const client = new CognitoIdentityProviderClient();

// Utility function to format user data
const formatUserData = async (user: any) => {
  const attributes = user.Attributes || user.UserAttributes || [];
  const attributeMap: { [key: string]: string } = {};
  
  attributes.forEach((attr: any) => {
    attributeMap[attr.Name] = attr.Value;
  });

  // Récupérer les groupes de l'utilisateur
  let groups: string[] = [];
  try {
    const groupsCommand = new AdminListGroupsForUserCommand({
      Username: user.Username,
      UserPoolId: env.AMPLIFY_AUTH_USERPOOL_ID,
    });
    const groupsResponse = await client.send(groupsCommand);
    groups = groupsResponse.Groups?.map(group => group.GroupName || '') || [];
  } catch (error) {
    // Continue sans les groupes plutôt que d'échouer
  }

  return {
    userId: user.Username,
    email: attributeMap['email'] || '',
    givenName: attributeMap['given_name'] || '',
    familyName: attributeMap['family_name'] || '',
    phoneNumber: attributeMap['phone_number'] || '',
    enabled: user.Enabled,
    userStatus: user.UserStatus,
    groups: groups,
    createdDate: user.UserCreateDate,
    lastModifiedDate: user.UserLastModifiedDate,
  };
};

export const handler: Schema["getUserDetails"]["functionHandler"] = async (event: any) => {
  try {
    console.log('getUserDetails event:', JSON.stringify(event, null, 2));
    
    const { userId } = event.arguments;
    
    if (!userId) {
      throw new Error('userId is required');
    }
    
    const command = new AdminGetUserCommand({
      Username: userId,
      UserPoolId: env.AMPLIFY_AUTH_USERPOOL_ID,
    });
    
    const response = await client.send(command);
    const result = await formatUserData(response);
    
    console.log('getUserDetails result:', JSON.stringify(result, null, 2));
    return result;
    
  } catch (error: any) {
    console.error('Error getting user details:', error);
    
    // Return a more user-friendly error for common cases
    if (error.name === 'UserNotFoundException') {
      throw new Error('User not found');
    }
    
    throw new Error(`Failed to get user details: ${error.message || 'Unknown error'}`);
  }
};
