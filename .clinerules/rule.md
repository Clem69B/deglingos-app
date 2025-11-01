# "Deglingos App" Project Context and Organization

This document serves as a guide to understanding the project's architecture, organization, and best practices. It is intended to be used as context for interactions with Cline.

## 1. Project Overview

The "Deglingos App" is a web management application, likely for a medical practice or clinic. It appears to manage:
- Patients
- Consultations
- Invoices
- Appointments
- Users and their permissions (Team Management)

## 2. Tech Stack

- **Frontend:** [Next.js](https://nextjs.org/) (with App Router) and [React](https://react.dev/).
- **Language:** [TypeScript](https://www.typescriptlang.org/) for robustness and type safety.
- **Backend & Infrastructure:** [AWS Amplify](https://aws.amazon.com/amplify/) is used for the entire backend (Infrastructure as Code).
- **Authentication:** AWS Cognito (via `amplify/auth`).
- **API:** AWS AppSync (GraphQL) for the data API (via `amplify/data`).
- **Serverless Functions:** AWS Lambda for specific business logic, like user management (via `amplify/functions`).
- **File Storage:** AWS S3 (via `amplify/storage`).
- **Styling:** [Tailwind CSS](https://tailwindcss.com/) with PostCSS.
- **Code Quality:** ESLint.

## 3. Code Organization

The project follows a clear, modular structure to facilitate maintenance and scalability.

### `/src` - Frontend Source Code

-   **`/src/app`**: The core of the Next.js application, organized by feature (domain).
    -   `/app/patients`: Everything related to patient management.
    -   `/app/consultations`: Manages consultations.
    -   Each feature directory contains pages (`page.tsx`), dynamic routes (`[id]/page.tsx`), and creation pages (`new/page.tsx`).
-   **`/src/components`**: Reusable React components. Components related to a specific entity (e.g., `users`) are grouped in subdirectories.
-   **`/src/hooks`**: Custom React hooks that encapsulate business logic and state (e.g., `useUserManagement`, `useErrorHandler`).
-   **`/src/contexts`**: React contexts for cross-cutting state sharing (e.g., `DirtyFormContext`).
-   **`/src/lib`**: Configuration and initialization files (e.g., `amplify.ts`).
-   **`/src/types`**: TypeScript type definitions, organized by entity.

### `/amplify` - Backend Definition

-   This directory contains the entire backend infrastructure configuration as code (IaC).
-   **`/amplify/data`**: Defines the GraphQL API schema.
-   **`/amplify/auth`**: Configures the authentication service.
-   **`/amplify/functions`**: Contains the source code for Lambda functions, each in its own subdirectory.
-   **`/amplify/storage`**: Configures S3 file storage.

## 4. Layout and Main Components

### General Layout (`src/app/layout.tsx`)
The main layout is defined in `src/app/layout.tsx`. It establishes a consistent structure for all pages:
- A persistent top navigation bar (`<Navigation />`).
- A main content area (`<main>`) with a maximum width and centered padding, ensuring a consistent look across the application.
- The entire application is wrapped in `Providers` for context management (e.g., Amplify UI).

### Reusable Components (`src/components/`)
- **`Navigation.tsx`**: A central component that handles both desktop and mobile navigation. It uses `ProtectedLink` to manage navigation and warns the user about unsaved changes via `DirtyFormContext`.
- **`ProtectedLink.tsx`**: A wrapper around Next.js's `<Link>` component. It prevents navigation if a form on the page is "dirty" (has unsaved changes), asking the user for confirmation first.
- **`EditableField.tsx`**: A generic component for displaying and editing a field value. It toggles between a view mode and an edit mode (input field) and handles the save and cancel actions.
- **`PatientCombobox.tsx`**: A search and selection component for patients, likely used in forms for consultations or invoices.
- **`TeamManagement.tsx`**: A high-level component that encapsulates the entire user management interface, including the user list and creation/editing forms.

## 5. Best Practices & Conventions

1.  **Language Convention**: Although the user-facing application is in French, **all code, comments, and commit messages must be written in English** to ensure consistency and maintainability.
2.  **Feature-based Organization**: Any new feature should be created in its own directory within `/src/app`.
3.  **Strict TypeScript**: Use typing to ensure data safety. Shared types are located in `/src/types`.
4.  **Reusable Components**: Isolate UI into generic components in `/src/components`.
5.  **Hooks for Logic**: Extract complex logic (API calls, state management) into custom hooks in `/src/hooks`.
6.  **Backend Management via Amplify**: All infrastructure changes must be made by modifying files in the `/amplify` directory and using the Amplify CLI.
