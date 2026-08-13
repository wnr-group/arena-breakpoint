# MSG91 OTP Setup Guide for Breakpoint Arena

## 🚀 Quick Start (Test Mode - No MSG91 Needed)

You can start testing OTP flow immediately without MSG91 credentials:

### 1. Enable Test Mode

Add to your `.env.local`:

```env
# Enable test mode - OTP will be logged to console instead of SMS
MSG91_TEST_MODE=true
SESSION_SECRET=your-random-32-character-secret-key-here
```

Generate a session secret:
```bash
# Generate random 32-character secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 2. Run Database Migration

```bash
# If using Supabase CLI
supabase db push

# Or apply the migration manually in Supabase dashboard:
# Go to SQL Editor and run: supabase/migrations/20260630000000_create_otp_sessions.sql
```

### 3. Test the Flow

1. Start your dev server: `npm run dev`
2. Go to booking or food order flow
3. Enter phone number
4. **Check your terminal/console** - you'll see the OTP printed there!
5. Enter the OTP from console
6. Flow continues normally

**In test mode, OTP will look like this in your console:**
```
============================================================
📱 MSG91 TEST MODE - OTP NOT SENT TO REAL PHONE
============================================================
Phone: +91 9876543210
OTP: 123456
============================================================
⚠️  In production, set MSG91_TEST_MODE=false and configure MSG91
============================================================
```

---

## 📲 Production Setup with MSG91

When you're ready for real SMS:

### Step 1: Get MSG91 Auth Key

#### Option A: Simple Setup (Recommended)

1. Login to https://control.msg91.com/
2. Look for **"SendOTP"** in left sidebar
   - If not visible, go to **Products** → Enable **SendOTP**
3. In SendOTP section, go to **Settings** or **Configuration**
4. Copy your **Auth Key**
5. Done! SendOTP doesn't need templates

#### Option B: Advanced Setup (Template-based)

1. Login to https://control.msg91.com/
2. Go to **Settings** → **API Keys**
3. Copy your **Authkey**
4. Go to **SMS** → **Templates**
5. Create OTP template:
   ```
   Template Name: Breakpoint Arena OTP
   Message: Your OTP for Breakpoint Arena is ##OTP##. Valid for 5 minutes. Do not share with anyone.
   Template Type: OTP/Transactional
   ```
6. Copy the **Template ID** after approval

### Step 2: Configure Environment

Update your `.env.local`:

#### For SendOTP API (Simpler):
```env
# Disable test mode
MSG91_TEST_MODE=false

# MSG91 SendOTP Configuration
MSG91_AUTH_KEY=your-auth-key-from-sendotp-section
MSG91_USE_SENDOTP_API=true
MSG91_SENDER_ID=BRKPNT

# Session Secret (generate using command above)
SESSION_SECRET=your-random-32-character-secret-key
```

#### For Flow API (Template-based):
```env
# Disable test mode
MSG91_TEST_MODE=false

# MSG91 Flow API Configuration
MSG91_AUTH_KEY=your-auth-key-here
MSG91_USE_SENDOTP_API=false
MSG91_TEMPLATE_ID_OTP=your-template-id-here
MSG91_SENDER_ID=BRKPNT

# Session Secret
SESSION_SECRET=your-random-32-character-secret-key
```

### Step 3: Test Production

1. Restart your server
2. Try booking/food order with real phone number
3. You should receive SMS with OTP!

---

## 🔧 Configuration Options

### OTP Settings (in `.env`)

```env
# OTP Expiry (default: 5 minutes)
OTP_EXPIRY_MINUTES=5

# Max OTP verification attempts (default: 3)
OTP_MAX_ATTEMPTS=3

# Max OTP requests per phone per hour (default: 3)
OTP_MAX_REQUESTS_PER_PHONE=3

# Session expiry after OTP verification (hard-coded: 15 minutes)
# Users don't need OTP again if they return within 15 minutes
```

---

## 🎯 How It Works

### Flow Diagram

```
User enters phone → Check active session?
                    ↓ YES (within 15 min)
                    ├──→ Skip OTP, proceed directly
                    ↓ NO
                    ├──→ Send OTP via MSG91
                    ├──→ User enters OTP
                    ├──→ Verify OTP
                    ├──→ Create 15-min session
                    └──→ Proceed to booking/order
