# Break Point Arena - Gaming Café Platform

Full-stack web platform for Break Point Arena gaming café with QR-based booking system.

## 🚀 Quick Start

```bash
# Install dependencies
pnpm install

# Copy environment variables
cp .env.example .env.local
# Fill in all required values in .env.local

# Run development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000)

## 📋 Tech Stack

- **Framework:** Next.js 15.1.3 (App Router)
- **Language:** TypeScript (relaxed mode)
- **Styling:** Tailwind CSS 4 + shadcn/ui  
- **State:** Redux Toolkit + TanStack Query
- **Database:** Supabase (PostgreSQL)
- **Payments:** Razorpay
- **SMS:** MSG91
- **Package Manager:** pnpm

## 📁 Project Structure

```
/app
  /(customer)       # Customer booking flows
  /(admin)          # Admin panel
  /api              # API routes (OTP, payments)
/components
  /ui               # shadcn components
  /booking          # Booking components
  /admin            # Admin components
/lib
  /redux            # Redux store & slices
  /supabase         # DB clients
  /razorpay         # Payment integration
  /msg91            # SMS integration
  /utils            # Utilities
```

## 🔑 Environment Setup

1. Create `.env.local` from `.env.example`
2. Add Supabase credentials
3. Add Razorpay test keys
4. Add MSG91 credentials
5. Add Upstash Redis credentials

See `.env.example` for full list of required variables.

## 👥 Team Workflow

**Team Lead:** Backend (API routes, integrations, server actions)  
**Junior Dev:** Frontend (UI, pages, forms, customer flows)

**Branches:**
- `main` → Production
- `staging` → UAT testing
- `feature/*` → Feature branches (auto-preview URLs)

**Development:**
```bash
pnpm lint          # Run ESLint
pnpm format        # Format with Prettier
pnpm type-check    # TypeScript check
```

## 📚 Documentation

See `/Doc` folder for complete project documentation:
- Requirements Document
- User Flows
- Epics & Jira Tickets
- Client Questions

## 🚢 Deployment

Deployed on Vercel with automatic deployments:
- Push to `main` → Production
- Push to `staging` → Staging environment  
- Pull requests → Preview URLs

## 📝 TODO

- [ ] Create Supabase migrations
- [ ] Complete MSG91 templates
- [ ] Add PWA manifest
- [ ] Implement admin auth
- [ ] Add loading states

## 📞 Project Info

**Client:** Break Point Arena  
**Timeline:** May 6 - June 4, 2026  
**Go-Live:** June 7, 2026

---

Built by WnR Advisory
