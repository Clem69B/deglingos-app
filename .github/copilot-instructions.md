# Copilot Instructions for Deglingos App

## Project Overview

Deglingos App is a web-based management application for medical practices and clinics. It manages patients, consultations, invoices, appointments, and team permissions with a modern tech stack.

## Tech Stack

- **Frontend**: Next.js 15.3 (App Router) with React 19 and TypeScript 5
- **Backend & Infrastructure**: AWS Amplify (Infrastructure as Code)
- **Authentication**: AWS Cognito
- **API**: AWS AppSync (GraphQL)
- **Functions**: AWS Lambda (serverless)
- **Storage**: AWS S3
- **Styling**: Tailwind CSS 4 with PostCSS
- **Internationalization**: i18next and react-i18next
- **Charts**: Chart.js with react-chartjs-2
- **PDF Generation**: jsPDF
- **Linting**: ESLint with Next.js configuration

## Code Organization

### Frontend Structure (`/src`)

- **`/src/app`**: Next.js App Router - organized by feature/domain
  - `/app/patients`: Patient management pages
  - `/app/consultations`: Consultation management
  - `/app/invoices`: Invoice management
  - `/app/accounting`: Accounting dashboard and check tracking
  - `/app/appointments`: Appointment scheduling
  - `/app/settings`: Application settings
  - Each feature includes `page.tsx`, dynamic routes `[id]/page.tsx`, and creation pages `new/page.tsx`

- **`/src/components`**: Reusable React components
  - Group related components in subdirectories (e.g., `/components/users`)
  - Create generic, reusable UI components
  - Use TypeScript for all component props

- **`/src/hooks`**: Custom React hooks
  - Extract business logic and API calls into custom hooks
  - Follow naming convention: `use[Feature]Management` (e.g., `usePatientManagement`)
  - Handle loading states, errors, and data fetching

- **`/src/contexts`**: React contexts for cross-cutting concerns
  - `DirtyFormContext`: Tracks unsaved form changes
  - Create contexts for global state that needs to be shared across components

- **`/src/types`**: TypeScript type definitions
  - Organized by entity (patient, consultation, invoice, etc.)
  - Export all types from `index.ts`
  - Use consistent naming: `[Entity]BaseData`, `Create[Entity]Input`, `Update[Entity]Input`

- **`/src/lib`**: Configuration and initialization
  - `amplify.ts`: AWS Amplify configuration

### Backend Structure (`/amplify`)

- **`/amplify/data`**: GraphQL API schema definition
  - Define data models in `resource.ts`
  - Use Amplify Gen 2 schema format

- **`/amplify/auth`**: Authentication configuration
  - Configure Cognito user pools and authentication flows

- **`/amplify/functions`**: Lambda function source code
  - Each function in its own directory
  - Common functions: user management, PDF generation, email sending

- **`/amplify/storage`**: S3 storage configuration
  - Define buckets and access policies

## Development Conventions

### Language

**CRITICAL**: All code, comments, variable names, function names, and commit messages MUST be written in **English**. The user interface is in French, but all development artifacts must be in English for consistency and maintainability.

### Code Style

1. **TypeScript Strict Mode**: Enable and follow strict TypeScript rules
2. **Component Structure**: Use functional components with hooks
3. **Props Typing**: Always define TypeScript interfaces for component props
4. **Error Handling**: Use try-catch blocks and display errors with ErrorAlert component
5. **Loading States**: Always handle and display loading states in UI
6. **Comments**: Add comments only when necessary to explain complex logic
7. **File Naming**: Use kebab-case for files, PascalCase for components

### State Management

- Use React hooks (`useState`, `useEffect`, `useContext`) for local state
- Create custom hooks for reusable logic
- Use contexts for global state (avoid prop drilling)
- Leverage AWS Amplify's data client for server state

### API Calls

- Use AWS Amplify's `generateClient()` for GraphQL operations
- Implement queries, mutations, and subscriptions through Amplify
- Handle errors gracefully and display user-friendly messages
- Always include loading and error states

### Forms

- Track form changes with `DirtyFormContext`
- Validate input before submission
- Show clear error messages for validation failures
- Prevent navigation when forms have unsaved changes (use `ProtectedLink`)

## Build, Test, and Deploy

### Development

```bash
npm run dev              # Start development server with Turbopack
npm run lint            # Run ESLint
npm run build           # Build for production
```

### AWS Amplify

```bash
npx ampx sandbox        # Start local sandbox environment
npx ampx pipeline-deploy --branch main  # Deploy to production
```

### Testing

⚠️ **Note**: This project does not currently have automated tests. When adding new features:
- Manually test all user flows
- Test responsive design on different screen sizes
- Verify error handling scenarios
- Test with different user permissions

