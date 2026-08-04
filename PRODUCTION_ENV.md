# Production Environment Variables

## ✅ Supabase Deployment Complete!

Your database has been successfully deployed to Supabase production:
- **Project Reference**: `zryhbmawjiubeiksatmf`
- **Region**: `ap-south-1` (Mumbai)
- **Database Host**: `db.zryhbmawjiubeiksatmf.supabase.co`
- **Status**: ACTIVE_HEALTHY

### Database Status
- ✅ All 19 migrations applied successfully
- ✅ Seed data inserted (device types, devices, menu items, promo codes, sample customers)
- ✅ Admin user created
- ✅ Service role permissions granted

## Production Environment Variables

Add these to your deployment platform (Vercel, etc.):

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://zryhbmawjiubeiksatmf.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpyeWhibWF3aml1YmVpa3NhdG1mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIyNzg3MjUsImV4cCI6MjA5Nzg1NDcyNX0.bp1jv-WRoAfZempQsIOJaDFKL6ajXR3cqqMzaO8nB18
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpyeWhibWF3aml1YmVpa3NhdG1mIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjI3ODcyNSwiZXhwIjoyMDk3ODU0NzI1fQ.MvHkPWF_hLFEYJaP5ayINyYkOiirx4eBcPt8sSgMyC0

# Razorpay Configuration (Test or Live)
NEXT_PUBLIC_RAZORPAY_KEY_ID=your-razorpay-key-id
RAZORPAY_KEY_SECRET=your-razorpay-key-secret
RAZORPAY_WEBHOOK_SECRET=your-razorpay-webhook-secret

# MSG91 Configuration
MSG91_AUTH_KEY=your-msg91-auth-key
MSG91_SENDER_ID=your-msg91-sender-id
MSG91_TEMPLATE_ID_OTP=your-otp-template-id
MSG91_TEMPLATE_ID_BOOKING=your-booking-confirmation-template-id
MSG91_TEMPLATE_ID_SUBSCRIPTION=your-subscription-confirmation-template-id

# Application Configuration
NEXT_PUBLIC_APP_URL=https://your-production-domain.com
NEXT_PUBLIC_CAFE_NAME="Break Point Arena"

# Session Configuration
SESSION_SECRET=your-random-session-secret-min-32-chars
SESSION_EXPIRY_DAYS=7

# OTP Configuration
OTP_EXPIRY_MINUTES=5
OTP_MAX_ATTEMPTS=3
OTP_MAX_REQUESTS_PER_PHONE=3

# Booking Configuration
SLOT_LOCK_MINUTES=10
LATE_ARRIVAL_GRACE_MINUTES=15
ADVANCE_BOOKING_DAYS=7
```

## Next Steps

### 1. Deploy to Vercel (or your platform)
```bash
# If using Vercel CLI
vercel --prod

# Or push to your main branch for automatic deployment
git push origin main
```

### 2. Add Environment Variables to Vercel
Go to your Vercel project settings:
1. Navigate to Settings → Environment Variables
2. Add all the variables from above
3. Make sure they're set for Production environment
4. Redeploy if needed

### 3. Configure Razorpay & MSG91
- Get your production keys from Razorpay dashboard
- Get your MSG91 credentials and template IDs
- Update the environment variables

#### 3a. Razorpay webhook (REQUIRED — do not skip)

Online payments are only half-safe without this. If a customer pays and closes
the tab before the browser can call back, the webhook is what creates their
booking. Skip it and that money is taken with nothing to show for it.

1. Razorpay Dashboard → Settings → Webhooks → **Add New Webhook**
2. URL: `https://your-production-domain.com/api/payment/webhook`
3. Active Events: **`payment.captured`**
4. Set a secret, then put the same value in `RAZORPAY_WEBHOOK_SECRET`
5. Verify: the endpoint must return `503 {"error":"Webhook not configured"}`
   when the secret is missing, and `400` on a bad signature. If you get a 503 in
   production, the safety net is off.

#### 3b. Enable auto-capture (REQUIRED)

Razorpay Dashboard → Settings → Payment Capture → **Automatic**.

Fulfilment only accepts `captured` payments. With manual capture, payments sit
as `authorized`, no booking is ever created, and the authorisation voids after
about 5 days.

### 4. Update Auth Redirect URLs in Supabase
Go to: https://supabase.com/dashboard/project/zryhbmawjiubeiksatmf/auth/url-configuration

Add your production URL:
- Site URL: `https://your-production-domain.com`
- Redirect URLs: `https://your-production-domain.com/**`

### 5. Test Your Deployment
- Test customer booking flow
- Test admin login (username: admin, password: admin123)
- Test QR code scanning
- Test payment integration
- Test SMS notifications

## Database Management

### View Data in Supabase Studio
https://supabase.com/dashboard/project/zryhbmawjiubeiksatmf

### Run Queries
```bash
# Query production database
supabase db query --linked "SELECT * FROM devices LIMIT 5;"
```

### Future Migrations
```bash
# Create a new migration
supabase migration new <migration_name>

# Push to production (after testing locally)
supabase db push --linked
```

## Admin Credentials
**Username**: `admin`
**Password**: `admin123`

⚠️ **IMPORTANT**: Change the admin password immediately in production!

## Support & Documentation
- Supabase Dashboard: https://supabase.com/dashboard/project/zryhbmawjiubeiksatmf
- API Documentation: https://supabase.com/dashboard/project/zryhbmawjiubeiksatmf/api
- Database: https://supabase.com/dashboard/project/zryhbmawjiubeiksatmf/editor

---

**Deployment Date**: June 24, 2026
**Deployed By**: Supabase CLI v2.107.0
