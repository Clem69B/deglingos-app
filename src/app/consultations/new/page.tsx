'use client';

import { useState, useEffect } from 'react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../../../amplify/data/resource';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const client = generateClient<Schema>();

export default function NewConsultationPage() {
  const router = useRouter();
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    patientId: '',
    date: '',
    time: '',
    duration: 60,
    reason: '',
    symptoms: '',
    examination: '',
    diagnosis: '',
    treatment: '',
    recommendations: '',
    price: '',
    notes: ''
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
        selectionSet: ['id', 'firstName', 'lastName', 'email']
      });
      setPatients(response.data || []);
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

      const consultationData = {
        patientId: formData.patientId,
        date: consultationDateTime.toISOString(),
        duration: parseInt(formData.duration.toString()),
        reason: formData.reason,
        symptoms: formData.symptoms || undefined,
        examination: formData.examination || undefined,
        diagnosis: formData.diagnosis || undefined,
        treatment: formData.treatment || undefined,
        recommendations: formData.recommendations || undefined,
        price: formData.price ? parseFloat(formData.price) : undefined,
        notes: formData.notes || undefined,
        isPaid: false
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

                {/* Prix */}
                <div className="col-span-6 sm:col-span-3">
                  <label htmlFor="price" className="block text-sm font-medium text-gray-700">
                    Prix (€)
                  </label>
                  <input
                    type="number"
                    id="price"
                    name="price"
                    min="0"
                    step="0.01"
                    value={formData.price}
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

        {/* Détails médicaux */}
        <div className="bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6">
          <div className="md:grid md:grid-cols-3 md:gap-6">
            <div className="md:col-span-1">
              <h3 className="text-lg font-medium leading-6 text-gray-900">
                Détails médicaux
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Informations médicales détaillées
              </p>
            </div>
            <div className="mt-5 md:mt-0 md:col-span-2">
              <div className="grid grid-cols-1 gap-6">
                {/* Symptômes */}
                <div>
                  <label htmlFor="symptoms" className="block text-sm font-medium text-gray-700">
                    Symptômes
                  </label>
                  <textarea
                    id="symptoms"
                    name="symptoms"
                    rows={3}
                    value={formData.symptoms}
                    onChange={handleInputChange}
                    placeholder="Description des symptômes rapportés par le patient..."
                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 mt-1 block w-full sm:text-sm border border-gray-300 rounded-md"
                  />
                </div>

                {/* Examen */}
                <div>
                  <label htmlFor="examination" className="block text-sm font-medium text-gray-700">
                    Examen clinique
                  </label>
                  <textarea
                    id="examination"
                    name="examination"
                    rows={3}
                    value={formData.examination}
                    onChange={handleInputChange}
                    placeholder="Résultats de l'examen clinique..."
                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 mt-1 block w-full sm:text-sm border border-gray-300 rounded-md"
                  />
                </div>

                {/* Diagnostic */}
                <div>
                  <label htmlFor="diagnosis" className="block text-sm font-medium text-gray-700">
                    Diagnostic
                  </label>
                  <textarea
                    id="diagnosis"
                    name="diagnosis"
                    rows={2}
                    value={formData.diagnosis}
                    onChange={handleInputChange}
                    placeholder="Diagnostic posé..."
                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 mt-1 block w-full sm:text-sm border border-gray-300 rounded-md"
                  />
                </div>

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
