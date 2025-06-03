# Organisation des Types

Ce dossier contient une organisation refactorisée et centralisée des types TypeScript utilisés dans l'application.

## Structure

### `index.ts`
Point d'entrée principal qui re-exporte tous les types. Importe les types de base depuis le schéma Amplify.

### `common.ts`
Types communs utilisés à travers l'application :
- Types d'énumération (`Gender`, `InvoiceStatus`)
- Interfaces de base (`BaseEntity`, `PersonBaseData`)
- Types utilitaires (`FormErrors`)

### `patient.ts`
Types liés aux patients :
- `PatientBaseData` : Interface de base avec tous les champs patient
- `CreatePatientInput` : Pour créer un nouveau patient
- `UpdatePatientInput` : Pour mettre à jour un patient existant
- `PatientDetail` : Pour l'affichage détaillé d'un patient
- `PatientListItem` : Pour l'affichage en liste
- `PatientFormData` : Pour les formulaires (tous les champs requis)
- `PatientSummary` : Version minimale pour l'affichage dans d'autres entités

### `consultation.ts`
Types liés aux consultations :
- `AnamnesisData` : Interface pour les données d'anamnèse
- `ConsultationBaseData` : Interface de base pour les consultations
- `CreateConsultationInput` : Pour créer une nouvelle consultation
- `UpdateConsultationInput` : Pour mettre à jour une consultation
- `ConsultationListItem` : Pour l'affichage en liste
- `ConsultationWithPatient` : Pour l'affichage avec patient inclus
- `ConsultationSummary` : Version simplifiée pour les résumés

### `invoice.ts`
Types liés aux factures :
- `InvoiceBaseData` : Interface de base pour les factures
- `CreateInvoiceInput` : Pour créer une nouvelle facture
- `UpdateInvoiceInput` : Pour mettre à jour une facture
- `InvoiceSummary` : Pour l'affichage en résumé

## Avantages de cette organisation

1. **Centralisation** : Tous les types sont dans un seul endroit
2. **Réutilisabilité** : Interfaces de base partagées entre différents types
3. **Maintenabilité** : Plus facile de modifier un type à un seul endroit
4. **Cohérence** : Nomenclature et structure cohérentes
5. **Extensibilité** : Facile d'ajouter de nouveaux types

## Usage

```typescript
// Import depuis le point d'entrée principal
import { Patient, CreatePatientInput, PatientListItem } from '../types';

// Ou import spécifique si nécessaire
import { PatientFormData } from '../types/patient';
```
