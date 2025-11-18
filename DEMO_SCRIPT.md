# 2-Minute Demo Script - Tangkhul Translation MVP

## Setup (30 seconds)
1. **Open App**: https://tangkhul-translator.lovable.app
2. **Demo Accounts Ready**:
   - demo_contrib@company.test / Demo123!
   - demo_reviewer@company.test / Demo123!
   - demo_admin@company.test / Demo123!

## Demo Flow (90 seconds)

### Part 1: Translation (20 seconds)
```
1. Go to Translate tab
2. Type: "How are you?"
3. Select: English → Tangkhul
4. Click Translate
5. SHOW: Result "Khonui phung?" with 95% confidence, method: "consensus"
6. Click Translate again → SHOW: cache_hit badge, < 120ms response
```

### Part 2: Community Contribution (25 seconds)
```
1. Sign in as demo_contrib@company.test
2. Go to Contribute tab
3. Add Entry:
   - English: "Where is the market?"
   - Tangkhul: "Keithel kharei phung?"
   - Category: Travel
4. Submit
5. SHOW: "Pending review" status
```

### Part 3: Reviewer Workflow (25 seconds)
```
1. Sign out, sign in as demo_reviewer@company.test
2. Go to Accuracy tab → Review Queue
3. Swipe right on "Where is the market?" entry
4. SHOW: Weighted vote recorded (Reviewer ×2)
5. Sign in as demo_admin@company.test
6. Approve same entry (Expert ×3)
7. SHOW: Auto-promoted to "approved" (weighted_score ≥ 0.75)
```

### Part 4: Verify Promotion (20 seconds)
```
1. Go back to Translate tab
2. Type: "Where is the market?"
3. Translate
4. SHOW: Returns "Keithel kharei phung?" 
5. SHOW: method: "consensus", confidence: 85%
6. Check Analytics → SHOW: translation logged
```

## Key Highlights to Point Out

### Technical Excellence
- ✅ **Multi-tier Fallback**: Cache → Exact → Consensus → Fuzzy → Static
- ✅ **Sub-second Response**: < 120ms cache hits, < 750ms cold
- ✅ **Weighted Voting**: Expert ×3, Reviewer ×2, Contributor ×1
- ✅ **Auto-promotion**: Consensus at ≥75% agreement + 3 votes
- ✅ **200+ Seeded Phrases**: Greetings, numbers, family, emergency, travel

### Mobile-First UX
- ✅ **Bottom Navigation**: Instant tab switching
- ✅ **Swipeable Review**: Tinder-style approve/reject
- ✅ **Responsive Design**: Works on all devices
- ✅ **Skeleton Loaders**: Smooth loading states
- ✅ **Offline Fallback**: 40 static phrases work without connection

### Production-Ready
- ✅ **RLS Security**: All tables protected
- ✅ **Analytics**: Every translation logged
- ✅ **Health Check**: `/health` endpoint monitors DB + cache
- ✅ **Rollback Ready**: Migrations tracked and reversible
- ✅ **Lovable Deploy**: One-click deployment

## Backup Scenarios

### If Edge Function Fails
```
1. SHOW: Static fallback working for "Hello" → "Ngala"
2. EXPLAIN: 40 critical phrases work offline
3. SHOW: "Translation unavailable" for non-cached phrases
```

### If Database is Slow
```
1. SHOW: Skeleton loaders while loading
2. EXPLAIN: Optimistic UI updates
3. SHOW: Cached translations still fast
```

## Closing Points (5 seconds)

> "We have a **production-ready MVP** with:
> - Real-time translation API with 5-tier fallback
> - Mobile-first UI with weighted review workflow
> - 200+ seeded phrases, ready for 10,000+ scale
> - Deployed on Lovable, monitored via health checks
> 
> **Ready to onboard beta users today.**"

## Health Check (for technical audience)
```bash
curl https://xaboacjkzhmzzsinxwcp.supabase.co/functions/v1/health | jq

# Expected Output:
{
  "status": "healthy",
  "checks": {
    "database": "healthy",
    "cache": "healthy",
    "edge_function": "healthy"
  },
  "version": "1.0.0"
}
```

---

**Total Time**: 2 minutes
**Result**: Fully working end-to-end demo showcasing translation, contribution, review, and promotion workflow
