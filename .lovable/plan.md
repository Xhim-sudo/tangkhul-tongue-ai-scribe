

## Plan: Add Reviews to Admin, Fix Auth & Deploy-Ready

### What will be done

1. **Add Reviews tab to the Admin Panel** -- embed the existing ReviewerWorkflow component as a new "Reviews" tab so admins can review submissions directly from the admin interface.

2. **Fix broken Approvals tab** -- the `user_approvals` table has no `phone_number` column, but the code references `approval.phone_number`. This causes a crash. The approvals UI will be updated to work with the actual schema.

3. **Fix golden data marking** -- ReviewerWorkflow tries to UPDATE `training_submissions_log.is_golden_data`, but there is no UPDATE RLS policy on that table. A database migration will add an UPDATE policy for admins/reviewers.

4. **Admin password** -- jihalshimray1@gmail.com already has the `admin` role in the database. However, passwords are managed by the authentication system and cannot be set directly via code. You will need to use the "Forgot Password" flow on the login page (which we will add) to reset it to `000000`.

5. **Add Forgot Password flow** -- add a "Forgot Password" link to the login page and a `/reset-password` page so you can reset the admin password.

6. **Production cleanup** -- remove `console.log` / `console.error` statements from ReviewerWorkflow and Navigation.

---

### Technical Details

**Files to modify:**

- `src/components/AdminPanel.tsx` -- Add a "Reviews" tab that renders `<ReviewerWorkflow />`
- `src/components/AdminPanel.tsx` -- Fix approvals section to not reference `phone_number` (column doesn't exist on `user_approvals`)
- `src/components/ReviewerWorkflow.tsx` -- Remove `console.log`/`console.error` statements
- `src/components/Navigation.tsx` -- Remove `console.error` in signOut
- `src/components/AuthPage.tsx` -- Add "Forgot Password" link that calls `supabase.auth.resetPasswordForEmail`
- `src/pages/ResetPassword.tsx` -- New page at `/reset-password` route to handle password update
- `src/App.tsx` -- Add `/reset-password` route

**Database migration:**
```sql
-- Allow admins/reviewers to UPDATE training_submissions_log (for golden data marking)
CREATE POLICY "Admins can update submissions"
ON public.training_submissions_log
FOR UPDATE TO authenticated
USING (check_user_role(auth.uid(), 'admin'::app_role));
```

**Admin Panel tab additions:**
- Add `CheckSquare` icon import for Reviews tab
- Add `TabsTrigger` for "reviews" in the tabs list
- Add `TabsContent` rendering `<ReviewerWorkflow />`

**Approvals fix:**
- Remove `phone_number` references from approval handling since the column doesn't exist
- Show user email instead of phone for notifications

