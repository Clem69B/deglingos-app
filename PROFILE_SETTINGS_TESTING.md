# Testing Guide for User Profile Settings

## Prerequisites
- Deploy the Amplify Auth changes: `npx ampx sandbox`
- Wait for deployment to complete
- Sign in to the application

## Manual Testing Checklist

### 1. Navigation & UI
- [ ] Navigate to Settings page
- [ ] Verify "Profil" tab appears first
- [ ] Click "Profil" tab - should show profile form
- [ ] Verify all three sections are visible:
  - Informations personnelles
  - Informations professionnelles  
  - Paramètres de facturation

### 2. Data Loading
- [ ] Profile should load automatically on page load
- [ ] Loading spinner appears initially
- [ ] Fields populate with existing user data (if any)
- [ ] Empty fields show placeholder text

### 3. Personal Information Fields
- [ ] Edit "Prénom" field - should save on blur
- [ ] Edit "Nom" field - should save on blur
- [ ] Edit "Email" field with valid email - should save
- [ ] Edit "Email" field with invalid email - should show error
- [ ] Edit "Téléphone" field with valid phone - should save
- [ ] Edit "Téléphone" field with invalid chars - should show error

### 4. Professional Information Fields
- [ ] Edit "Titre professionnel" - should save on blur
- [ ] Edit "SIRET" with 14 digits - should save
- [ ] Edit "SIRET" with wrong length - should show error
- [ ] Edit "RPPS" with 11 digits - should save
- [ ] Edit "RPPS" with wrong length - should show error
- [ ] Edit "Adresse postale" - should save on blur

### 5. Billing Parameters
- [ ] Edit "Tarif de consultation" with number - should save
- [ ] Edit "Tarif de consultation" with text - should show error
- [ ] Edit "Tarif de consultation" with negative - should show error
- [ ] Edit "Pied de page des factures" - should save on blur

### 6. Auto-save Behavior
- [ ] Edit any field and blur - see "Enregistrement..." indicator
- [ ] After save - see success message (e.g., "Email mis à jour")
- [ ] Success message disappears after ~3 seconds
- [ ] Edit another field - previous success message clears

### 7. Validation Messages
- [ ] Invalid email shows: "Format d'email invalide"
- [ ] Invalid phone shows: "Format de téléphone invalide"
- [ ] Invalid SIRET shows: "Le SIRET doit contenir 14 chiffres"
- [ ] Invalid RPPS shows: "Le numéro RPPS doit contenir 11 chiffres"
- [ ] Invalid price shows: "Le tarif doit être un nombre positif"

### 8. Persistence
- [ ] Save changes to multiple fields
- [ ] Sign out of the application
- [ ] Sign back in
- [ ] Navigate to Profile settings
- [ ] Verify all changes persisted correctly

### 9. Error Handling
- [ ] Disconnect internet (if possible)
- [ ] Try to save a field
- [ ] Should see error message
- [ ] Reconnect and try again - should work

### 10. Edge Cases
- [ ] Clear all optional fields (leave empty) - should save
- [ ] Enter maximum length text in textarea fields
- [ ] Test with special characters in address/footer
- [ ] Test SIRET/RPPS with spaces (should accept)

## Expected Behavior Summary
- All fields are optional (can be empty)
- Auto-save on blur (no save button)
- Validation happens before save
- Invalid data prevents save, shows error
- Valid data saves immediately
- Success feedback shows briefly
- Data persists across sessions

## Bug Reporting
If any issues are found, report with:
1. Steps to reproduce
2. Expected vs actual behavior
3. Browser console errors (if any)
4. Screenshots of the issue
