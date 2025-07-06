import { env } from '$amplify/env/delete-user';
import {
  AdminDeleteUserCommand,
  CognitoIdentityProviderClient,
} from '@aws-sdk/client-cognito-identity-provider';

const client = new CognitoIdentityProviderClient();

export const handler = async (event: any) => {
  try {
    console.log('deleteUser event:', JSON.stringify(event, null, 2));
    
    const { userId } = event.arguments;
    
    if (!userId) {
      throw new Error('userId is required');
    }
    
    // Supprimer l'utilisateur
    const deleteCommand = new AdminDeleteUserCommand({
      UserPoolId: env.AMPLIFY_AUTH_USERPOOL_ID,
      Username: userId,
    });
    
    await client.send(deleteCommand);
    
    const result = {
      success: true,
      message: `User ${userId} deleted successfully`,
    };
    
    console.log('deleteUser result:', JSON.stringify(result, null, 2));
    return result;
    
  } catch (error: any) {
    console.error('Error deleting user:', error);
    
    // Messages d'erreur plus spécifiques
    if (error.name === 'UserNotFoundException') {
      throw new Error('User not found');
    }
    
    throw new Error(`Failed to delete user: ${error.message || 'Unknown error'}`);
  }
};
