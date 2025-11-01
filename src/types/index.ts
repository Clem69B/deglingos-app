// Types de base exportés depuis Amplify Schema
import type { Schema } from '../../amplify/data/resource';

export type Patient = Schema['Patient']['type'];
export type Consultation = Schema['Consultation']['type'];
export type Invoice = Schema['Invoice']['type'];
export type Appointment = Schema['Appointment']['type'];
export type UserProfile = Schema['UserProfile']['type'];

// Ré-exports des types spécialisés
export * from './patient';
export * from './consultation';
export * from './invoice';
export * from './common';
export * from './user-profile';
