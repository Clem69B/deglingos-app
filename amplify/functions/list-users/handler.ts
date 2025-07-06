import { env } from '$amplify/env/list-users';
import {
  ListUsersCommand,
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
    console.error(`Error getting groups for user ${user.Username}:`, error);
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

export const handler = async (event: any) => {
  try {
    console.log('listUsers event:', JSON.stringify(event, null, 2));
    
    const { limit = 20, nextToken } = event.arguments;
    
    const command = new ListUsersCommand({
      UserPoolId: env.AMPLIFY_AUTH_USERPOOL_ID,
      Limit: limit || undefined,
      PaginationToken: nextToken || undefined,
    });
    
    const response = await client.send(command);
    
    // Traiter chaque utilisateur pour inclure les groupes
    const users = [];
    if (response.Users) {
      for (const user of response.Users) {
        const formattedUser = await formatUserData(user);
        users.push(formattedUser);
      }
    }
    
    const result = {
      users: users,
      nextToken: response.PaginationToken || null,
      totalCount: users.length, // Nombre d'utilisateurs dans cette page
    };
    
    console.log('listUsers result:', JSON.stringify(result, null, 2));
    return result;
    
  } catch (error: any) {
    console.error('Error listing users:', error);
    
    throw new Error(`Failed to list users: ${error.message || 'Unknown error'}`);
  }
};
