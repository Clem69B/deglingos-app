# Deglingos App

A medical practice management application for handling patients, consultations, invoices, and appointments.

## Overview

This is a personal project built to manage the daily operations of a medical practice. It provides tools for patient management, consultation tracking, invoice generation, and appointment scheduling.

## Tech Stack

- **Frontend**: Next.js 15.3 with React 19 and TypeScript
- **Backend**: AWS Amplify (Infrastructure as Code)
- **Authentication**: AWS Cognito
- **API**: AWS AppSync (GraphQL)
- **Database**: DynamoDB
- **Storage**: AWS S3
- **Styling**: Tailwind CSS 4
- **Internationalization**: i18next

## Prerequisites

- Node.js 20 or later
- npm or yarn
- AWS account with Amplify CLI configured

## Installation

1. Clone the repository:
```bash
git clone https://github.com/Clem69B/deglingos-app.git
cd deglingos-app
```

2. Install dependencies:
```bash
npm install
```

3. Configure AWS Amplify:
```bash
npx ampx sandbox
```

This will set up a local development environment with AWS resources.

## Development

Start the development server:

```bash
npm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000).

### Available Commands

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run amplify:sandbox` - Start Amplify sandbox environment
- `npm run amplify:deploy` - Deploy to AWS

## Project Structure

```
src/
├── app/              # Next.js App Router pages
│   ├── patients/     # Patient management
│   ├── consultations/# Consultation tracking
│   ├── invoices/     # Invoice generation
│   ├── accounting/   # Accounting dashboard
│   ├── appointments/ # Appointment scheduling
│   └── settings/     # Application settings
├── components/       # Reusable React components
├── hooks/           # Custom React hooks
├── types/           # TypeScript type definitions
└── lib/             # Configuration and utilities

amplify/
├── data/            # GraphQL schema
├── auth/            # Cognito configuration
├── functions/       # Lambda functions
└── storage/         # S3 configuration
```

## Features

- **Patient Management**: Create and manage patient records
- **Consultations**: Track consultations with patients
- **Invoicing**: Generate and manage invoices, including PDF generation
- **Accounting**: Track payments and check deposits
- **Appointments**: Schedule and manage appointments
- **User Profiles**: Professional profile settings with signature upload
- **Team Management**: Multi-user support with role-based permissions

## Deployment

Deploy to AWS:

```bash
npm run amplify:deploy
```

This deploys the backend infrastructure and Next.js application to AWS Amplify.

## License

Private project - All rights reserved.
