# Configuration d'envoi d'emails pour les factures

## Prérequis AWS SES

Avant d'utiliser l'envoi d'emails, vous devez configurer AWS SES :

### 1. Vérifier une adresse email expéditrice

```bash
# Se connecter à la console AWS
# Aller dans AWS SES (Simple Email Service)
# Vérifier l'adresse email qui sera utilisée comme expéditrice
```

### 2. Configurer les variables d'environnement

Dans le fichier d'environnement Amplify, vous pouvez configurer :

```bash
# Variables d'environnement pour personnaliser l'envoi d'emails
export SENDER_EMAIL="votre-email@domaine.com"
export CABINET_NAME="Nom de votre Cabinet"
```

Ces variables peuvent aussi être configurées directement dans `amplify/backend.ts` :

### 3. Configuration pour production

Pour la production, vous devrez :
- Sortir du mode "Sandbox" d'AWS SES
- Vérifier votre domaine complet dans SES
- Configurer les enregistrements DNS nécessaires

## Test de la fonctionnalité

### 1. Test via l'interface utilisateur

1. Aller sur une facture existante (`/invoices/[id]`)
2. S'assurer que le patient a une adresse email
3. Cliquer sur "Envoyer par email"
4. Vérifier le statut d'envoi affiché

### 2. Test des templates d'email

Les templates d'email incluent :
- Version HTML avec style CSS intégré
- Version texte pour les clients qui ne supportent pas HTML
- Informations de la facture (numéro, date, montant)
- Informations du patient

### 3. Gestion d'erreurs

L'application gère les erreurs suivantes :
- Patient sans adresse email
- Facture non trouvée
- Erreurs de configuration SES
- Erreurs réseau

## Structure des fichiers

```
amplify/
├── functions/
│   └── send-invoice-email/
│       ├── handler.ts          # Logique d'envoi d'email
│       ├── package.json        # Dépendances (AWS SDK)
│       └── resource.ts         # Configuration de la fonction
├── backend.ts                  # Configuration backend avec permissions SES
└── data/resource.ts           # Schema GraphQL avec mutation email

src/
├── hooks/useInvoiceManagement.ts    # Hook mis à jour pour l'envoi d'email
└── components/invoices/InvoiceDetails.tsx    # Interface utilisateur mise à jour
```

## Sécurité

- La fonction email nécessite les permissions `osteopaths` ou `assistants`
- Les permissions SES sont limitées aux actions `SendEmail` et `SendRawEmail`
- Les données patient ne sont jamais exposées dans les logs

## Prochaines améliorations possibles

- [ ] Personnalisation des templates d'email
- [ ] Historique des emails envoyés
- [ ] Pièces jointes PDF des factures
- [ ] Notifications de lecture d'email
- [ ] Configuration des emails automatiques pour les factures en retard