# Send Invoice Email Function

Cette fonction Lambda Amplify gère l'envoi d'emails pour les factures via AWS SES.

## Fonctionnalités

- Récupération des données de facture et patient depuis DynamoDB
- Génération d'email HTML et texte avec templates intégrés
- Envoi via AWS SES avec gestion d'erreurs complète
- Validation des données avant envoi

## Variables d'environnement

- `AMPLIFY_DATA_INVOICE_TABLE_NAME` : Nom de la table DynamoDB des factures
- `AMPLIFY_DATA_PATIENT_TABLE_NAME` : Nom de la table DynamoDB des patients  
- `SENDER_EMAIL` : Adresse email expéditrice (doit être vérifiée dans SES)
- `AWS_REGION` : Région AWS

## Permissions requises

- Lecture sur les tables Invoice et Patient
- SES: SendEmail et SendRawEmail

## Format de réponse

```typescript
{
  success: boolean;
  message: string;
  messageId?: string; // ID du message SES si succès
  error?: string;     // Message d'erreur si échec
}
```

## Gestion d'erreurs

- Facture non trouvée
- Patient non trouvé
- Patient sans email
- Erreurs SES (configuration, quotas, etc.)