import { defineFunction } from '@aws-amplify/backend';

export const getUserDetails = defineFunction({
  name: 'get-user-details',
  resourceGroupName: 'userManagement',
});
