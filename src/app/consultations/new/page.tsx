'use client';

import { useState, useEffect } from 'react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../../../amplify/data/resource';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { CreateConsultationInput, PatientListItem } from '../../../types';

const client = generateClient<Schema>();

export default function NewConsultationPage() {
  const router = useRouter();
  const [patients, setPatients] = useState<PatientListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    patientId: '',
    date: '',
    time: '',
    duration: 60,
    reason: '',
    treatment: '',
    recommendations: '',
    notes: '',
    anamnesisSkullCervical: '',
    anamnesisDigestive: '',
    anamnesisCardioThoracic: '',
    anamnesisGynecological: '',
    anamnesisSleep: '',
    anamnesisPsychological: '',
    nextAppointmentDate: '',
    nextAppointmentTime: ''
  });

  useEffect(() => {
    fetchPatients();
    // Définir la date et l'heure par défaut à maintenant
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const currentTime = now.toTimeString().slice(0, 5);
    setFormData(prev => ({
      ...prev,
      date: today,
      time: currentTime
    }));
  }, []);

  const fetchPatients = async () => {
    try {
      const response = await client.models.Patient.list({
        selectionSet: ['id', 'firstName', 'lastName', 'email', 'createdAt']
      });
      
      // Filtrer et transformer les données pour correspondre au type PatientListItem
      const validPatients = (response.data || [])
        .filter(patient => patient.id) // Filtrer les patients avec un id valide
        .map(patient => ({
          id: patient.id!,
          firstName: patient.firstName || null,
          lastName: patient.lastName || null,
          email: patient.email || null,
          phone: null, // Non récupéré dans cette requête
          dateOfBirth: null, // Non récupéré dans cette requête
          createdAt: patient.createdAt!
        }));
      
      setPatients(validPatients);
    } catch (error) {
      console.error('Erreur lors du chargement des patients:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.patientId || !formData.date || !formData.time || !formData.reason) {
      alert('Veuillez remplir les champs obligatoires');
      return;
    }

    setLoading(true);

    try {
      // Combiner date et heure
      const consultationDateTime = new Date(`${formData.date}T${formData.time}`);
      let nextAppointmentDateTime: string | undefined = undefined;
      if (formData.nextAppointmentDate && formData.nextAppointmentTime) {
        nextAppointmentDateTime = new Date(`${formData.nextAppointmentDate}T${formData.nextAppointmentTime}`).toISOString();
      }

      const consultationData: CreateConsultationInput = {
        patientId: formData.patientId,
        date: consultationDateTime.toISOString(),
        duration: parseInt(formData.duration.toString()),
        reason: formData.reason,
        treatment: formData.treatment || undefined,
        recommendations: formData.recommendations || undefined,
        notes: formData.notes || undefined,
        anamnesisSkullCervical: formData.anamnesisSkullCervical || undefined,
        anamnesisDigestive: formData.anamnesisDigestive || undefined,
        anamnesisCardioThoracic: formData.anamnesisCardioThoracic || undefined,
        anamnesisGynecological: formData.anamnesisGynecological || undefined,
        anamnesisSleep: formData.anamnesisSleep || undefined,
        anamnesisPsychological: formData.anamnesisPsychological || undefined,
        nextAppointment: nextAppointmentDateTime
      };

      await client.models.Consultation.create(consultationData);
      
      router.push('/consultations');
    } catch (error) {
      console.error('Erreur lors de la création de la consultation:', error);
      alert('Erreur lors de la création de la consultation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="md:flex md:items-center md:justify-between">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            Nouvelle consultation
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Enregistrez une nouvelle consultation patient
          </p>
        </div>
        <div className="mt-4 flex md:mt-0 md:ml-4">
          <Link
            href="/consultations"
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Retour
          </Link>
        </div>
      </div>

      {/* Formulaire */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Informations générales */}
        <div className="bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6">
          <div className="md:grid md:grid-cols-3 md:gap-6">
            <div className="md:col-span-1">
              <h3 className="text-lg font-medium leading-6 text-gray-900">
                Informations générales
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Informations de base sur la consultation
              </p>
            </div>
            <div className="mt-5 md:mt-0 md:col-span-2">
              <div className="grid grid-cols-6 gap-6">
                {/* Patient */}
                <div className="col-span-6">
                  <label htmlFor="patientId" className="block text-sm font-medium text-gray-700">
                    Patient *
                  </label>
                  <select
                    id="patientId"
                    name="patientId"
                    required
                    value={formData.patientId}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  >
                    <option value="">Sélectionner un patient</option>
                    {patients.map((patient) => (
                      <option key={patient.id} value={patient.id}>
                        {patient.firstName} {patient.lastName} - {patient.email}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Date */}
                <div className="col-span-6 sm:col-span-3">
                  <label htmlFor="date" className="block text-sm font-medium text-gray-700">
                    Date *
                  </label>
                  <input
                    type="date"
                    id="date"
                    name="date"
                    required
                    value={formData.date}
                    onChange={handleInputChange}
                    className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                  />
                </div>

                {/* Heure */}
                <div className="col-span-6 sm:col-span-3">
                  <label htmlFor="time" className="block text-sm font-medium text-gray-700">
                    Heure *
                  </label>
                  <input
                    type="time"
                    id="time"
                    name="time"
                    required
                    value={formData.time}
                    onChange={handleInputChange}
                    className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                  />
                </div>

                {/* Durée */}
                <div className="col-span-6 sm:col-span-3">
                  <label htmlFor="duration" className="block text-sm font-medium text-gray-700">
                    Durée (minutes)
                  </label>
                  <input
                    type="number"
                    id="duration"
                    name="duration"
                    min="15"
                    max="180"
                    value={formData.duration}
                    onChange={handleInputChange}
                    className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                  />
                </div>

                {/* Motif */}
                <div className="col-span-6">
                  <label htmlFor="reason" className="block text-sm font-medium text-gray-700">
                    Motif de consultation *
                  </label>
                  <input
                    type="text"
                    id="reason"
                    name="reason"
                    required
                    value={formData.reason}
                    onChange={handleInputChange}
                    placeholder="Ex: Douleur cervicale, Mal de dos..."
                    className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Anamnèse */}
        <div className="bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6">
          <div className="md:grid md:grid-cols-3 md:gap-6">
            <div className="md:col-span-1">
              <h3 className="text-lg font-medium leading-6 text-gray-900">
                Anamnèse
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Analyse des différents systèmes corporels
              </p>
            </div>
            <div className="mt-5 md:mt-0 md:col-span-2">
              <div className="grid grid-cols-1 gap-6">
                {/* Anamnèse - Crâne, Cervicale */}
                <div>
                  <label htmlFor="anamnesisSkullCervical" className="block text-sm font-medium text-gray-700">
                    Crâne & Cervicale
                  </label>
                  <textarea
                    id="anamnesisSkullCervical"
                    name="anamnesisSkullCervical"
                    rows={3}
                    value={formData.anamnesisSkullCervical}
                    onChange={handleInputChange}
                    placeholder="Détails sur crâne, cervicale..."
                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 mt-1 block w-full sm:text-sm border border-gray-300 rounded-md"
                  />
                </div>

                {/* Anamnèse - Système digestif */}
                <div>
                  <label htmlFor="anamnesisDigestive" className="block text-sm font-medium text-gray-700">
                    Système digestif
                  </label>
                  <textarea
                    id="anamnesisDigestive"
                    name="anamnesisDigestive"
                    rows={3}
                    value={formData.anamnesisDigestive}
                    onChange={handleInputChange}
                    placeholder="Détails sur le système digestif..."
                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 mt-1 block w-full sm:text-sm border border-gray-300 rounded-md"
                  />
                </div>

                {/* Anamnèse - Cardique / pulmonaire / thoracique */}
                <div>
                  <label htmlFor="anamnesisCardioThoracic" className="block text-sm font-medium text-gray-700">
                    Cardio-thoracique
                  </label>
                  <textarea
                    id="anamnesisCardioThoracic"
                    name="anamnesisCardioThoracic"
                    rows={3}
                    value={formData.anamnesisCardioThoracic}
                    onChange={handleInputChange}
                    placeholder="Détails sur le système cardio-thoracique..."
                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 mt-1 block w-full sm:text-sm border border-gray-300 rounded-md"
                  />
                </div>

                {/* Anamnèse - Gynécologique */}
                <div>
                  <label htmlFor="anamnesisGynecological" className="block text-sm font-medium text-gray-700">
                    Gynécologique
                  </label>
                  <textarea
                    id="anamnesisGynecological"
                    name="anamnesisGynecological"
                    rows={3}
                    value={formData.anamnesisGynecological}
                    onChange={handleInputChange}
                    placeholder="Détails sur le système gynécologique..."
                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 mt-1 block w-full sm:text-sm border border-gray-300 rounded-md"
                  />
                </div>

                {/* Anamnèse - Sommeil */}
                <div>
                  <label htmlFor="anamnesisSleep" className="block text-sm font-medium text-gray-700">
                    Sommeil
                  </label>
                  <textarea
                    id="anamnesisSleep"
                    name="anamnesisSleep"
                    rows={3}
                    value={formData.anamnesisSleep}
                    onChange={handleInputChange}
                    placeholder="Détails sur le sommeil..."
                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 mt-1 block w-full sm:text-sm border border-gray-300 rounded-md"
                  />
                </div>

                {/* Anamnèse - Psychologique / Emotionnel */}
                <div>
                  <label htmlFor="anamnesisPsychological" className="block text-sm font-medium text-gray-700">
                    Psychologique & Émotionnel
                  </label>
                  <textarea
                    id="anamnesisPsychological"
                    name="anamnesisPsychological"
                    rows={3}
                    value={formData.anamnesisPsychological}
                    onChange={handleInputChange}
                    placeholder="Détails sur l'état psychologique/émotionnel..."
                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 mt-1 block w-full sm:text-sm border border-gray-300 rounded-md"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Traitement et suivi */}
        <div className="bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6">
          <div className="md:grid md:grid-cols-3 md:gap-6">
            <div className="md:col-span-1">
              <h3 className="text-lg font-medium leading-6 text-gray-900">
                Traitement et suivi
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Actions réalisées et recommandations
              </p>
            </div>
            <div className="mt-5 md:mt-0 md:col-span-2">
              <div className="grid grid-cols-1 gap-6">
                {/* Traitement */}
                <div>
                  <label htmlFor="treatment" className="block text-sm font-medium text-gray-700">
                    Traitement
                  </label>
                  <textarea
                    id="treatment"
                    name="treatment"
                    rows={3}
                    value={formData.treatment}
                    onChange={handleInputChange}
                    placeholder="Traitement appliqué pendant la consultation..."
                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 mt-1 block w-full sm:text-sm border border-gray-300 rounded-md"
                  />
                </div>

                {/* Recommandations */}
                <div>
                  <label htmlFor="recommendations" className="block text-sm font-medium text-gray-700">
                    Recommandations
                  </label>
                  <textarea
                    id="recommendations"
                    name="recommendations"
                    rows={3}
                    value={formData.recommendations}
                    onChange={handleInputChange}
                    placeholder="Exercices, conseils, recommandations pour le patient..."
                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 mt-1 block w-full sm:text-sm border border-gray-300 rounded-md"
                  />
                </div>

                {/* Prochain RDV */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="nextAppointmentDate" className="block text-sm font-medium text-gray-700">
                      Prochain RDV - Date
                    </label>
                    <input
                      type="date"
                      id="nextAppointmentDate"
                      name="nextAppointmentDate"
                      value={formData.nextAppointmentDate}
                      onChange={handleInputChange}
                      className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                    />
                  </div>

                  <div>
                    <label htmlFor="nextAppointmentTime" className="block text-sm font-medium text-gray-700">
                      Prochain RDV - Heure
                    </label>
                    <input
                      type="time"
                      id="nextAppointmentTime"
                      name="nextAppointmentTime"
                      value={formData.nextAppointmentTime}
                      onChange={handleInputChange}
                      className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                    />
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                    Notes privées
                  </label>
                  <textarea
                    id="notes"
                    name="notes"
                    rows={2}
                    value={formData.notes}
                    onChange={handleInputChange}
                    placeholder="Notes personnelles, observations..."
                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 mt-1 block w-full sm:text-sm border border-gray-300 rounded-md"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Boutons d'action */}
        <div className="flex justify-end space-x-3">
          <Link
            href="/consultations"
            className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Annuler
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="bg-indigo-600 border border-transparent rounded-md shadow-sm py-2 px-4 inline-flex justify-center text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {loading ? 'Enregistrement...' : 'Enregistrer la consultation'}
          </button>
        </div>
      </form>
    </div>
  );
}
