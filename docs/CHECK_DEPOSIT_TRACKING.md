# Check Deposit Tracking System

## Overview

The Check Deposit Tracking System allows osteopaths and assistants to monitor checks that have been received as payment but not yet deposited at the bank. This feature is integrated into the accounting dashboard.

## Features

### 1. Check Tracking
- **Automatic Detection**: When an invoice is marked as paid with payment method "CHECK", it automatically appears in the undeposited checks list
- **Visual Indicators**: Checks older than 30 days are highlighted with a warning badge
- **Search Functionality**: Search across patient names, invoice numbers, amounts, and check notes
- **Real-time Updates**: The list automatically refreshes after deposit operations

### 2. Deposit Operations
- **Individual Deposits**: Quick deposit button on each check
- **Bulk Deposits**: Select multiple checks and deposit them together
- **Date Validation**: Deposit date cannot be set in the future
- **Transaction Summary**: Modal shows total amount and all selected checks before confirmation

### 3. Check Information Storage
Check details should be stored in the invoice's `notes` field using this format:
```
Chèque n°1234567 - Banque Populaire
Chèque n°9876543 - Crédit Agricole - Signé par Jean Dupont
Chèque n°ABC123 - BNP Paribas - Reçu le 15/01/2025
```

## Data Model

### New Fields in Invoice Model

```typescript
Invoice {
  // ... existing fields
  depositDate?: string | null;     // Date when check was deposited (ISO date string)
  isDeposited?: boolean | null;    // Deposit status (false for undeposited checks)
}
```

### Field Behavior
- `isDeposited` is automatically set to `false` when marking an invoice as paid with `paymentMethod='CHECK'`
- `isDeposited` remains `null` for non-check payment methods
- `depositDate` is set when marking checks as deposited
- Invoice `status` remains `'PAID'` regardless of deposit status

## User Workflow

### Receiving a Check
1. Create or edit an invoice
2. Set payment method to "Chèque"
3. Add check details in the notes field (check number, bank, etc.)
4. Mark invoice as paid
5. Check automatically appears in "Chèques non encaissés" list

### Depositing Checks

#### Individual Deposit
1. Navigate to Accounting Dashboard
2. Find the check in the "Chèques non encaissés" list
3. Click "Encaisser" button on the check row
4. Select deposit date (defaults to today)
5. Confirm

#### Bulk Deposit
1. Navigate to Accounting Dashboard
2. Select multiple checks using checkboxes
3. Or click "Tout sélectionner" to select all
4. Click "Encaisser sélection (X)" button
5. Review the list of checks and total amount
6. Select deposit date (defaults to today)
7. Confirm

## Components

### CheckTracker
Main component that orchestrates the check tracking interface.
- **Location**: `src/app/accounting/components/CheckTracker.tsx`
- **Props**: `{ onError: (error: string) => void }`
- **Features**: Search, selection, bulk operations

### CheckList
Table component displaying undeposited checks.
- **Location**: `src/app/accounting/components/CheckList.tsx`
- **Props**: 
  - `checks: CheckInvoice[]`
  - `selectedIds: string[]`
  - `onSelectionChange: (ids: string[]) => void`
  - `onQuickDeposit: (id: string) => void`
- **Features**: Sortable, highlights old checks, shows patient info

### CheckDepositModal
Modal for confirming deposit operations.
- **Location**: `src/app/accounting/components/CheckDepositModal.tsx`
- **Props**:
  - `isOpen: boolean`
  - `selectedChecks: CheckInvoice[]`
  - `onClose: () => void`
  - `onConfirm: (depositDate: string) => Promise<void>`
- **Features**: Date picker, transaction summary, validation

## Hooks

### useCheckManagement
Custom hook for managing check operations.
- **Location**: `src/hooks/useCheckManagement.ts`
- **Returns**:
  ```typescript
  {
    undepositedChecks: CheckInvoice[];
    loading: boolean;
    error: string | null;
    markAsDeposited: (invoiceIds: string[], depositDate: string) => Promise<void>;
    refreshChecks: () => Promise<void>;
  }
  ```
- **Features**: 
  - Fetches undeposited checks with filters: `paymentMethod='CHECK'`, `status='PAID'`, `isDeposited=false`
  - Validates deposit dates
  - Handles bulk updates with transaction safety

## GraphQL Queries

### List Undeposited Checks
```typescript
await client.models.Invoice.list({
  filter: {
    paymentMethod: { eq: 'CHECK' },
    status: { eq: 'PAID' },
    isDeposited: { eq: false }
  }
});
```

### Mark as Deposited
```typescript
await client.models.Invoice.update({
  id: invoiceId,
  isDeposited: true,
  depositDate: '2025-01-15', // ISO date string
  updatedAt: new Date().toISOString()
});
```

## Validation Rules

1. **Deposit Date Validation**
   - Must be a valid date
   - Cannot be in the future (validated against server time)
   - Defaults to current date

2. **Check Status**
   - Only checks with `status='PAID'` and `isDeposited=false` appear in the list
   - Cannot mark already deposited checks as deposited again

3. **Transaction Safety**
   - Bulk operations update all invoices in parallel
   - If any update fails, error is reported
   - User can retry failed operations

## Error Handling

All errors are handled gracefully:
- Network errors: Displayed via error alert
- Validation errors: Prevented at UI level
- Partial failures: Reported with count of failed updates
- Auto-refresh after successful operations

## Performance Considerations

- **Efficient Queries**: Uses GraphQL filters to fetch only undeposited checks
- **Search Debouncing**: Client-side search without API calls
- **Optimistic Updates**: UI updates immediately, syncs with backend
- **Parallel Updates**: Bulk deposits execute in parallel for speed

## Permissions

Check management follows existing invoice permissions:
- **Osteopaths**: Full access (read, create, update)
- **Assistants**: Full access (read, create, update)
- **Admins**: Full access via osteopath group

## Future Enhancements

Potential improvements for future versions:
- Export check deposit reports
- Bank reconciliation features
- Automatic deposit date suggestions
- Email notifications for old checks
- Check scanning and OCR integration
- Multi-bank support with bank account selection

## Troubleshooting

### Checks Not Appearing
1. Verify invoice status is `PAID`
2. Verify payment method is `CHECK`
3. Check that `isDeposited` is `false`
4. Refresh the dashboard

### Deposit Date in Future Error
The system validates dates against server time. Ensure your system clock is accurate.

### Search Not Finding Checks
Search looks in: patient name, invoice number, total amount, and notes field. Check your search term.

## Testing

To test the feature:
1. Create a test invoice for a patient
2. Set payment method to "Chèque"
3. Add check details in notes: "Chèque n°TEST123 - Test Bank"
4. Mark invoice as paid
5. Navigate to Accounting Dashboard
6. Verify check appears in "Chèques non encaissés"
7. Test search, selection, and deposit operations

## Database Schema Changes

The feature requires deploying the updated schema to add two new fields to the Invoice table:
```bash
npx ampx pipeline-deploy --branch main
```

Or for sandbox testing:
```bash
npx ampx sandbox
```

## Related Files

- `amplify/data/resource.ts` - Data model definition
- `src/types/invoice.ts` - TypeScript types
- `src/hooks/useCheckManagement.ts` - Business logic
- `src/hooks/useInvoiceManagement.ts` - Invoice management (updated)
- `src/app/accounting/page.tsx` - Dashboard integration
- `src/app/accounting/components/CheckTracker.tsx` - Main component
- `src/app/accounting/components/CheckList.tsx` - Table component
- `src/app/accounting/components/CheckDepositModal.tsx` - Modal component
