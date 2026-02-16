

## Comprehensive Production Fix Plan

### Phase 1: Fix Data Saving - Critical

**Problem**: Mobile and Desktop forms save to different tables with different schemas.

**Solution**: Unify all submissions to use `training_submissions_log` table.

1. **Fix `src/hooks/useTranslation.ts`**:
   - Update `submitTrainingData` function to insert into `training_submissions_log` (not `training_entries`)
   - Use correct column names: `category_id` (UUID), `linguistic_notes` (for context), `grammar_features` (JSON for tags)
   - Remove references to non-existent columns (`category`, `context`, `tags`)

2. **Fix `src/components/mobile/TrainingScreenMobile.tsx`**:
   - Fetch categories from database dynamically (like desktop does)
   - Pass `category_id` (UUID) instead of category name string
   - Show real user stats instead of hardcoded values
   - Add offline queue support (like desktop has)

### Phase 2: Fix RLS Policy - Critical

**Problem**: `has_role(uuid, unknown)` function signature doesn't match actual function.

**Solution**: Database migration to fix the RLS policy:

```sql
-- Drop the broken policy
DROP POLICY IF EXISTS "Anyone can insert error logs" ON error_logs;
DROP POLICY IF EXISTS "Users can insert error logs" ON error_logs;

-- Create a permissive insert policy for authenticated users
CREATE POLICY "Authenticated users can insert error logs" ON error_logs
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- Recreate admin view policy with correct function
DROP POLICY IF EXISTS "Admins can view all error logs" ON error_logs;
CREATE POLICY "Admins can view all error logs" ON error_logs
  FOR SELECT TO authenticated
  USING (check_user_role(auth.uid(), 'admin'));
```

### Phase 3: Unify Mobile and Desktop Experience

1. **Create shared submission hook** (`src/hooks/useSubmission.ts`):
   - Single source of truth for all training data submissions
   - Handles offline queue
   - Proper error handling and toast notifications

2. **Update `TrainingScreenMobile.tsx`**:
   - Replace hardcoded stats header with real data from `training_submissions_log`
   - Add loading states
   - Improve form validation

3. **Update `TrainingForm.tsx`**:
   - Use the new shared submission hook
   - Remove duplicate submission logic

### Phase 4: Improve Mobile UX for Production

1. **Fix sticky header overlap** in `TrainingScreenMobile.tsx`:
   - Stats header sticks at `top-14` which may overlap with mobile header at `top-0`
   - Add proper z-index and spacing

2. **Add proper loading and error states**:
   - Show skeleton loaders while fetching
   - Show meaningful error messages when submissions fail

3. **Add form persistence**:
   - Save draft to localStorage to prevent data loss

### Phase 5: Connection Resilience

1. **Add retry logic** for database operations:
   - Catch connection termination errors
   - Automatic retry with exponential backoff
   - Graceful fallback to offline mode

2. **Improve auth session handling**:
   - Handle refresh token errors gracefully
   - Auto-redirect to login on session expiry

### Files to Modify:
- `src/hooks/useTranslation.ts` - Fix submitTrainingData to use correct table/columns
- `src/components/mobile/TrainingScreenMobile.tsx` - Complete rewrite with real data
- `src/hooks/useSubmission.ts` - New unified submission hook
- `src/components/training/TrainingForm.tsx` - Use shared hook
- Database migration for RLS fix

### Expected Outcome:
- All submissions (mobile + desktop) save to `training_submissions_log`
- Real user stats displayed
- Proper error handling throughout
- Consistent behavior across all devices
- Production-ready stability

