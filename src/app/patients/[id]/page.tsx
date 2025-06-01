'use client';

import { useState, useEffect } from 'react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../../../amplify/data/resource';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';

const client = generateClient<Schema>();

type Patient = Schema["Patient"]["type"];
type Consultation = Schema["Consultation"]["type"];
type Invoice = Schema["Invoice"]["type"];

interface PatientFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  address: string;
  city: string;
  postalCode: string;
  gender: 'M' | 'F' | 'OTHER' | '';
  emergencyContact: string;
  medicalHistory: string;
  allergies: string;
  currentMedications: string;
}

export default function PatientDetailPage() {
  const router = useRouter();
  const params = useParams();
  const patientId = params.id as string;

  const [patient, setPatient] = useState<Patient | null>(null);
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [unpaidInvoices, setUnpaidInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState<PatientFormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    address: '',
    city: '',
    postalCode: '',
    gender: '',
    emergencyContact: '',
    medicalHistory: '',
    allergies: '',
    currentMedications: '',
  });

  // Load patient data and related information
  useEffect(() => {
    const loadPatientData = async () => {
      try {
        setLoading(true);

        // Load patient
        const patientResponse = await client.models.Patient.get({ id: patientId });
        if (!patientResponse.data) {
          router.push('/patients');
          return;
        }

        const patientData = patientResponse.data;
        setPatient(patientData);

        // Initialize form data
        setFormData({
          firstName: patientData.firstName || '',
          lastName: patientData.lastName || '',
          email: patientData.email || '',
          phone: patientData.phone || '',
          dateOfBirth: patientData.dateOfBirth || '',
          address: patientData.address || '',
          city: patientData.city || '',
          postalCode: patientData.postalCode || '',
          gender: patientData.gender || '',
          emergencyContact: patientData.emergencyContact || '',
          medicalHistory: patientData.medicalHistory || '',
          allergies: patientData.allergies || '',
          currentMedications: patientData.currentMedications || '',
        });

        // Load consultations
        const consultationsResponse = await client.models.Consultation.list({
          filter: { patientId: { eq: patientId } },
        });
        if (consultationsResponse.data) {
          const sortedConsultations = consultationsResponse.data.sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
          );
          setConsultations(sortedConsultations);
        }

        // Load unpaid invoices
        const invoicesResponse = await client.models.Invoice.list({
          filter: { 
            patientId: { eq: patientId },
            status: { ne: 'PAID' }
          },
        });
        if (invoicesResponse.data) {
          setUnpaidInvoices(invoicesResponse.data);
        }

      } catch (error) {
        console.error('Error loading patient data:', error);
        router.push('/patients');
      } finally {
        setLoading(false);
      }
    };

    if (patientId) {
      loadPatientData();
    }
  }, [patientId, router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'Le prénom est obligatoire';
    }
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Le nom est obligatoire';
    }
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Veuillez saisir une adresse email valide';
    }
    if (formData.phone && !/^[\d\s\-\+\(\)]+$/.test(formData.phone)) {
      newErrors.phone = 'Veuillez saisir un numéro de téléphone valide';
    }
    if (formData.dateOfBirth && new Date(formData.dateOfBirth) > new Date()) {
      newErrors.dateOfBirth = 'La date de naissance ne peut pas être dans le futur';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    setSaving(true);
    try {
      const updateData: Partial<Schema['Patient']['type']> = {
        id: patientId,
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
      };

      // Only include optional fields if they have values
      if (formData.email.trim()) updateData.email = formData.email.trim();
      if (formData.phone.trim()) updateData.phone = formData.phone.trim();
      if (formData.dateOfBirth) updateData.dateOfBirth = formData.dateOfBirth;
      if (formData.address.trim()) updateData.address = formData.address.trim();
      if (formData.city.trim()) updateData.city = formData.city.trim();
      if (formData.postalCode.trim()) updateData.postalCode = formData.postalCode.trim();
      if (formData.gender) updateData.gender = formData.gender;
      if (formData.emergencyContact.trim()) updateData.emergencyContact = formData.emergencyContact.trim();
      if (formData.medicalHistory.trim()) updateData.medicalHistory = formData.medicalHistory.trim();
      if (formData.allergies.trim()) updateData.allergies = formData.allergies.trim();
      if (formData.currentMedications.trim()) updateData.currentMedications = formData.currentMedications.trim();

      const response = await client.models.Patient.update(updateData);
      
      if (response.data) {
        setPatient(response.data);
        setIsEditing(false);
        setErrors({});
      } else {
        console.error('Error updating patient:', response.errors);
        setErrors({ general: 'Une erreur est survenue lors de la mise à jour du patient' });
      }
    } catch (error) {
      console.error('Error updating patient:', error);
      setErrors({ general: 'Une erreur est survenue lors de la mise à jour du patient' });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (patient) {
      setFormData({
        firstName: patient.firstName || '',
        lastName: patient.lastName || '',
        email: patient.email || '',
        phone: patient.phone || '',
        dateOfBirth: patient.dateOfBirth || '',
        address: patient.address || '',
        city: patient.city || '',
        postalCode: patient.postalCode || '',
        gender: patient.gender || '',
        emergencyContact: patient.emergencyContact || '',
        medicalHistory: patient.medicalHistory || '',
        allergies: patient.allergies || '',
        currentMedications: patient.currentMedications || '',
      });
    }
    setIsEditing(false);
    setErrors({});
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const calculateAge = (birthDate: string) => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  };

  const getPatientInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900">Patient non trouvé</h3>
        <p className="mt-1 text-sm text-gray-500">
          Le patient que vous recherchez n&apos;existe pas ou a été supprimé.
        </p>
        <div className="mt-6">
          <Link
            href="/patients"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
          >
            Retour à la liste des patients
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="md:flex md:items-center md:justify-between">
        <div className="flex-1 min-w-0 flex items-center space-x-4">
          <div className="w-16 h-16 bg-indigo-600 rounded-full flex items-center justify-center text-white text-xl font-medium">
            {getPatientInitials(patient.firstName, patient.lastName)}
          </div>
          <div>
            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
              {patient.firstName} {patient.lastName}
            </h2>
            <div className="mt-1 flex flex-col sm:flex-row sm:flex-wrap sm:space-x-6">
              {patient.dateOfBirth && (
                <p className="text-sm text-gray-500">
                  {calculateAge(patient.dateOfBirth)} ans
                </p>
              )}
              {patient.email && (
                <p className="text-sm text-gray-500">{patient.email}</p>
              )}
              {patient.phone && (
                <p className="text-sm text-gray-500">{patient.phone}</p>
              )}
            </div>
          </div>
        </div>
        <div className="mt-4 flex space-x-3 md:mt-0 md:ml-4">
          {/* Unpaid invoices indicator */}
          {unpaidInvoices.length > 0 && (
            <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {unpaidInvoices.length} facture{unpaidInvoices.length > 1 ? 's' : ''} impayée{unpaidInvoices.length > 1 ? 's' : ''}
            </div>
          )}
          
          <Link
            href="/patients"
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            Retour
          </Link>
          
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
            >
              Modifier
            </button>
          ) : (
            <div className="flex space-x-2">
              <button
                onClick={handleCancel}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
              >
                {saving ? 'Enregistrement...' : 'Enregistrer'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Error Message */}
      {errors.general && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="text-sm text-red-600">{errors.general}</div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Patient Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Personal Information */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Informations personnelles</h3>
            
            {isEditing ? (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                    Prénom *
                  </label>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${
                      errors.firstName ? 'border-red-300' : ''
                    }`}
                  />
                  {errors.firstName && (
                    <p className="mt-2 text-sm text-red-600">{errors.firstName}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                    Nom *
                  </label>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${
                      errors.lastName ? 'border-red-300' : ''
                    }`}
                  />
                  {errors.lastName && (
                    <p className="mt-2 text-sm text-red-600">{errors.lastName}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    E-mail
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${
                      errors.email ? 'border-red-300' : ''
                    }`}
                  />
                  {errors.email && (
                    <p className="mt-2 text-sm text-red-600">{errors.email}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                    Téléphone
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${
                      errors.phone ? 'border-red-300' : ''
                    }`}
                  />
                  {errors.phone && (
                    <p className="mt-2 text-sm text-red-600">{errors.phone}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700">
                    Date de naissance
                  </label>
                  <input
                    type="date"
                    id="dateOfBirth"
                    name="dateOfBirth"
                    value={formData.dateOfBirth}
                    onChange={handleInputChange}
                    className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${
                      errors.dateOfBirth ? 'border-red-300' : ''
                    }`}
                  />
                  {errors.dateOfBirth && (
                    <p className="mt-2 text-sm text-red-600">{errors.dateOfBirth}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="gender" className="block text-sm font-medium text-gray-700">
                    Genre
                  </label>
                  <select
                    id="gender"
                    name="gender"
                    value={formData.gender}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  >
                    <option value="">Sélectionner le genre</option>
                    <option value="M">Homme</option>
                    <option value="F">Femme</option>
                    <option value="OTHER">Autre</option>
                  </select>
                </div>
              </div>
            ) : (
              <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Date de naissance</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {patient.dateOfBirth ? formatDate(patient.dateOfBirth) : 'Non renseignée'}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Genre</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {patient.gender === 'M' ? 'Homme' : patient.gender === 'F' ? 'Femme' : patient.gender === 'OTHER' ? 'Autre' : 'Non renseigné'}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">E-mail</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {patient.email || 'Non renseigné'}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Téléphone</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {patient.phone || 'Non renseigné'}
                  </dd>
                </div>
              </dl>
            )}
          </div>

          {/* Address Information */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Adresse</h3>
            
            {isEditing ? (
              <div className="space-y-4">
                <div>
                  <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                    Adresse
                  </label>
                  <input
                    type="text"
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="city" className="block text-sm font-medium text-gray-700">
                      Ville
                    </label>
                    <input
                      type="text"
                      id="city"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>
                  <div>
                    <label htmlFor="postalCode" className="block text-sm font-medium text-gray-700">
                      Code postal
                    </label>
                    <input
                      type="text"
                      id="postalCode"
                      name="postalCode"
                      value={formData.postalCode}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div>
                {patient.address || patient.city || patient.postalCode ? (
                  <div className="text-sm text-gray-900">
                    {patient.address && <div>{patient.address}</div>}
                    {(patient.city || patient.postalCode) && (
                      <div>
                        {patient.postalCode} {patient.city}
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">Aucune adresse renseignée</p>
                )}
              </div>
            )}
          </div>

          {/* Medical Information */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Informations médicales</h3>
            
            {isEditing ? (
              <div className="space-y-6">
                <div>
                  <label htmlFor="emergencyContact" className="block text-sm font-medium text-gray-700">
                    Contact d&apos;urgence
                  </label>
                  <input
                    type="text"
                    id="emergencyContact"
                    name="emergencyContact"
                    value={formData.emergencyContact}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="Nom et numéro de téléphone"
                  />
                </div>

                <div>
                  <label htmlFor="medicalHistory" className="block text-sm font-medium text-gray-700">
                    Antécédents médicaux
                  </label>
                  <textarea
                    id="medicalHistory"
                    name="medicalHistory"
                    rows={3}
                    value={formData.medicalHistory}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="Maladies, opérations, etc."
                  />
                </div>

                <div>
                  <label htmlFor="allergies" className="block text-sm font-medium text-gray-700">
                    Allergies
                  </label>
                  <textarea
                    id="allergies"
                    name="allergies"
                    rows={2}
                    value={formData.allergies}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="Allergies connues"
                  />
                </div>

                <div>
                  <label htmlFor="currentMedications" className="block text-sm font-medium text-gray-700">
                    Médicaments en cours
                  </label>
                  <textarea
                    id="currentMedications"
                    name="currentMedications"
                    rows={2}
                    value={formData.currentMedications}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="Médicaments et dosages actuels"
                  />
                </div>
              </div>
            ) : (
              <dl className="space-y-6">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Contact d&apos;urgence</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {patient.emergencyContact || 'Non renseigné'}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Antécédents médicaux</dt>
                  <dd className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">
                    {patient.medicalHistory || 'Aucun antécédent renseigné'}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Allergies</dt>
                  <dd className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">
                    {patient.allergies || 'Aucune allergie connue'}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Médicaments en cours</dt>
                  <dd className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">
                    {patient.currentMedications || 'Aucun médicament en cours'}
                  </dd>
                </div>
              </dl>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Actions rapides</h3>
            <div className="space-y-3">
              <button className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700">
                Nouvelle consultation
              </button>
              <button className="w-full inline-flex justify-center items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                Planifier RDV
              </button>
              <button className="w-full inline-flex justify-center items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                Créer facture
              </button>
            </div>
          </div>

          {/* Unpaid Invoices */}
          {unpaidInvoices.length > 0 && (
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Factures impayées</h3>
              <div className="space-y-3">
                {unpaidInvoices.slice(0, 3).map((invoice) => (
                  <div key={invoice.id} className="border border-red-200 rounded-lg p-3 bg-red-50">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-medium text-red-900">
                          Facture #{invoice.invoiceNumber}
                        </p>
                        <p className="text-xs text-red-700">
                          {formatDate(invoice.date)}
                        </p>
                      </div>
                      <span className="text-sm font-medium text-red-900">
                        {invoice.total}€
                      </span>
                    </div>
                    <div className="mt-2">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        invoice.status === 'OVERDUE' 
                          ? 'bg-red-100 text-red-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {invoice.status === 'OVERDUE' ? 'En retard' : 
                         invoice.status === 'SENT' ? 'Envoyée' : 
                         'Brouillon'}
                      </span>
                    </div>
                  </div>
                ))}
                {unpaidInvoices.length > 3 && (
                  <p className="text-sm text-gray-500 text-center">
                    Et {unpaidInvoices.length - 3} autres...
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Recent Consultations Summary */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Dernières consultations</h3>
            {consultations.length > 0 ? (
              <div className="space-y-3">
                {consultations.slice(0, 3).map((consultation) => (
                  <div key={consultation.id} className="border-l-4 border-indigo-400 pl-3">
                    <p className="text-sm font-medium text-gray-900">
                      {consultation.reason}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatDateTime(consultation.date)}
                    </p>
                    {consultation.price && (
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mt-1 ${
                        consultation.isPaid 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {consultation.price}€ - {consultation.isPaid ? 'Payée' : 'Non payée'}
                      </span>
                    )}
                  </div>
                ))}
                {consultations.length > 3 && (
                  <p className="text-sm text-gray-500 text-center">
                    Et {consultations.length - 3} autres consultations...
                  </p>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-500">Aucune consultation enregistrée</p>
            )}
          </div>
        </div>
      </div>

      {/* Full Consultations List */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Historique des consultations</h3>
        </div>
        <div className="overflow-hidden">
          {consultations.length > 0 ? (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Motif
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Durée
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Prix
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="relative px-6 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {consultations.map((consultation) => (
                  <tr key={consultation.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDateTime(consultation.date)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div className="max-w-xs truncate" title={consultation.reason}>
                        {consultation.reason}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {consultation.duration}min
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {consultation.price ? `${consultation.price}€` : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {consultation.price && (
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          consultation.isPaid 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {consultation.isPaid ? 'Payée' : 'Non payée'}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button className="text-indigo-600 hover:text-indigo-900">
                        Voir détails
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">Aucune consultation</h3>
              <p className="mt-1 text-sm text-gray-500">
                Ce patient n&apos;a pas encore de consultation enregistrée.
              </p>
              <div className="mt-6">
                <button className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700">
                  Créer la première consultation
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
