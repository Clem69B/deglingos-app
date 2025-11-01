# Check Deposit Tracking - Quick Start Guide

## 🎯 What is this feature?

A system to track checks received as payment that haven't been deposited at the bank yet. It helps you:
- 📝 See all undeposited checks in one place
- 💰 Know how much money is waiting to be deposited
- ⚡ Quickly mark checks as deposited (individually or in bulk)
- 🔍 Search and filter checks easily
- ⚠️ Get alerts for checks older than 30 days

## 🚀 Quick Start (5 minutes)

### Step 1: Create a Check Invoice
1. Go to **Invoices** → **Create New Invoice**
2. Fill in patient and amount
3. Set **Payment Method** to "Chèque" 
4. In **Notes** field, add check details:
   ```
   Chèque n°123456 - Banque Populaire
   ```
5. Click **Create Invoice**

### Step 2: Mark as Paid
1. View the invoice you just created
2. Click **"Marquer comme payée"** button
3. The check is now tracked automatically! ✅

### Step 3: View Undeposited Checks
1. Go to **Accounting Dashboard**
2. Look at the **"Chèques non encaissés"** section
3. You'll see your check listed with:
   - Patient name
   - Invoice number
   - Amount
   - Date
   - Check details (from notes)

### Step 4: Deposit the Check
**For a single check:**
1. Click **"Encaisser"** button on the check row
2. Select deposit date (defaults to today)
3. Click **"Confirmer l'encaissement"**
4. Done! Check disappears from the list ✨

**For multiple checks:**
1. Check the box next to each check you want to deposit
2. Click **"Encaisser sélection (X)"** button at the top
3. Review the list and total amount
4. Select deposit date
5. Click **"Confirmer l'encaissement"**
6. All checks deposited! ✨

