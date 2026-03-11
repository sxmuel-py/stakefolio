# Supabase Setup Guide

This guide will walk you through setting up Supabase for the BetManager Pro application.

## Prerequisites

- Node.js 18+ installed
- A Supabase account (sign up at [supabase.com](https://supabase.com))
- Git installed

## Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click "New Project"
3. Fill in the details:
   - **Name**: `betmanager-pro`
   - **Database Password**: Choose a strong password (save this!)
   - **Region**: Choose closest to your users
   - **Pricing Plan**: Start with Free tier

4. Wait for the project to be created (2-3 minutes)

## Step 2: Get Your API Keys

1. In your Supabase project dashboard, go to **Settings** → **API**
2. Copy the following:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **anon public** key (starts with `eyJ...`)

## Step 3: Configure Environment Variables

1. In the `frontend` directory, create `.env.local`:

```bash
cd frontend
cp .env.local.example .env.local
```

2. Edit `.env.local` and add your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Step 4: Run Database Migrations

### Option A: Using Supabase Dashboard (Recommended for beginners)

1. Go to your Supabase project dashboard
2. Click **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy the entire contents of `supabase/migrations/20260203_initial_schema.sql`
5. Paste into the SQL editor
6. Click **Run** (bottom right)
7. Verify no errors appear

### Option B: Using Supabase CLI (Advanced)

1. Install Supabase CLI:
```bash
npm install -g supabase
```

2. Link your project:
```bash
cd betting-management
supabase link --project-ref your-project-id
```

3. Run migrations:
```bash
supabase db push
```

## Step 5: Configure Authentication

1. In Supabase dashboard, go to **Authentication** → **Providers**
2. Enable **Email** provider (should be enabled by default)
3. Go to **Authentication** → **URL Configuration**
4. Set **Site URL**: `http://localhost:3000` (for development)
5. Add **Redirect URLs**:
   - `http://localhost:3000`
   - `http://localhost:3000/auth/callback`
   - Add your production URLs when deploying

## Step 6: Configure Email Templates (Optional)

1. Go to **Authentication** → **Email Templates**
2. Customize the email templates:
   - **Confirm signup**
   - **Magic Link**
   - **Change Email Address**
   - **Reset Password**

## Step 7: Set Up Row Level Security (RLS)

RLS policies are already included in the migration script. To verify:

1. Go to **Authentication** → **Policies**
2. You should see policies for:
   - `users`
   - `bookies`
   - `bets`
   - `bankroll_transactions`
   - `user_follows`
   - `betting_tips`
   - `tip_likes`

## Step 8: Install Frontend Dependencies

```bash
cd frontend
npm install
```

This will install:
- `@supabase/supabase-js` - Supabase JavaScript client
- `@supabase/auth-helpers-nextjs` - Next.js auth helpers
- `decimal.js` - For precise financial calculations

## Step 9: Test the Connection

1. Start the development server:
```bash
npm run dev
```

2. Open `http://localhost:3000`
3. Try to sign up with a test account
4. Check Supabase dashboard → **Authentication** → **Users** to see if the user was created

## Step 10: Verify Database Tables

1. Go to **Table Editor** in Supabase dashboard
2. You should see these tables:
   - `users`
   - `bookies`
   - `bets`
   - `bankroll_transactions`
   - `user_follows`
   - `betting_tips`
   - `tip_likes`

## Security Checklist

Before going to production, ensure:

- [ ] All tables have RLS enabled
- [ ] Service role key is NEVER exposed in frontend code
- [ ] Email verification is enabled
- [ ] Strong password policy is configured
- [ ] HTTPS is enabled for all URLs
- [ ] Redirect URLs are properly configured
- [ ] Database backups are enabled (automatic in paid plans)

## Common Issues & Solutions

### Issue: "Invalid API key"
**Solution**: Double-check your `.env.local` file has the correct `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Issue: "Row Level Security policy violation"
**Solution**: Ensure RLS policies are created correctly. Re-run the migration script.

### Issue: "User not found after signup"
**Solution**: Check that the `users` table insert trigger is working. The user should be created in both `auth.users` and `public.users`.

### Issue: "Cannot read properties of undefined"
**Solution**: Make sure environment variables are loaded. Restart the dev server after changing `.env.local`.

## Enabling Multi-Factor Authentication (MFA)

For production, enable MFA:

1. Go to **Authentication** → **Settings**
2. Scroll to **Multi-Factor Authentication**
3. Enable **TOTP (Time-based One-Time Password)**
4. Users can then enable MFA in their profile settings

## Monitoring & Analytics

1. Go to **Reports** in Supabase dashboard
2. Monitor:
   - API requests
   - Database performance
   - Auth activity
   - Storage usage

## Upgrading to Production

When ready for production:

1. **Upgrade Supabase Plan**: Consider Pro plan ($25/month) for:
   - Daily backups
   - Point-in-time recovery
   - Better performance
   - No pausing

2. **Update Environment Variables**:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-production-anon-key
   NEXT_PUBLIC_APP_URL=https://yourdomain.com
   ```

3. **Configure Custom Domain** (optional):
   - Go to **Settings** → **Custom Domains**
   - Add your domain and follow DNS instructions

4. **Enable Database Backups**:
   - Automatic in Pro plan
   - Configure backup retention period

5. **Set up Monitoring**:
   - Configure email alerts for errors
   - Set up logging

## Next Steps

- [ ] Test all authentication flows
- [ ] Create test bookies and bets
- [ ] Verify RLS policies work correctly
- [ ] Test realtime subscriptions
- [ ] Deploy to production

## Support

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Discord](https://discord.supabase.com)
- [GitHub Issues](https://github.com/supabase/supabase/issues)
