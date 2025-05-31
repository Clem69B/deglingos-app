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
      emergencyContact: a.string(),
      medicalHistory: a.string(),
      allergies: a.string(),
      currentMedications: a.string(),
      consultations: a.hasMany('Consultation', 'patientId'),
      invoices: a.hasMany('Invoice', 'patientId'),
      createdAt: a.datetime(),
      updatedAt: a.datetime(),
    })
    .authorization((allow) => [
      allow.group('osteopaths'),
      allow.group('assistants').to(['read']),
    ]),

  // Consultation Model
  Consultation: a
    .model({
      id: a.id(),
      patientId: a.id().required(),
      patient: a.belongsTo('Patient', 'patientId'),
      date: a.datetime().required(),
      duration: a.integer().default(60), // minutes
      reason: a.string().required(),
      symptoms: a.string(),
      examination: a.string(),
      diagnosis: a.string(),
      treatment: a.string(),
      recommendations: a.string(),
      nextAppointment: a.datetime(),
      price: a.float(),
      isPaid: a.boolean().default(false),
      notes: a.string(),
      createdAt: a.datetime(),
      updatedAt: a.datetime(),
    })
    .authorization((allow) => [
      allow.group('osteopaths'),
      allow.group('assistants').to(['read', 'create', 'update']),
    ]),

  // Invoice Model
  Invoice: a
    .model({
      id: a.id(),
      invoiceNumber: a.string().required(),
      patientId: a.id().required(),
      patient: a.belongsTo('Patient', 'patientId'),
      consultationIds: a.string().array(), // JSON array of consultation IDs
      date: a.date().required(),
      dueDate: a.date(),
      items: a.string().required(), // JSON string of invoice items
      subtotal: a.float().required(),
      tax: a.float().default(0),
      total: a.float().required(),
      status: a.enum(['DRAFT', 'SENT', 'PAID', 'OVERDUE']).default('DRAFT'),
      paidAt: a.datetime(),
      notes: a.string(),
      createdAt: a.datetime(),
      updatedAt: a.datetime(),
    })
    .authorization((allow) => [
      allow.group('osteopaths'),
      allow.group('assistants').to(['read', 'create']),
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
    apiKeyAuthorizationMode: {
      expiresInDays: 30,
    },
  },
});