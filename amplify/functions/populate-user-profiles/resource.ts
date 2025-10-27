import { defineFunction } from '@aws-amplify/backend';

export const populateUserProfiles = defineFunction({
  name: 'populate-user-profiles',
  resourceGroupName: 'data',
  timeoutSeconds: 300,
});
