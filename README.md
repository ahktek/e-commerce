# ZARE - Premium E-Commerce Storefront

ZARE is a high-fidelity, premium fashion & essentials e-commerce application designed with a modern editorial aesthetic. Built using Next.js App Router, Supabase (Postgres & Auth), Stripe Elements, Framer Motion, and Vanilla CSS.

![ZARE Storefront Mockup](https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&auto=format&fit=crop&q=80)

## Features

- ✨ **Sticky Glassmorphic Header**: Interactive header with full-screen search, shopping bag counters, wishlist links, and collapsible drawer for mobile viewports.
- ⚡ **Snappy Hero Carousel**: Multi-campaign slider utilizing Embla Carousel featuring auto-advancing slides, interactive tag chips, and visual price highlights.
- 🛍️ **Slide-in Shopping Bag**: Smooth right-aligned drawer panel with item quantity steppers (+/-), out-of-stock badge validations, and dynamic subtotal calculations.
- 🌀 **Tactile Micro-interactions**: Hardware-accelerated hover zooms, slide-up quick actions, and route transitions using Framer Motion (under 250ms).
- 🔐 **Supabase Authentication**: Secure email/password login, automatic user profiles, and protected account directories for saved addresses and wishlist management.
- 💳 **Stripe Checkout**: PCI-compliant payment collection utilizing Stripe Elements (hosted fields) with server-side price verification against SQL tables and atomic stock decrement transactions.
- 📊 **Admin Portal**: Restricted-access portal featuring a sales dashboard, product CRUD management, and order transaction logs.

## Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router, Turbopack)
- **Database & Auth**: [Supabase](https://supabase.com/) (Postgres, Row Level Security, SSR Session cookies)
- **Payments**: [Stripe Element SDK](https://stripe.com/)
- **Transitions**: [Framer Motion](https://www.framer.com/motion/)
- **Carousel**: [Embla Carousel](https://www.embla-carousel.com/)
- **Styling**: Vanilla CSS (Modern CSS variables, HSL Tailored palettes)

---

## Getting Started

### 1. Prerequisite Variables
Create a `.env.local` file in the root directory (already added to `.gitignore`) and populate it with the following:

```env
NEXT_PUBLIC_SUPABASE_URL=https://<your-project-id>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-public-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>

NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### 2. Apply Migrations & Seeding
Database tables, indexes, and full-text-search triggers are versioned under `supabase/migrations`. 

To populate your database with initial mock categories and 12 premium products, execute the seed utility script:

```bash
node scripts/seed.js
```

### 3. Start Development Server
To launch the application locally:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the storefront.

---

## Production Build

To compile a clean optimized production build:

```bash
npm run build
npm run start
```
