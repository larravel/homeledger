# Edge Cases

This file lists the main edge cases considered for the final HomeLedger scope.

## Authentication And Account

- Login with an incorrect email or password should not allow access to protected pages.
- Protected pages should redirect or block access when no JWT token is stored.
- Changing password should reject an empty current password, a short new password, or the same password as the current password.
- Deleting an account should remove the user's access and clear the local session.

## Bills

- A bill with missing required details should not be saved.
- A bill with zero or negative amount should be rejected by validation.
- Duplicate bill names/providers may exist, but each record remains separate by ID.
- Overdue bills should remain visible until paid or deleted.
- Paying a bill after the due date should still create a payment history record.

## Payments

- A payment should only be created for a bill owned by the logged-in user.
- Very large payment values should still format correctly in tables and dashboard summaries.
- Payment history should not double-count paid totals.
- Payment history should remain readable when there are no paid bills yet.

## Recurring Bills

- Generating recurring bills should avoid creating duplicate generated bills for the same schedule window.
- Recurring bills with missing or unsupported frequency should fall back to a safe default or fail validation.
- Deleting a recurring bill should not delete unrelated one-time bills.
- Generated bill dates should remain understandable in the recurring bill list.

## Expenses

- An expense with missing category, date, or amount should not be accepted.
- Zero or negative expense amounts should be rejected by validation.
- Expense filters should still show a clear empty state when no records match.
- Category totals should update after editing or deleting an expense.

## Budgeting

- Budget categories should normalize similar values such as `utility` and `utilities`.
- A budget limit must be greater than zero.
- Deleting a budget while editing it should clear the edit form.
- Budget status should remain understandable when there are no matching bills or expenses.
- Dashboard budget summaries should fall back safely when no budgets are saved.

## Settings And Preferences

- Preferences should apply locally even if the database sync temporarily fails.
- Saved theme should apply across protected pages.
- Currency and decimal preferences should affect displayed money values.
- Date format preference should affect displayed dates.
- Settings should load from the database when available and use local cache as a fallback.