```

### Rate Limiting

- **3 OTP requests per phone per hour**
- **60-second cooldown between resends**
- **3 verification attempts per OTP**
- **5-minute OTP expiry**

### Session Management

- **15-minute session** after successful OTP verification
- Session stored in `otp_sessions` table
- Secure session token (64 characters, hex)
- Auto-cleanup of expired sessions

---

## 🧪 Testing Checklist

### Test Mode Tests
- [ ] Phone number entry
- [ ] OTP displayed in console
- [ ] OTP verification works
- [ ] 15-minute session persists
- [ ] Second booking skips OTP (within 15 min)

### Production Tests
- [ ] Real SMS received
- [ ] OTP verification works
- [ ] Invalid OTP shows error
- [ ] Resend OTP works (60s cooldown)
- [ ] Max attempts protection works
- [ ] Rate limiting works (3 per hour)
- [ ] Session persistence works

---

## 📊 Database Schema

The `otp_sessions` table stores:
- Phone number
- Hashed OTP (secure)
- Session token
- Expiry times
- Rate limiting data

View with:
```sql
SELECT * FROM otp_sessions WHERE phone = '9876543210' ORDER BY created_at DESC;
```

---

## 🐛 Troubleshooting

### "MSG91 configuration missing"
- Check `MSG91_AUTH_KEY` in `.env.local`
- Restart server after adding env vars

### "OTP not received"
- Check phone number format (10 digits, no +91)
- Verify MSG91 account has SMS credits
- Check MSG91 dashboard for delivery status
- Enable test mode to verify flow works

### "Session expired" immediately
- Check `SESSION_SECRET` is set (32+ characters)
- Verify database migration ran successfully

### "Rate limit exceeded"
- Wait 1 hour or clear `otp_sessions` table
- In test: `DELETE FROM otp_sessions WHERE phone = 'YOUR_PHONE';`

### OTP in console not showing (test mode)
- Verify `MSG91_TEST_MODE=true` in `.env.local`
- Check server console (not browser console)
- Restart dev server

---

## 🔐 Security Features

✅ OTP hashed with SHA-256 + salt  
✅ Session tokens cryptographically random  
✅ Rate limiting (3 requests/hour)  
✅ Auto-expire old sessions  
✅ IP address logging  
✅ Max verification attempts  

---

## 📝 Integrated Flows

OTP is integrated into:

1. **Booking Flow** (`/booking/auth`)
   - Phone → OTP → Customer Details → Summary → Payment

2. **Food Order Flow** (`/food/checkout`)
   - Cart → Phone → OTP → Customer Details → Confirm

3. **Subscription Flow** (coming soon)
   - Plan Selection → Phone → OTP → Payment

---

## 💡 Tips

- **Test mode is perfect for development** - no SMS costs
- **Use SendOTP API** - simpler than Flow API
- **Monitor rate limits** in production
- **Session caching** reduces OTP requests
- **Check Supabase logs** for debugging

---

## 🆘 Support

If you encounter issues:

1. Check this guide
2. Enable test mode to isolate MSG91 issues
3. Check Supabase logs: `supabase logs`
4. Check MSG91 dashboard delivery logs
5. Review console for error messages

---

## ✅ Quick Checklist

**For Testing (No MSG91):**
- [ ] Add `MSG91_TEST_MODE=true` to `.env.local`
- [ ] Add `SESSION_SECRET` to `.env.local`
- [ ] Run database migration
- [ ] Start dev server
- [ ] Test booking/food flow
- [ ] Check console for OTP

**For Production:**
- [ ] Get MSG91 Auth Key
- [ ] Add credentials to `.env.local`
- [ ] Set `MSG91_TEST_MODE=false`
- [ ] Set `MSG91_USE_SENDOTP_API=true`
- [ ] Test with real phone
- [ ] Verify SMS received
- [ ] Test full flow

---

**Next Steps:**
1. Start with test mode
2. Test all flows (booking, food)
3. When ready, get MSG91 credentials
4. Switch to production mode
5. Test with real SMS

Good luck! 🚀
