# User Profile Migration Guide

## Overview
This migration populates the UserProfile table with data from existing Cognito users.

## Running the Migration

The migration can be executed by calling the `populateUserProfiles` mutation. This mutation is restricted to admins only.

### Via GraphQL API (Admin Console)

```graphql
mutation PopulateUserProfiles {
  populateUserProfiles
}
```

### Response Format

```json
{
  "success": true,
  "message": "Migration completed",
  "totalUsers": 10,
  "createdProfiles": 8,
  "skippedProfiles": 2
}
```

## What the Migration Does

1. Lists all users from the Cognito User Pool
2. For each user:
   - Checks if a UserProfile already exists
   - If not, creates a new UserProfile record with:
     - userId (from Cognito username)
     - email
     - givenName
     - familyName
     - phoneNumber (if available)
     - createdAt/updatedAt timestamps
3. Skips users that already have a profile
4. Returns a summary of the migration

## Post-Migration

After running the migration:
- All existing users will have UserProfile records
- New users created via the `createUser` mutation will automatically get a UserProfile
- Users can update their profiles via the Settings page

## Troubleshooting

- **Error: Unauthorized**: Ensure you're logged in as an admin
- **Some profiles skipped**: This is normal for users who already have profiles
- **Partial failure**: Check CloudWatch logs for the `populate-user-profiles` Lambda function
