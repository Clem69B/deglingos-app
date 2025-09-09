# Déploiement de la fonctionnalité d'envoi d'email

## Étapes de déploiement

### 1. Configurer AWS SES (Simple Email Service)

Avant le déploiement, configurer SES dans votre compte AWS :

```bash
# 1. Aller dans la console AWS SES
# 2. Vérifier l'adresse email expéditrice
# 3. Si nécessaire, demander la sortie du mode sandbox
```

### 2. Configurer les variables d'environnement

```bash
# Optionnel : Définir les variables d'environnement
export SENDER_EMAIL="cabinet@exemple.com"
export CABINET_NAME="Cabinet Dr. Exemple"
```

### 3. Déployer l'infrastructure Amplify

```bash
# Déployer l'environnement de développement
npx ampx sandbox

# OU déployer en production
npx ampx pipeline-deploy --branch main
```

### 4. Test de la fonctionnalité

Après déploiement :

1. Aller sur l'application web
2. Naviguer vers une facture existante
3. S'assurer que le patient a une adresse email
4. Cliquer sur "Envoyer par email"
5. Vérifier que l'email a été reçu

### 5. Surveillance

Surveiller les logs de la fonction Lambda dans CloudWatch pour détecter d'éventuelles erreurs :

- Erreurs de configuration SES
- Quotas d'envoi dépassés
- Problèmes de permissions

## Résolution de problèmes

### Email non envoyé
- Vérifier que l'adresse expéditrice est vérifiée dans SES
- Vérifier les quotas d'envoi SES
- Consulter les logs CloudWatch de la fonction `send-invoice-email`

### Erreurs de permissions
- Vérifier que la fonction Lambda a les permissions SES appropriées
- Vérifier l'accès aux tables DynamoDB

### Configuration
- Vérifier les variables d'environnement dans la console AWS Lambda
- S'assurer que les tables DynamoDB sont accessibles