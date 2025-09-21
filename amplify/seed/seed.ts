import type { Schema } from "../data/resource";
import { readFile } from "node:fs/promises";
import {
  addToUserGroup,
  createAndSignUpUser,
  getSecret,
  signInUser,
} from "@aws-amplify/seed";
import { Amplify } from "aws-amplify";
import * as auth from "aws-amplify/auth";
import { generateClient } from "aws-amplify/api";

// this is used to get the amplify_outputs.json file as the file will not exist until sandbox is created
const url = new URL("../../amplify_outputs.json", import.meta.url);
const outputs = JSON.parse(await readFile(url, { encoding: 'utf8' }));

Amplify.configure(outputs);

const dataClient = generateClient<Schema>();

const username = "clem69.b@gmail.com";
const password = await getSecret("password");

try {
  const user = await createAndSignUpUser({
    username: username,
    password: password,
    userAttributes: {
      givenName: "Clément",
      familyName: "Bazin",
    },
    signInFlow: 'Password',
    signInAfterCreation: true
  });
  await addToUserGroup(user, "osteopaths");
  await addToUserGroup(user, "admins");
} catch (err) {
  const error = err as Error;
  if (error.name === 'UsernameExistsError') {
    await signInUser({
      username: username,
      password: password,
      signInFlow: 'Password'
    });
  } else {
    throw err;
  }
}


