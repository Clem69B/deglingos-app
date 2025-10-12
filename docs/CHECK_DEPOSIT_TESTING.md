# Check Deposit Tracking - Test Scenarios

## Test Environment Setup

Before testing, ensure:
1. Database schema is deployed with the new fields (`depositDate`, `isDeposited`)
2. You have at least one patient in the system
3. You have access to the accounting dashboard (osteopath, assistant, or admin role)

## Scenario 1: Creating an Undeposited Check

**Objective**: Verify that checks are automatically tracked when invoices are paid.

**Steps**:
1. Navigate to Invoices → Create New Invoice
2. Fill in the form:
   - Patient: Select any patient
   - Invoice Date: Today's date
   - Amount: 50.00€
   - Payment Method: Select "Chèque"
   - Notes: "Chèque n°123456 - Banque Populaire"
3. Click "Create Invoice"
4. Navigate to the invoice detail page
5. Click "Marquer comme payée" button
6. Navigate to Accounting Dashboard
7. Check the "Chèques non encaissés" section

**Expected Result**:
- Check appears in the undeposited checks list
- Shows patient name, invoice number, amount (50.00€), and notes
- Count shows "(1)" next to "Chèques non encaissés"

## Scenario 2: Individual Check Deposit

**Objective**: Verify single check deposit functionality.

**Prerequisites**: At least one undeposited check (from Scenario 1)

