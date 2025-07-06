# Get User Details Function

This Lambda function retrieves user details from AWS Cognito User Pool.

## Purpose
Resolves user UUIDs to human-readable names (givenName + familyName) for display in the consultation view.

## Input
- `userId` (string): The Cognito User Pool user UUID

## Output
```json
{
  "userId": "uuid-string",
  "email": "user@example.com",
  "givenName": "First",
  "familyName": "Last",
  "phoneNumber": "+33123456789",
  "enabled": true,
  "userStatus": "CONFIRMED",
  "createdDate": "2025-01-15T10:30:00Z",
  "lastModifiedDate": "2025-01-15T10:30:00Z"
}
```

## Error Handling
- Returns "User not found" for non-existent users
- Logs all errors for debugging
- Throws descriptive error messages

## Dependencies
- `@aws-sdk/client-cognito-identity-provider`: For Cognito operations
- Requires `AMPLIFY_AUTH_USERPOOL_ID` environment variable

## Permissions Required
- `cognito-idp:AdminGetUser`
