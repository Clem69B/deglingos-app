import { defineFunction } from '@aws-amplify/backend';

export const manageUserGroups = defineFunction({
  name: 'manage-user-groups',
  resourceGroupName: 'data',
});
