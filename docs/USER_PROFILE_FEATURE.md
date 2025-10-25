# User Profile Management Feature

## Overview
This feature implements user-specific profile settings using a dedicated DynamoDB table and S3 for signature storage, replacing the previous approach of storing profile data in Cognito custom attributes.

## Architecture

### Backend

#### Data Model
- **Table**: `UserProfile`
- **Primary Key**: `userId` (Cognito username/sub)
- **Fields**:
  - Basic Information: email, givenName, familyName, phoneNumber
  - Professional Information: professionalTitle, postalAddress, siret, rpps
  - Financial: defaultConsultationPrice
  - Documents: invoiceFooter, signatureS3Key

#### Storage
- **Bucket Path**: `user_signatures/*`
- **Access**: Authenticated users (osteopaths, assistants, admins)
- **File Restrictions**: JPG only, max 1MB

#### Lambda Functions
1. **create-user**: Creates UserProfile record when creating Cognito user
2. **populate-user-profiles**: Migration function to populate existing users

#### Authorization
- **Read**: All authenticated users can read profiles
- **Update**: Admins and osteopaths can update profiles
- **Signature Upload**: Users with appropriate group membership

### Frontend

#### Pages
- **`/settings`**: Profile management interface with tabs
  - General settings
  - Professional profile (NEW)
  - Clinic settings
  - Billing settings
  - Notifications
  - Team management

#### Components
- **`SignatureUpload`**: Drag-and-drop signature upload component
  - Preview current signature
  - Upload new signature (JPG, <1MB)
  - Delete signature

#### Hooks
- **`useUserProfile`**: Manage user profile data
  - `fetchCurrentUserProfile()`: Get current user's profile
  - `fetchUserProfile(userId)`: Get any user's profile (admin/osteopath)
  - `updateProfile(userId, data)`: Update profile
  - `uploadSignature(userId, file)`: Upload signature to S3
  - `deleteSignature(userId, signatureKey)`: Delete signature
  - Validation helpers for SIRET, RPPS, phone, price

## Features

### 1. Professional Profile Management
Users can update their professional information:
- Professional title (e.g., "Ostéopathe D.O.")
- SIRET number (14 digits, validated)
- RPPS number (11 digits, validated)
- Professional address
- Default consultation price
- Invoice footer text

### 2. Signature Management
- Upload signature image (JPG only, max 1MB)
- Preview current signature
- Delete signature
- Client-side validation

### 3. Auto-prefill Invoice Price
- When creating a new invoice, the price is automatically prefilled with the user's `defaultConsultationPrice`
- Falls back to 55€ if no default price is set

## Validation Rules

### SIRET
- Must be exactly 14 digits
- Spaces are removed before validation

### RPPS
- Must be exactly 11 digits
- Spaces are removed before validation

### Phone Number
- French format: +33... or 0...
- Validates 10-digit mobile/landline numbers

### Consultation Price
- Must be a valid positive number
- Can include decimals

### Signature File
- Format: JPG/JPEG only
- Size: Maximum 1MB

## API Usage

### Fetch Current User Profile
```typescript
const { fetchCurrentUserProfile } = useUserProfile();
const profile = await fetchCurrentUserProfile();
```

### Update Profile
```typescript
const { updateProfile } = useUserProfile();
await updateProfile(userId, {
  professionalTitle: "Ostéopathe D.O.",
  siret: "12345678901234",
  rpps: "12345678901",
  defaultConsultationPrice: "80",
  // ... other fields
});
```

### Upload Signature
```typescript
const { uploadSignature } = useUserProfile();
const result = await uploadSignature(userId, file);
if (result.success) {
  console.log('Signature uploaded:', result.key);
}
```

## Migration

See [USER_PROFILE_MIGRATION.md](./USER_PROFILE_MIGRATION.md) for migration instructions.

## Future Enhancements

The following features are planned but not included in this release:
- Use user signature in invoice PDFs
- Use profile data (title, address, SIRET, RPPS) in invoice templates
- Email signature configuration
- Profile photo upload
- Multi-language support for profile fields

## Testing

### Manual Testing Checklist
- [ ] Create new user → verify UserProfile record created
- [ ] Edit profile fields → verify changes persist
- [ ] Upload signature → verify stored in S3 and referenced in profile
- [ ] Delete signature → verify removed from S3 and profile
- [ ] Sign out/in → verify profile data loads correctly
- [ ] Create invoice → verify price auto-prefilled
- [ ] Admin views other user's profile → verify read-only access

### Validation Testing
- [ ] Invalid SIRET format (not 14 digits)
- [ ] Invalid RPPS format (not 11 digits)
- [ ] Invalid phone format
- [ ] Non-JPG signature file
- [ ] Signature file >1MB
- [ ] Non-numeric consultation price

## Security Considerations

1. **Authorization**: UserProfile data is protected by Amplify authorization rules
2. **Storage**: S3 signatures are only accessible to authenticated users in appropriate groups
3. **Validation**: All inputs are validated both client-side and server-side
4. **Owner Access**: Users cannot directly modify other users' profiles without admin/osteopath permissions

## Performance Notes

- Profile data is fetched once on page load and cached in component state
- Signature URLs are generated on-demand using pre-signed URLs
- Migration function processes users in batches to avoid timeouts