## Feature Development Guidelines

### Adding New Features

1. **Create Feature Directory**: Add new pages in `/src/app/[feature]`
2. **Create Custom Hook**: Extract business logic to `/src/hooks/use[Feature]Management.ts`
3. **Define Types**: Add TypeScript types to `/src/types/[feature].ts`
4. **Build Components**: Create reusable components in `/src/components`
5. **Update Backend**: Modify Amplify schema in `/amplify/data/resource.ts` if needed
6. **Update Navigation**: Add routes to `/src/components/Navigation.tsx`

### Modifying Data Schema

1. Update `/amplify/data/resource.ts` with new models or fields
2. Add corresponding TypeScript types in `/src/types`
3. Update GraphQL queries/mutations in hooks
4. Test with sandbox environment first
5. Deploy schema changes carefully (they affect production database)

### Creating Lambda Functions

1. Create new directory in `/amplify/functions/[function-name]`
2. Implement handler with proper error handling
3. Configure function in `/amplify/backend.ts`
4. Test locally before deployment
5. Follow AWS Lambda best practices

## Common Patterns

### Custom Hook Pattern

```typescript
export function use[Feature]Management() {
  const [data, setData] = useState<DataType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch, create, update, delete operations
  
  return {
    data,
    loading,
    error,
    // CRUD methods
  };
}
```

### Component Pattern

```typescript
interface ComponentProps {
  // Define props with TypeScript
}

export default function Component({ prop1, prop2 }: ComponentProps) {
  // Component logic
  return (
    // JSX
  );
}
```

### Error Handling Pattern

```typescript
try {
  // Operation
  setError(null);
} catch (err) {
  console.error('Operation failed:', err);
  setError('User-friendly error message in French');
}
```

## Important Conventions

### Permissions

- Check user permissions before rendering UI elements
- Use Cognito groups: `ADMIN`, `USER`
- Restrict sensitive operations to authorized users

### Date Handling

- Use `date-fns` for date formatting and manipulation
- Store dates in ISO format
- Display dates in user-friendly French format

### Responsive Design

- Use Tailwind CSS responsive utilities (`sm:`, `md:`, `lg:`)
- Test on mobile, tablet, and desktop viewports
- Ensure touch-friendly UI elements on mobile

### Internationalization

- Use i18next for all user-facing text
- Keep translation keys organized by feature
- UI text is in French, but code/comments are in English

## Performance Considerations

- Use Next.js Image component for optimized images
- Implement pagination for large lists
- Use React.memo for expensive components
- Optimize GraphQL queries to fetch only needed data
- Use client-side caching where appropriate

## Security Best Practices

- Never commit secrets or API keys
- Use environment variables for configuration
- Validate input on both client and server
- Follow AWS security best practices
- Use HTTPS for all API calls
- Implement proper authentication checks

## Documentation

- Update documentation when adding significant features
- Keep README.md current with setup instructions
- Document complex algorithms or business logic
- Create feature documentation in `/docs` for major features

## Git Workflow

### Commit Messages

- Write clear, descriptive commit messages in **English**
- Use conventional commit format: `type: description`
- Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`
- Example: `feat: add patient search functionality`

### Branch Strategy

- Create feature branches from main
- Name branches descriptively: `feature/patient-search`, `fix/invoice-calculation`
- Keep commits focused and atomic
- Squash commits when appropriate

## Common Issues and Solutions

### Build Errors

- Run `npm install` to ensure dependencies are up to date
- Clear `.next` cache: `rm -rf .next`
- Check TypeScript errors: errors may be type-related

### Amplify Issues

- Restart sandbox if schema changes don't reflect
- Check CloudFormation console for deployment errors
- Verify IAM permissions for backend operations

### Styling Issues

- Tailwind classes not applying: check PostCSS configuration
- CSS conflicts: ensure Tailwind's layers are properly ordered
- Responsive design: test breakpoints with browser dev tools

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [AWS Amplify Gen 2 Documentation](https://docs.amplify.aws/)
- [React Documentation](https://react.dev/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)

## Additional Context

- The application is used by medical professionals, prioritize data accuracy and security
- Patient data is sensitive - handle with care and follow privacy regulations
- Invoice generation and financial tracking require precise calculations
- The app supports multiple users with different permission levels
- Performance matters - medical staff need quick access to patient information

## Quick Reference

### Path Aliases

- `@/*` maps to `./src/*` for cleaner imports

### Environment Variables

Configure in `.env.local` (not committed to repository):
- Amplify configuration is auto-generated
- Add custom environment variables as needed

### Key Dependencies Versions

- Next.js: 15.3.3
- React: 19.0.0
- AWS Amplify: 6.15.0
- TypeScript: 5.x
- Tailwind CSS: 4.x
