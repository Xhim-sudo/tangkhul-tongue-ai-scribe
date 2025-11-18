# English-Tangkhul Translation Platform MVP

A production-grade, mobile-first translation platform for English ↔ Tangkhul with community-powered contributions, weighted review workflows, and real-time translation API.

## 🚀 Quick Start

```bash
# Install dependencies
npm ci

# Run locally
npm run dev

# Build for production
npm run build
```

## 📋 Features

- **Real-time Translation API** with multi-tier matching (cache → exact → consensus → fuzzy)
- **Mobile-first UI** with bottom navigation, swipeable cards, and responsive design
- **Community Contributions** with weighted review and promotion workflow
- **Role-based Access Control**: Admin, Expert, Reviewer, Contributor
- **Analytics & Caching** for performance optimization
- **200+ Seeded Phrases** covering greetings, numbers, family, emergency, travel

## 🏗️ Architecture

### Frontend
- React 18 + TypeScript
- TailwindCSS + shadcn/ui
- Framer Motion for animations
- React Query for data fetching

### Backend
- Supabase (PostgreSQL + Edge Functions)
- Row-Level Security (RLS) policies
- pg_trgm for fuzzy text matching
- Translation cache with hit tracking

### Edge Functions
- `translate-text-v2`: Enhanced translation with multiple fallback strategies
- `health`: System health check endpoint
- `resolve-staff-login`: Staff authentication

## 🗄️ Database Schema

### Core Tables
- `profiles`: User profiles with roles
- `training_entries`: Community-contributed translations
- `canonical_texts`: Normalized text storage
- `translation_cache`: Fast lookup cache
- `translation_consensus`: Weighted voting and promotion
- `translation_analytics`: Usage tracking
- `accuracy_metrics`: Contributor accuracy scores

## 🔧 Environment Variables

```env
VITE_SUPABASE_URL=https://xaboacjkzhmzzsinxwcp.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key (server-side only)
NODE_ENV=production
```

## 📦 Deployment

### Lovable.dev (Primary)
```bash
# Automatic deployment on push
npm run build
# Lovable handles deployment
```

### Supabase Edge Functions
```bash
# Deploy edge functions
supabase functions deploy translate-text-v2 --project-ref xaboacjkzhmzzsinxwcp
supabase functions deploy health --project-ref xaboacjkzhmzzsinxwcp
```

### Database Migration & Seed
```bash
# Apply migrations via Lovable AI migration tool
# Then seed data via SQL editor or psql
psql $DATABASE_URL < supabase/seed.sql
```

## 🧪 QA & Testing

### Smoke Tests
1. **Sign In** as contributor → Submit phrase
2. **Sign In** as reviewer → Approve entry
3. **Translate** approved phrase → Verify method & confidence
4. **Cache Hit** → Repeat translation < 120ms
5. **Analytics** → Confirm log entry

### Demo Accounts
- `demo_admin@company.test` (Admin)
- `demo_reviewer@company.test` (Reviewer)
- `demo_contrib@company.test` (Contributor)
- Password: `Demo123!` (rotate after demo)

### Health Check
```bash
curl https://xaboacjkzhmzzsinxwcp.supabase.co/functions/v1/health | jq
```

## 🔐 Security

- Row-Level Security (RLS) on all tables
- Service keys secured server-side only
- Role-based access control via `has_role()` function
- Email & Google OAuth authentication

## 📊 Translation API

### Endpoint
`POST /functions/v1/translate-text-v2`

### Request
```json
{
  "text": "How are you?",
  "source_language": "english",
  "target_language": "tangkhul"
}
```

### Response
```json
{
  "translated_text": "Khonui phung?",
  "confidence_score": 95,
  "method": "consensus",
  "metadata": {
    "cached": false,
    "alternatives": []
  },
  "response_time_ms": 247
}
```

### Translation Methods (Priority Order)
1. **cache**: Previously translated (< 120ms)
2. **exact**: Exact normalized match (95% confidence)
3. **consensus**: Weighted community agreement (≥75% confidence)
4. **fuzzy**: pg_trgm similarity match (60-85% confidence)
5. **partial**: Word-by-word token match (40-70% confidence)
6. **static**: Fallback to 40 common phrases (emergency only)

## 🏅 Reviewer Workflow

1. **Submit Entry**: Contributor adds translation
2. **Review Queue**: Reviewers see pending entries
3. **Weighted Vote**: Expert ×3, Reviewer ×2, Contributor ×1
4. **Auto-Promote**: weighted_agreement_score ≥ 0.75 + votes ≥ 3
5. **Golden Data**: High-accuracy entries marked for priority

## 📱 Mobile UI

- **Bottom Navigation**: Translate, Contribute, Accuracy, Profile
- **Swipeable Cards**: Review translations with swipe gestures
- **Collapsible Header**: Auto-hide on scroll
- **Skeleton Loaders**: Smooth loading states
- **Touch-optimized**: 44px minimum tap targets

## 🚨 Fallback Strategy

If edge functions fail:
1. Try `translate-text-v2` → fallback to `translate-text` (v1)
2. Use `staticSeedLookup()` for 40 common phrases
3. Display "Translation unavailable" with offline badge

## 📈 Performance Targets

- **Cache Hit**: < 120ms
- **Cache Miss**: < 750ms
- **99th Percentile**: < 1200ms
- **Uptime**: 99.5%

## 🔗 Links

- **Lovable Project**: https://lovable.dev/projects/07690966-0beb-47aa-b1fd-8fb9c9fdc236
- **Supabase Dashboard**: https://supabase.com/dashboard/project/xaboacjkzhmzzsinxwcp
- **Edge Function Logs**: https://supabase.com/dashboard/project/xaboacjkzhmzzsinxwcp/functions

## 📞 Support

- **Escalation**: @Founder (Jihal)
- **Fallback**: Deploy on Vercel if Lovable fails
- **Emergency**: Use static seed fallback (40 phrases)

---

**Last Updated**: 2025-11-18 | **Version**: 1.0.0 | **Status**: Production-Ready MVP
