import { type ClientSchema, a, defineData } from '@aws-amplify/backend';

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
      allow.group('osteopaths')
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
      tax: a.float().default(0),
      total: a.float().required(),
      isPaid: a.boolean().default(false),
      status: a.enum(['DRAFT', 'SENT', 'PAID', 'OVERDUE']),
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