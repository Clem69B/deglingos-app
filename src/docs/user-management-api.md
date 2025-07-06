# User Management API

This document describes the user management API created to retrieve practitioner information and manage user accounts.

## Overview

The API uses AWS Amplify Gen 2 with custom Lambda functions to interact with Amazon Cognito User Pool. It provides the following capabilities:

- Retrieve user details by UUID
- List all users with pagination
- Create new users
- Delete users
- Manage user groups

## Available Queries

### `getUserDetails`

Retrieves details for a specific user.

**Arguments:**
- `userId` (string, required): The user's UUID

**Returns:**
```json
{
  "userId": "b1c9802e-a0b1-7095-4ab2-40eed0feda4d",
  "email": "dr.martin@example.com",
  "givenName": "Jean",
  "familyName": "Martin",
  "phoneNumber": "+33123456789",
  "enabled": true,
  "userStatus": "CONFIRMED",
  "createdDate": "2025-01-15T10:30:00Z",
  "lastModifiedDate": "2025-01-15T10:30:00Z"
}
```

**Usage example:**
```typescript
const response = await client.queries.getUserDetails({ 
  userId: "b1c9802e-a0b1-7095-4ab2-40eed0feda4d" 
});
```

### `listUsers`

Lists all users with pagination.

**Arguments:**
- `limit` (integer, optional): Maximum number of users to return (default: 50)
- `nextToken` (string, optional): Pagination token to retrieve the next page

**Returns:**
```json
{
  "users": [
    {
      "userId": "user1-uuid",
      "email": "user1@example.com",
      "givenName": "Jean",
      "familyName": "Martin",
      // ... other fields
    }
  ],
  "nextToken": "token-for-next-page"
}
```

## Available Mutations

### `createUser`

Creates a new user in the User Pool.

**Arguments:**
- `email` (string, required): User's email address
- `givenName` (string, required): First name
- `familyName` (string, required): Last name
- `group` (string, required): Group to add the user to ("osteopaths" or "assistants")
- `phoneNumber` (string, optional): Phone number

**Returns:**
```json
{
  "success": true,
  "userId": "new-user-uuid",
  "message": "User created successfully"
}
```

### `deleteUser`

Deletes a user from the User Pool.

**Arguments:**
- `userId` (string, required): UUID of the user to delete

### `addUserToGroup` / `removeUserFromGroup`

Manages group membership.

**Arguments:**
- `userId` (string, required): User's UUID
- `groupName` (string, required): Group name

## Frontend Components

### `useUserCache` Hook

React hook for managing client-side user information cache.

```typescript
const { getUserDetails, isLoading, getError, clearCache } = useUserCache();

// Retrieve user details
const userDetails = await getUserDetails(userId);

// Check loading state
const loading = isLoading(userId);

// Get errors
const error = getError(userId);
```

### `PractitionerName` Component

React component to display a practitioner's name from their UUID.

```typescript
<PractitionerName 
  userId="b1c9802e-a0b1-7095-4ab2-40eed0feda4d"
  className="text-gray-900"
/>
```

**Props:**
- `userId` (string | null | undefined): User's UUID
- `className` (string, optional): Additional CSS classes

**States:**
- Loading: Shows a spinner
- Success: Displays "First Last"
- Error: Shows "Error" with details on hover
- No UUID: Shows "Not available"

## Security and Authorization

- All operations require authentication via Amazon Cognito
- Only users in the `osteopaths` group can use these APIs
- Lambda functions have minimal necessary permissions to interact with Cognito
- Sensitive data is not exposed on the client side

## Architecture

```
Frontend (React)
    ↓
GraphQL Schema (Amplify)
    ↓
Lambda Function (user-management)
    ↓
Amazon Cognito User Pool
```

## Error Handling

The API handles several types of errors:

- **User not found**: Returns explicit error
- **Insufficient permissions**: Authorization error
- **Validation errors**: Detailed error messages
- **Network errors**: Timeout and connectivity handling

## Performance

- **Client-side cache**: User details are cached to avoid repeated calls
- **Pagination**: User list with pagination for large databases
- **Lazy loading**: User details loaded only when needed

## Future Extensions

The architecture is ready for the following features:

- Update user attributes
- Password reset
- Advanced group management
- Audit and action logs
- Integration with external systems

## Implementation Notes

### Cache Strategy

The `useUserCache` hook implements an intelligent caching strategy:

- **Memory cache**: Stores user details in React state
- **Deduplication**: Prevents multiple simultaneous requests for the same user
- **Error handling**: Caches errors to avoid repeated failed requests
- **Manual clearing**: Provides cache invalidation when needed

### Component Design

The `PractitionerName` component follows React best practices:

- **Loading states**: Visual feedback during data fetching
- **Error boundaries**: Graceful error handling with user feedback
- **Accessibility**: Proper ARIA labels and keyboard navigation
- **Responsive design**: Works across different screen sizes

### Lambda Function Structure

The user management Lambda function is organized for maintainability:

- **Router pattern**: Single entry point with field-based routing
- **Type safety**: Full TypeScript integration with Amplify schema
- **Error handling**: Consistent error formatting and logging
- **Security**: Input validation and sanitization

## Deployment Considerations

When deploying this system:

1. **Environment variables**: Ensure Lambda has access to User Pool ID
2. **IAM permissions**: Verify Lambda execution role has Cognito permissions
3. **GraphQL schema**: Deploy schema updates before Lambda functions
4. **Client cache**: Consider cache invalidation strategies for production
5. **Monitoring**: Set up CloudWatch logs for Lambda function debugging
