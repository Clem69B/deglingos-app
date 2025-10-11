import { type ClientSchema, a, defineData } from '@aws-amplify/backend';
import { getUserDetails } from '../functions/get-user-details/resource';
import { listUsers } from '../functions/list-users/resource';
import { createUser } from '../functions/create-user/resource';
import { deleteUser } from '../functions/delete-user/resource';
import { manageUserGroups } from '../functions/manage-user-groups/resource';
import { generateInvoicePdf } from '../functions/generate-invoice-pdf/resource';
import { sendInvoiceEmail } from '../functions/send-invoice-email/resource';
import { downloadInvoicePdf } from '../functions/download-invoice-pdf/resource';

const schema = a.schema({
  // Patient Model
  Patient: a
    .model({
      id: a.id(),
      firstName: a.string().required(),
      lastName: a.string().required(),
      email: a.email(),
      phone: a.phone(),
      dateOfBirth: a.date(),
      address: a.string(),
      city: a.string(),
      postalCode: a.string(),
      gender: a.enum(['M', 'F', 'OTHER']),
      profession: a.string(),
      referringPhysician: a.string(),
      medicalHistory: a.string(),
      surgicalHistory: a.string(),
      currentMedications: a.string(),
      activities: a.string(),
      consultations: a.hasMany('Consultation', 'patientId'),
      Appointment: a.hasMany('Appointment', 'patientId'),
      invoices: a.hasMany('Invoice', 'patientId'),
      createdAt: a.datetime(),
      updatedAt: a.datetime(),
    })
    .disableOperations(["subscriptions"])
    .authorization((allow) => [
      allow.group('osteopaths'),
      allow.group('assistants').to(['read']),
    ]),

  // Anamnesis custom type
  Anamnesis: a.customType({
    skull: a.string(), 
    cervical: a.string(),
    digestive: a.string(),
    cardioThoracic: a.string(),
    gynecological: a.string(),
    sleep: a.string(),
    psychological: a.string(),
  }),

  // Consultation Model
  Consultation: a
    .model({
      id: a.id(),
      patientId: a.id().required(),
      patient: a.belongsTo('Patient', 'patientId'),
      date: a.datetime().required(),
      duration: a.integer().default(60),
      reason: a.string(),
      anamnesis: a.ref('Anamnesis'),
      treatment: a.string(),
      recommendations: a.string(),
      invoice: a.hasOne('Invoice', 'consultationId'),
      notes: a.string(),
      createdAt: a.datetime(),
      updatedAt: a.datetime(),
    })
    .disableOperations(["subscriptions"])
    .authorization((allow) => [
      allow.group('osteopaths'),
      allow.owner()
    ]),

  // Invoice Model
  Invoice: a
    .model({
      id: a.id(),
      invoiceNumber: a.string().required(),
      patientId: a.id().required(),
      patient: a.belongsTo('Patient', 'patientId'),
      consultationId: a.id(),
      consultation: a.belongsTo('Consultation', 'consultationId'),
      date: a.date().required(),
      dueDate: a.date(),
      price: a.float(),
      total: a.float(),
      isPaid: a.boolean().default(false),
      status: a.enum(['DRAFT', 'PENDING', 'PAID', 'OVERDUE']),
      paymentMethod: a.enum(['CHECK', 'BANK_TRANSFER', 'CASH', 'CARD']),
      paymentReference: a.string(),
      paidAt: a.datetime(),
      notes: a.string(),
      createdAt: a.datetime(),
      updatedAt: a.datetime(),
    })
    .disableOperations(["subscriptions"])
    .authorization((allow) => [
      allow.group('osteopaths'),
      allow.group('assistants').to(['read', 'create', 'update']),
    ]),

  // Appointment Model (pour la synchronisation externe)
  Appointment: a
    .model({
      id: a.id(),
      externalId: a.string(), // ID du système de RDV externe
      patientId: a.id(),
      patient: a.belongsTo('Patient', 'patientId'),
      date: a.datetime().required(),
      duration: a.integer().default(60),
      status: a.enum(['SCHEDULED', 'CONFIRMED', 'CANCELLED', 'COMPLETED']),
      notes: a.string(),
      source: a.string(), // 'doctolib', 'manual', etc.
      syncedAt: a.datetime(),
      createdAt: a.datetime(),
      updatedAt: a.datetime(),
    })
    .disableOperations(["subscriptions"])
    .authorization((allow) => [
      allow.group('osteopaths'),
      allow.group('assistants'),
    ]),

  // User Details Type
  UserDetailsType: a.customType({
    userId: a.string().required(),
    email: a.string().required(),
    givenName: a.string().required(),
    familyName: a.string().required(),
    phoneNumber: a.string(),
    enabled: a.boolean().required(),
    userStatus: a.string().required(),
    groups: a.string().array(),
    createdDate: a.string().required(),
    lastModifiedDate: a.string().required(),
  }),

  // User List Type
  UserListType: a.customType({
    users: a.ref('UserDetailsType').array(),
    nextToken: a.string(),
    totalCount: a.integer(),
  }),

  // User Mutation Response Type
  UserMutationResponseType: a.customType({
    success: a.boolean().required(),
    message: a.string().required(),
    userId: a.string(),
  }),

  // User Management Queries
  getUserDetails: a
    .query()
    .arguments({ userId: a.string().required() })
    .authorization((allow) => [
      allow.group('osteopaths'), 
      allow.group('assistants'), 
      allow.group('admins')
    ])
    .handler(a.handler.function(getUserDetails))
    .returns(a.ref('UserDetailsType')),

  listUsers: a
    .query()
    .arguments({ 
      limit: a.integer(), 
      nextToken: a.string() 
    })
    .authorization((allow) => [
      allow.group('osteopaths'),
      allow.group('assistants'),
      allow.group('admins')
    ])
    .handler(a.handler.function(listUsers))
    .returns(a.ref('UserListType')),

  // User Management Mutations (admin only)
  createUser: a
    .mutation()
    .arguments({
      email: a.string().required(),
      givenName: a.string().required(),
      familyName: a.string().required(),
      phoneNumber: a.string(),
      groups: a.string().array()
    })
    .authorization((allow) => [allow.group('admins')])
    .handler(a.handler.function(createUser))
    .returns(a.ref('UserMutationResponseType')),

  deleteUser: a
    .mutation()
    .arguments({ userId: a.string().required() })
    .authorization((allow) => [allow.group('admins')])
    .handler(a.handler.function(deleteUser))
    .returns(a.ref('UserMutationResponseType')),

  manageUserGroups: a
    .mutation()
    .arguments({
      action: a.enum(['add', 'remove']),
      userId: a.string().required(),
      groupName: a.string().required()
    })
    .authorization((allow) => [allow.group('admins')])
    .handler(a.handler.function(manageUserGroups))
    .returns(a.ref('UserMutationResponseType')),

  removeUserFromGroup: a
    .mutation()
    .arguments({
      userId: a.string().required(),
      groupName: a.string().required()
    })
    .authorization((allow) => [allow.group('admins')])
    .handler(a.handler.function(manageUserGroups))
    .returns(a.ref('UserMutationResponseType')),

  // Invoice PDF Management Mutations
  generateInvoicePDF: a
    .mutation()
    .arguments({ invoiceId: a.string().required() })
    .returns(a.json())
    .authorization((allow) => [allow.authenticated()])
    .handler(a.handler.function(generateInvoicePdf)),

  sendInvoiceEmail: a
    .mutation()
    .arguments({ 
      invoiceId: a.string().required(),
      recipientEmail: a.string().required() 
    })
    .returns(a.json())
    .authorization((allow) => [allow.authenticated()])
    .handler(a.handler.function(sendInvoiceEmail)),

  downloadInvoicePDF: a
    .mutation()
    .arguments({ invoiceId: a.string().required() })
    .returns(a.json())
    .authorization((allow) => [allow.authenticated()])
    .handler(a.handler.function(downloadInvoicePdf)),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'userPool',
//    apiKeyAuthorizationMode: {
//      expiresInDays: 30,
//    },
  },
});
