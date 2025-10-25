import { defineFunction } from '@aws-amplify/backend';

export const populateUserProfiles = defineFunction({
  name: 'populate-user-profiles',
  resourceGroupName: 'userManagement',
  timeoutSeconds: 300,
});