## 📊 User Interface Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Accounting Dashboard                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Revenue Chart (full width)                                 │
│  [Chart showing last 6 months]                              │
│                                                              │
├──────────────────────────────┬──────────────────────────────┤
│                              │                              │
│  Monthly Revenue Summary     │  Chèques non encaissés (3)  │
│                              │                              │
│  Current Month: €2,450       │  [Search box]                │
│  Last Month: €2,100          │                              │
│  Payment Breakdown           │  [✓] [Select All]            │
│                              │  [Encaisser sélection (0)]   │
│                              │                              │
│                              │  ┌────────────────────────┐  │
│                              │  │ □ Jean Dupont          │  │
│                              │  │   INV-001 | 50.00€     │  │
│                              │  │   15/01/2025           │  │
│                              │  │   Chèque n°123456      │  │
│                              │  │   [Encaisser]          │  │
│                              │  └────────────────────────┘  │
│                              │                              │
│                              │  ┌────────────────────────┐  │
│                              │  │ □ Marie Martin         │  │
│                              │  │   INV-002 | 65.00€     │  │
│                              │  │   10/01/2025 [Ancien]  │  │
│                              │  │   Chèque n°789012      │  │
│                              │  │   [Encaisser]          │  │
│                              │  └────────────────────────┘  │
│                              │                              │
└──────────────────────────────┴──────────────────────────────┘
```

## 💡 Tips & Tricks

### Writing Good Check Notes
✅ **Good examples:**
```
Chèque n°1234567 - Banque Populaire
Chèque n°ABC123 - Crédit Agricole - Signé par Jean Dupont
Chèque n°XYZ789 - BNP Paribas - Reçu le 15/01/2025
```

❌ **Avoid:**
```
cheque              (too vague)
123456              (no bank info)
payment received    (not specific)
```

### Using Search Effectively
Search looks in ALL these fields:
- Patient first name
- Patient last name
- Invoice number
- Check notes
- Amount

Examples:
- Search "123456" → Finds check number
- Search "Populaire" → Finds all Banque Populaire checks
- Search "Jean" → Finds all Jean's checks
- Search "50" → Finds all 50€ checks

### Selecting Multiple Checks
- Click individual checkboxes for specific checks
- Click **"Tout sélectionner"** to select ALL visible checks
- Use search first, then "Tout sélectionner" to select filtered results

### Old Check Warning
- Checks older than 30 days appear with yellow background
- Shows **"Ancien"** badge next to the date
- Helps you prioritize deposits (checks can expire!)

## 🔐 Security & Permissions

**Who can use this feature?**
- ✅ Osteopaths (full access)
- ✅ Assistants (full access)
- ✅ Admins (full access)
- ❌ Others (no access)

**What happens to the data?**
- Check deposit information stored securely in AWS
- Only visible to authorized users
- Encrypted in transit and at rest
- Compliant with GDPR

## ❓ Common Questions

**Q: What happens to checks after deposit?**
A: They disappear from the "Chèques non encaissés" list. The invoice remains marked as PAID.

**Q: Can I undo a deposit?**
A: Not currently. Future version may add this feature.

**Q: Can I see deposit history?**
A: Not yet. The feature tracks only undeposited checks currently.

**Q: What if I enter the wrong deposit date?**
A: You cannot set a future date. If you need to change a past date, contact an admin.

**Q: Can checks be deposited on different dates in bulk?**
A: No, all checks in a bulk operation get the same date. Use individual deposits for different dates.

**Q: How many checks can I deposit at once?**
A: No hard limit, but the system is optimized for typical volumes (dozens of checks).

**Q: What if a deposit fails?**
A: Error message appears at the top. The checks remain in the list. Fix the issue and retry.

**Q: Do I need to enter the bank name?**
A: Not required, but highly recommended in the notes field for your records.

## 🐛 Troubleshooting

### Check not appearing in the list?
✅ Verify:
1. Invoice status is "PAID" (not PENDING or DRAFT)
2. Payment method is "Chèque" (not Virement, Espèces, or Carte)
3. Page is refreshed (press F5)

### Can't click "Confirmer l'encaissement"?
✅ Check:
1. Date is selected (should default to today)
2. Date is not in the future
3. At least one check is selected

### Search not finding anything?
✅ Try:
1. Clear search and start over
2. Search with less specific terms
3. Check spelling
4. Refresh the page

### Error message appears?
✅ Actions:
1. Read the error message (it explains the problem)
2. Check your internet connection
3. Try again in a few seconds
4. If persists, contact support

## 📱 Mobile Usage

The check tracker works on mobile devices:
- Table scrolls horizontally on small screens
- All buttons accessible via touch
- Date picker uses native mobile picker
- Search works the same way

**Best practices on mobile:**
- Use landscape mode for better table view
- Search before selecting (easier than scrolling)
- Use quick deposit for single checks
- Use desktop for bulk operations (easier)

## 🎓 Training Video Script

*Coming soon: Video tutorial showing the complete workflow*

Planned topics:
1. Creating a check invoice (2 min)
2. Finding undeposited checks (1 min)
3. Using search and filters (2 min)
4. Individual deposit (1 min)
5. Bulk deposit (2 min)
6. Understanding old check warnings (1 min)

## 📞 Support

**Need help?**
- 📖 Read the full documentation: `docs/CHECK_DEPOSIT_TRACKING.md`
- 🧪 See test scenarios: `docs/CHECK_DEPOSIT_TESTING.md`
- 💻 View implementation details: `IMPLEMENTATION_SUMMARY.md`

**Found a bug?**
Report it on GitHub with:
- What you were trying to do
- What happened instead
- Steps to reproduce
- Screenshots if possible

**Feature request?**
Future enhancements are documented. Popular requests may be prioritized.

---

## ⚡ Power User Tips

1. **Keyboard shortcuts**: Use Tab to navigate, Enter to activate buttons

2. **Batch processing**: Search for specific bank, select all, deposit together

3. **Regular schedule**: Deposit checks weekly to avoid old check warnings

4. **Consistent naming**: Use the same format for check notes (easier to search)

5. **Pre-deposit preparation**: Review the list in the morning, deposit at the bank, confirm in the app when back

6. **Month-end reconciliation**: Clear all checks before closing the month

7. **Documentation**: Keep the check notes field updated with details you'll need later

---

*Quick Start Guide - Last updated: 2025-10-11*
