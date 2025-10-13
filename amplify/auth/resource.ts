import { defineAuth } from '@aws-amplify/backend';
import { getUserDetails } from '../functions/get-user-details/resource';
import { listUsers } from '../functions/list-users/resource';
import { createUser } from '../functions/create-user/resource';
import { deleteUser } from '../functions/delete-user/resource';
import { manageUserGroups } from '../functions/manage-user-groups/resource';

/**
 * This file defines the authentication configuration for the application.
 * It specifies how users can log in, the attributes required, and the user groups.
 */
export const auth = defineAuth({
  loginWith: {
    email: true,
  },
  userAttributes: {
    givenName: {
      mutable: true,
      required: true,
    },
    familyName: {
      mutable: true,
      required: true,
    },
    phoneNumber: {
      mutable: true,
      required: false,
    },
    // Custom attributes for professional profile
    'custom:professionalTitle': {
      dataType: 'String',
      mutable: true,
    },
    'custom:postalAddress': {
      dataType: 'String',
      mutable: true,
    },
    'custom:siret': {
      dataType: 'String',
      mutable: true,
    },
    'custom:rpps': {
      dataType: 'String',
      mutable: true,
    },
    'custom:defaultConsultationPrice': {
      dataType: 'String',
      mutable: true,
    },
    'custom:invoiceFooter': {
      dataType: 'String',
      mutable: true,
    },
  },
  groups: ['osteopaths', 'assistants', 'admins'],
  access: (allow) => [
    allow.resource(getUserDetails).to(['getUser', 'listGroupsForUser']),
    allow.resource(listUsers).to(['listUsers', 'listGroupsForUser']),
    allow.resource(createUser).to(['createUser']),
    allow.resource(deleteUser).to(['deleteUser']),
    allow.resource(manageUserGroups).to([
      'addUserToGroup', 
      'removeUserFromGroup'
    ])
  ],
});
