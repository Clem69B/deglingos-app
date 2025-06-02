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
      emergencyContact: a.string(),
      medicalHistory: a.string(),
      allergies: a.string(),
      currentMedications: a.string(),
      consultations: a.hasMany('Consultation', 'patientId'),
      Appointment: a.hasMany('Appointment', 'patientId'),
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
      // Anamnèse structurée par systèmes
      anamnesisSkullCervical: a.string(), // Crâne, Cervicale
      anamnesisDigestive: a.string(), // Système digestif
      anamnesisCardioThoracic: a.string(), // Cardique / pulmonaire / thoracique
      anamnesisGynecological: a.string(), // Gynécologique
      amnamnesisSleep: a.string(), // Sommeil
      amnamnesisPsychological: a.string(), // Psychologique / Emotionnel
      treatment: a.string(),
      recommendations: a.string(),
      nextAppointment: a.datetime(),
      invoice: a.hasOne('Invoice', 'consultationId'),
      notes: a.string(),
      createdAt: a.datetime(),
      updatedAt: a.datetime(),
    })
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