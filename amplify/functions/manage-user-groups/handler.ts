import type { Schema } from '../../data/resource';
import { env } from '$amplify/env/manage-user-groups';
import {
  AdminAddUserToGroupCommand,
  AdminRemoveUserFromGroupCommand,
  CognitoIdentityProviderClient,
} from '@aws-sdk/client-cognito-identity-provider';

const client = new CognitoIdentityProviderClient();

export const handler: Schema["manageUserGroups"]["functionHandler"] = async (event) => {
  try {
    console.log('manageUserGroups event:', JSON.stringify(event, null, 2));
    
    const { action, userId, groupName } = event.arguments;
    
    if (!userId || !groupName) {
      throw new Error('userId and groupName are required');
    }
    
    // Validation des groupes autorisés
    const validGroups = ['osteopaths', 'assistants', 'admins'];
    if (!validGroups.includes(groupName)) {
      throw new Error(`Invalid group: ${groupName}. Valid groups are: ${validGroups.join(', ')}`);
    }
    
    let result;

    switch (action) {
      case 'add':
        const addCommand = new AdminAddUserToGroupCommand({
          UserPoolId: env.AMPLIFY_AUTH_USERPOOL_ID,
          Username: userId,
          GroupName: groupName,
        });
        
        await client.send(addCommand);
        
        result = {
          success: true,
          message: `User ${userId} added to group ${groupName} successfully`,
        };
        break;

      case 'remove':
        const removeCommand = new AdminRemoveUserFromGroupCommand({
          UserPoolId: env.AMPLIFY_AUTH_USERPOOL_ID,
          Username: userId,
          GroupName: groupName,
        });
        
        await client.send(removeCommand);
        
        result = {
          success: true,
          message: `User ${userId} removed from group ${groupName} successfully`,
        };
        break;
        
      default:
        throw new Error(`Unknown action: ${action}`);
    }
    
    console.log('manageUserGroups result:', JSON.stringify(result, null, 2));
    return result;
    
  } catch (error: any) {
    console.error('Error managing user groups:', error);
    
    // Messages d'erreur plus spécifiques
    if (error.name === 'UserNotFoundException') {
      throw new Error('User not found');
    }
    if (error.name === 'ResourceNotFoundException') {
      throw new Error('Group not found');
    }
    
    throw new Error(`Failed to manage user groups: ${error.message || 'Unknown error'}`);
  }
};