**Steps**:
1. Navigate to Accounting Dashboard
2. In "Chèques non encaissés" section, find the check
3. Click "Encaisser" button on the check row
4. Modal opens showing:
   - Check details (patient, amount, notes)
   - Date picker (pre-filled with today's date)
5. Verify the date is correct
6. Click "Confirmer l'encaissement"

**Expected Result**:
- Modal closes
- Check is removed from the list
- Count decreases: "(0)" next to "Chèques non encaissés"
- No errors displayed

## Scenario 3: Bulk Check Deposit

**Objective**: Verify multiple checks can be deposited together.

**Prerequisites**: Create 3 undeposited checks (repeat Scenario 1 three times)

**Steps**:
1. Navigate to Accounting Dashboard
2. In "Chèques non encaissés" section:
   - Check the checkbox for the first check
   - Check the checkbox for the second check
   - Check the checkbox for the third check
3. Click "Encaisser sélection (3)" button
4. Modal opens showing:
   - All 3 checks listed with details
   - Total amount (sum of all 3 checks)
   - Date picker (pre-filled with today's date)
5. Click "Confirmer l'encaissement"

**Expected Result**:
- Modal closes
- All 3 checks removed from the list
- Count shows "(0)" next to "Chèques non encaissés"
- No errors displayed

## Scenario 4: Select All Functionality

**Objective**: Verify "Tout sélectionner" button works correctly.

**Prerequisites**: Create 5 undeposited checks

**Steps**:
1. Navigate to Accounting Dashboard
2. In "Chèques non encaissés" section, click "Tout sélectionner"
3. Verify all 5 checkboxes are checked
4. Button text changes to "Tout désélectionner"
5. Click "Tout désélectionner"
6. Verify all checkboxes are unchecked
7. Click "Tout sélectionner" again
8. Click "Encaisser sélection (5)"
9. Confirm in modal

**Expected Result**:
- All checks are deposited
- List is empty
- Empty state message shown

## Scenario 5: Search Functionality

**Objective**: Verify search works across all fields.

**Prerequisites**: Create checks with different patients and notes

**Test Cases**:
1. Search by patient first name
   - Enter patient's first name in search box
   - Verify only matching checks appear

2. Search by patient last name
   - Enter patient's last name in search box
   - Verify only matching checks appear

3. Search by invoice number
   - Enter invoice number (e.g., "INV-2025-001")
   - Verify only matching check appears

4. Search by amount
   - Enter amount (e.g., "50")
   - Verify checks with matching amounts appear

5. Search by notes (check number)
   - Enter check number from notes (e.g., "123456")
   - Verify only matching check appears

6. Search with no results
   - Enter non-existent text (e.g., "XXXXXX")
   - Verify "Aucun chèque trouvé" message appears

**Expected Result**:
- Search is case-insensitive
- Results update immediately as you type
- Clear search to show all checks again

## Scenario 6: Date Validation

**Objective**: Verify future dates are rejected.

**Prerequisites**: At least one undeposited check

**Steps**:
1. Navigate to Accounting Dashboard
2. Click "Encaisser" on any check
3. In the modal, change the date to tomorrow's date
4. Click "Confirmer l'encaissement"

**Expected Result**:
- Error message displayed: "La date d'encaissement ne peut pas être dans le futur"
- Modal remains open
- Check is NOT deposited
- Change date to today and retry - should succeed

## Scenario 7: Old Check Visual Indicator

**Objective**: Verify checks older than 30 days are highlighted.

**Prerequisites**: Need to manually set an invoice date to > 30 days ago or wait

**Steps**:
1. Create an invoice with a date 31+ days in the past
2. Mark as paid with payment method "Chèque"
3. Navigate to Accounting Dashboard
4. Check the "Chèques non encaissés" list

**Expected Result**:
- Check row has yellow/warning background color
- "Ancien" badge appears next to the date
- Other recent checks do NOT have this indicator

## Scenario 8: Empty State Display

**Objective**: Verify empty state when no checks are undeposited.

**Prerequisites**: No undeposited checks (deposit all existing ones)

**Steps**:
1. Navigate to Accounting Dashboard
2. View "Chèques non encaissés" section

**Expected Result**:
- Check icon displayed (empty state illustration)
- Message: "Aucun chèque en attente d'encaissement"
- No search box shown
- No action buttons shown
- Count shows "(0)"

## Scenario 9: Non-Check Payment Methods

**Objective**: Verify only CHECK payment methods appear in the tracker.

**Steps**:
1. Create 4 invoices for the same patient:
   - Invoice 1: Payment method = "Chèque"
   - Invoice 2: Payment method = "Virement"
   - Invoice 3: Payment method = "Espèces"
   - Invoice 4: Payment method = "Carte Bancaire"
2. Mark all 4 as paid
3. Navigate to Accounting Dashboard
4. Check "Chèques non encaissés" section

**Expected Result**:
- Only Invoice 1 (Chèque) appears in the list
- Count shows "(1)"
- Other payment methods are NOT tracked

## Scenario 10: Loading States

**Objective**: Verify loading indicators work correctly.

**Steps**:
1. Navigate to Accounting Dashboard
2. Observe initial load of "Chèques non encaissés"
3. Click "Encaisser" on a check
4. Observe loading state during deposit
5. Click "Encaisser sélection (X)" for multiple checks
6. Observe loading state during bulk deposit

**Expected Result**:
- Loading spinner shown while fetching checks
- "Chargement des chèques..." message displayed
- Buttons disabled during operations
- "Encaissement en cours..." message in modal
- UI remains responsive

## Scenario 11: Error Recovery

**Objective**: Verify system handles errors gracefully.

**Prerequisites**: Simulate network error (disconnect internet briefly)

**Steps**:
1. Navigate to Accounting Dashboard with checks present
2. Disconnect network
3. Try to deposit a check
4. Reconnect network
5. Retry deposit

**Expected Result**:
- Error message displayed in ErrorAlert component
- Check remains in list after error
- Can retry operation successfully
- No data corruption

## Scenario 12: Permissions Verification

**Objective**: Verify only authorized users can access the feature.

**Test Cases**:
1. Login as Osteopath
   - Should see full accounting dashboard with check tracker
   
2. Login as Assistant
   - Should see full accounting dashboard with check tracker
   
3. Login as Admin
   - Should see full accounting dashboard with check tracker
   
4. Login as unauthorized user (if any)
   - Should NOT see accounting dashboard
   - "Accès non autorisé" message displayed

**Expected Result**:
- Access control works as designed
- No errors in console
- Proper permission messages

## Scenario 13: Notes Field Integration

**Objective**: Verify check details are properly stored and displayed.

**Steps**:
1. Create invoice with payment method "Chèque"
2. In Notes field, enter:
   ```
   Chèque n°ABC789 - Crédit Agricole - Émis le 10/01/2025
   ```
3. Mark invoice as paid
4. Navigate to Accounting Dashboard
5. View check in "Chèques non encaissés" list

**Expected Result**:
- Full notes text visible in table (or truncated with "..." if long)
- Hover to see full text (if implemented)
- Notes preserved after deposit
- Can search by any part of notes text

## Performance Test Scenarios

### Scenario 14: Many Checks Performance

**Objective**: Verify system handles large number of checks.

**Prerequisites**: Create 50+ undeposited checks

**Steps**:
1. Navigate to Accounting Dashboard
2. Observe load time for "Chèques non encaissés"
3. Test search with 50+ checks
4. Select all 50+ checks
5. Perform bulk deposit

**Expected Result**:
- Page loads in < 3 seconds
- Search is responsive (< 500ms)
- Bulk deposit completes successfully
- No UI freezing or timeouts

## Integration Test Scenarios

### Scenario 15: End-to-End Workflow

**Objective**: Complete workflow from consultation to check deposit.

**Steps**:
1. Create a new patient
2. Create a consultation for the patient
3. From consultation, create an invoice
4. Set payment method to "Chèque"
5. Add check notes
6. Mark invoice as paid
7. Navigate to Accounting Dashboard
8. Verify check appears
9. Deposit the check
10. Navigate back to invoice detail page
11. Verify invoice shows deposited status

**Expected Result**:
- Smooth workflow with no errors
- Data consistency across all pages
- Invoice detail page shows deposit information
- Check no longer appears in tracker

## Regression Test Scenarios

### Scenario 16: Existing Functionality Intact

**Objective**: Verify new feature doesn't break existing features.

**Test Cases**:
1. Create invoice with non-check payment methods
   - Mark as paid
   - Verify normal behavior

2. Revenue chart still works
   - Shows paid invoices correctly
   - Includes check payments in totals

3. Monthly summary calculations
   - Check payments included in totals
   - Payment method breakdown correct

4. Invoice list and filtering
   - All invoices appear correctly
   - Status filters work

**Expected Result**:
- All existing features work as before
- New fields don't interfere with existing operations
- No console errors

## Browser Compatibility

### Scenario 17: Cross-Browser Testing

**Browsers to Test**:
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers (Chrome Mobile, Safari iOS)

**Test Points**:
- Layout and responsive design
- Date picker functionality
- Modal display and interaction
- Search functionality
- Checkbox selection

**Expected Result**:
- Consistent behavior across all browsers
- No visual glitches
- All features functional

## Accessibility Testing

### Scenario 18: Keyboard Navigation

**Steps**:
1. Navigate to Accounting Dashboard using Tab key
2. Use Tab to navigate through checkboxes
3. Use Space to select checks
4. Use Tab to reach "Encaisser sélection" button
5. Press Enter to open modal
6. Navigate modal with Tab and Enter

**Expected Result**:
- All interactive elements accessible via keyboard
- Logical tab order
- Visual focus indicators
- Can complete entire workflow without mouse

## Deployment Verification

### Scenario 19: Post-Deployment Checks

**After deploying to production**:

**Immediate Checks**:
1. Verify schema migration successful
2. Existing invoices have `isDeposited` field (null for non-checks)
3. Create new check invoice - `isDeposited` defaults to false
4. All new features work in production
5. No errors in CloudWatch logs

**24-Hour Checks**:
1. Monitor for any errors related to check tracking
2. Verify data integrity
3. Check user feedback
4. Review performance metrics

**Expected Result**:
- Smooth deployment
- No data loss
- Feature fully functional in production
- Positive user feedback

---

## Test Reporting Template

For each test scenario, record:

```
Scenario #: [Number]
Test Date: [Date]
Tester: [Name]
Result: [PASS/FAIL]
Notes: [Any observations]
Issues Found: [Bug IDs if any]
```

## Known Limitations

Document any known limitations discovered during testing:
1. Maximum number of checks that can be bulk deposited
2. Search performance with very long notes fields
3. Browser-specific quirks
4. Mobile experience limitations
