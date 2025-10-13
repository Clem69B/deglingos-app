# User Profile Settings Implementation Summary

## Overview
Implemented per-user profile settings stored in AWS Cognito custom attributes. All fields are optional and automatically save on blur with validation.

## Changes Made

### 1. Amplify Auth Configuration (`amplify/auth/resource.ts`)
Added 6 custom Cognito attributes for professional profile data:
- `custom:professionalTitle` - Professional title (e.g., "Ostéopathe D.O.")
- `custom:postalAddress` - Postal address
- `custom:siret` - SIRET number (14 digits)
- `custom:rpps` - RPPS number (11 digits)
- `custom:defaultConsultationPrice` - Default consultation price
- `custom:invoiceFooter` - Custom footer text for invoices

All custom attributes are mutable and optional (String type).

### 2. TypeScript Types (`src/types/userProfile.ts`)
Created comprehensive type definitions:
- `UserProfile` - Interface matching Cognito attributes (standard + custom)
- `ProfileValidationErrors` - Validation error messages per field

### 3. Validation Library (`src/lib/validators.ts`)
Implemented validators for:
- Email format validation
- Phone number format validation (international format)
- SIRET validation (14 digits)
- RPPS validation (11 digits)
- Consultation price validation (numeric, positive)
- Generic `validateProfileField()` function for field-specific validation

### 4. useUserProfile Hook (`src/hooks/useUserProfile.ts`)
Custom React hook providing:
- `profile` - Current user profile data
- `loading` - Initial load state
- `error` - Error messages
- `updating` - Save in progress state
- `updateProfile(updates)` - Update multiple fields
- `updateField(fieldName, value)` - Update single field
- `refreshProfile()` - Reload profile from Cognito

The hook uses Amplify Auth APIs:
- `fetchUserAttributes()` - Load profile
- `updateUserAttributes()` - Save changes
- `getCurrentUser()` - Check authentication

### 5. ProfileSettings Component (`src/components/ProfileSettings.tsx`)
Full-featured profile editing UI with:

**Features:**
- Auto-save on field blur
- Real-time validation
- Success/error feedback with auto-dismiss
- Loading states
- Organized into 3 sections:
  1. Personal Information (name, email, phone)
  2. Professional Information (title, address, SIRET, RPPS)
  3. Billing Information (default price, invoice footer)

**User Experience:**
- All fields optional
- No "Save" button needed (auto-save)
- Inline validation errors
- Success notifications for 3 seconds
- Visual feedback during updates

### 6. Settings Page Integration (`src/app/settings/page.tsx`)
- Added "Profil" as first tab in settings
- Integrated ProfileSettings component
- Added UserCircleIcon for the profile tab

## Technical Details

### Data Flow
1. User opens settings page → Profile tab loads by default
2. `useUserProfile` hook fetches current user attributes from Cognito
3. Form fields populate with existing values
4. User edits a field and tabs/clicks away (blur event)
5. Field validates → If valid, auto-saves to Cognito
6. Success message shows briefly → Profile refreshes

### Validation Rules
- **Email**: Standard email format (`[email]@[domain].[tld]`)
- **Phone**: International format with optional +, spaces, dashes, parentheses
- **SIRET**: Exactly 14 digits (spaces ignored)
- **RPPS**: Exactly 11 digits (spaces ignored)
- **Price**: Positive numeric value

### Security
- Users can only access/modify their own profile
- All updates go through Amplify Auth (not direct DynamoDB)
- Cognito enforces attribute-level permissions
- Standard attributes (email, name, phone) follow Cognito policies

## Future Integration Points

### For Consultation Prefill
The `defaultConsultationPrice` can be accessed via:
```typescript
const { profile } = useUserProfile();
const defaultPrice = profile?.defaultConsultationPrice;
```

### For Invoice Templates
The `invoiceFooter`, `professionalTitle`, `postalAddress`, `siret`, and `rpps` fields are available for future invoice PDF generation.

## Deployment Requirements

To deploy these changes:

1. **Deploy Amplify Auth changes:**
   ```bash
   npx ampx sandbox  # For development
   # or
   npx ampx pipeline-deploy --branch main  # For production
   ```

2. **Important**: This will update the Cognito User Pool to add custom attributes. Custom attributes cannot be deleted once added, only marked as unused.

## Testing Checklist

- [ ] User can view their profile in settings
- [ ] All fields load correctly from Cognito
- [ ] Fields auto-save on blur
- [ ] Validation errors show for invalid data
- [ ] Success messages appear after save
- [ ] SIRET validation accepts 14 digits
- [ ] RPPS validation accepts 11 digits
- [ ] Price validation rejects non-numeric values
- [ ] Profile persists after sign out/in
- [ ] Changes visible immediately after save

## Files Modified
- `amplify/auth/resource.ts` - Added custom attributes
- `src/app/settings/page.tsx` - Added Profile tab

## Files Created
- `src/types/userProfile.ts` - Type definitions
- `src/lib/validators.ts` - Validation functions
- `src/hooks/useUserProfile.ts` - Profile management hook
- `src/components/ProfileSettings.tsx` - Profile UI component

## Estimated Effort
- Development: 0.5 day ✅
- Testing: Manual testing required
- Deployment: AWS Amplify deployment required