// Create some sample data for the Patient model
for (let i = 0; i < 10; i++) {
  const response = await dataClient.models.Patient.create(
    {
      // Required fields
      firstName: ['Alice', 'Bob', 'Charlie', 'David', 'Eve', 'Fiona', 'George', 'Hannah', 'Ian', 'Julia', 'Kevin', 'Laura', 'Michael', 'Nancy', 'Oliver'][Math.floor(Math.random() * 15)],
      lastName: ['Smith', 'Jones', 'Williams', 'Brown', 'Davis', 'Miller', 'Wilson', 'Moore', 'Taylor', 'Anderson', 'Thomas', 'Jackson', 'White', 'Harris', 'Martin'][Math.floor(Math.random() * 15)],
      
      // Optional fields
      email: `patient${Math.floor(Math.random() * 100000)}@example.com`,
      phone: `+33123456789`, // Random French phone number format
      dateOfBirth: new Date(
        // Random age between 18 and 80 years
        Date.now() - Math.floor(Math.random() * (80 - 18 + 1) + 18) * 365.25 * 24 * 60 * 60 * 1000 
      ).toISOString().split('T')[0], // Format YYYY-MM-DD
      address: `${Math.floor(Math.random() * 1500) + 1} ${['Main', 'Oak', 'Pine', 'Maple', 'Cedar', 'Elm', 'Washington', 'Lake', 'Hill'][Math.floor(Math.random() * 9)]} ${['St', 'Ave', 'Blvd', 'Rd', 'Ln'][Math.floor(Math.random() * 5)]}`,
      city: ['Springfield', 'Riverside', 'Fairview', 'Oakville', 'Madison', 'Georgetown', 'Arlington', 'Oxford', 'Centerville', 'Franklin'][Math.floor(Math.random() * 10)],
      postalCode: String(Math.floor(Math.random() * 90000) + 10000), // Random 5-digit postal code
      gender: ['M', 'F', 'OTHER'][Math.floor(Math.random() * 3)] as 'M' | 'F' | 'OTHER',
      profession: ['Engineer', 'Doctor', 'Teacher', 'Artist', 'Chef', 'Developer', 'Musician', 'Writer', 'Scientist', 'Accountant', 'Lawyer', 'Nurse'][Math.floor(Math.random() * 12)],
      referringPhysician: `Contact ${['Smith', 'Jones', 'Williams'][Math.floor(Math.random() * 3)]} +1-555-${String(Math.floor(Math.random() * 10000000)).padStart(7, '0')}`,
      medicalHistory: `Sample medical history: ${['None', 'Asthma', 'Hypertension', 'Diabetes Type 2'][Math.floor(Math.random() * 4)]}. Additional notes: ${Math.random().toString(36).substring(2, 10)}.`,
      surgicalHistory: `Surgical history: ${['Appendectomy', 'Gallbladder removal', 'Knee surgery', 'None'][Math.floor(Math.random() * 4)]}. Details: ${Math.random().toString(36).substring(2, 10)}.`,
      activities: `Physical activities: ${['Running', 'Swimming', 'Cycling', 'Yoga', 'None'][Math.floor(Math.random() * 5)]}. Frequency: ${Math.floor(Math.random() * 7) + 1} times a week.`,
      currentMedications: `Current medications: ${['None', 'Lisinopril', 'Metformin', 'Amoxicillin', 'Ibuprofen'][Math.floor(Math.random() * 5)]}. Dosage: ${Math.random().toString(36).substring(2, 8)}.`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  );
  if (response.errors && response.errors.length > 0) {
    throw response.errors;
  }
}

// Create sample consultation data
const patients = await dataClient.models.Patient.list();
if (patients.data && patients.data.length > 0) {
  for (let i = 0; i < 10; i++) {
    const randomPatient = patients.data[Math.floor(Math.random() * patients.data.length)];
    const consultationDate = new Date(Date.now() - Math.floor(Math.random() * 90) * 24 * 60 * 60 * 1000); // Random date within last 90 days
    
    if (!randomPatient.id) {
      continue; // Skip if patient id is null
    }
    
    const response = await dataClient.models.Consultation.create({
      patientId: randomPatient.id,
      date: consultationDate.toISOString(),
      duration: [30, 45, 60, 90][Math.floor(Math.random() * 4)],
      reason: [
        'Douleurs lombaires chroniques',
        'Migraine et tensions cervicales',
        'Douleurs articulaires',
        'Stress et tensions musculaires',
        'Suivi post-traumatique',
        'Douleurs thoraciques',
        'Troubles digestifs',
        'Consultation de routine'
      ][Math.floor(Math.random() * 8)],
      anamnesis: {
        skull: Math.random() > 0.5 ? `Céphalées fréquentes, tension dans la région occipitale. ${Math.random().toString(36).substring(2, 15)}.` : undefined,
        cervical: Math.random() > 0.5 ? `Tensions cervicales modérées, céphalées occasionnelles. ${Math.random().toString(36).substring(2, 15)}.` : undefined,
        digestive: Math.random() > 0.5 ? `Troubles digestifs légers, ballonnements. ${Math.random().toString(36).substring(2, 15)}.` : undefined,
        cardioThoracic: Math.random() > 0.5 ? `Respiration normale, légères tensions thoraciques. ${Math.random().toString(36).substring(2, 15)}.` : undefined,
        gynecological: Math.random() > 0.5 ? `RAS, cycle régulier. ${Math.random().toString(36).substring(2, 15)}.` : undefined,
        sleep: Math.random() > 0.5 ? `Sommeil fragmenté, réveil nocturne. ${Math.random().toString(36).substring(2, 15)}.` : undefined,
        psychological: Math.random() > 0.5 ? `Stress professionnel modéré, anxiété légère. ${Math.random().toString(36).substring(2, 15)}.` : undefined,
      },
      treatment: [
        'Techniques de mobilisation articulaire, étirements myofasciaux',
        'Manipulation vertébrale douce, travail sur les fascias',
        'Techniques crâniennes, rééquilibrage postural',
        'Drainage lymphatique, techniques viscérales',
        'Travail sur la respiration, relaxation musculaire'
      ][Math.floor(Math.random() * 5)],
      
      recommendations: [
        'Exercices de renforcement du core, étirements quotidiens',
        'Amélioration de la posture au travail, pauses régulières',
        'Techniques de gestion du stress, activité physique modérée',
        'Hydratation accrue, alimentation anti-inflammatoire',
        'Sommeil régulier, exercices de respiration'
      ][Math.floor(Math.random() * 5)],
      
      notes: `Notes additionnelles: ${Math.random().toString(36).substring(2, 20)}. Évolution favorable.`,
      createdAt: consultationDate.toISOString(),
      updatedAt: consultationDate.toISOString()
    });
    
    if (response.errors && response.errors.length > 0) {
      throw response.errors;
    }
  }
}

// Create sample invoice data
const consultations = await dataClient.models.Consultation.list();
if (consultations.data && consultations.data.length > 0) {
  for (const consultation of consultations.data) {
    // Create an invoice for each consultation
    if (!consultation.patientId || !consultation.id) {
      continue; // Skip if essential IDs are missing
    }

    const price = Math.floor(Math.random() * (100 - 50 + 1) + 50); // Random price between 50 and 100
    const isPaid = Math.random() > 0.5;
    const paymentMethod = ['CHEQUE', 'VIREMENT', 'ESPECES', 'CARTE_BANCAIRE'][Math.floor(Math.random() * 4)] as 'CHEQUE' | 'VIREMENT' | 'ESPECES' | 'CARTE_BANCAIRE';
    
    const response = await dataClient.models.Invoice.create({
      patientId: consultation.patientId,
      consultationId: consultation.id,
      invoiceNumber: `INV-${String(Date.now()).slice(-6)}-${Math.floor(Math.random() * 1000)}`,
      date: consultation.date.split('T')[0], // Format YYYY-MM-DD from ISO string
      price: price,
      total: price, // Total is the same as price
      isPaid: isPaid,
      status: isPaid ? 'PAID' : ['DRAFT', 'PENDING', 'OVERDUE'][Math.floor(Math.random() * 3)] as 'DRAFT' | 'PENDING' | 'OVERDUE',
      paymentMethod: paymentMethod,
      paymentReference: (paymentMethod === 'CHEQUE' || paymentMethod === 'VIREMENT') ? `Ref-${Math.random().toString(36).substring(2, 9)}` : undefined,
      paidAt: isPaid ? new Date().toISOString() : undefined,
      notes: `Sample invoice note: ${Math.random().toString(36).substring(2, 15)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    if (response.errors && response.errors.length > 0) {
      throw response.errors;
    }
  }
}

auth.signOut();
