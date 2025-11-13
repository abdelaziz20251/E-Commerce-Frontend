# Next.js Frontend — E-Commerce MVP

Next.js 14 + React 19.1.1 frontend for the e-commerce platform.

## 🏗️ Architecture

### Tech Stack
- **Next.js 14** — React framework with App Router
- **React 19.1.1** — UI library
- **TypeScript 5.7** — Type safety
- **Tailwind CSS 3.4** — Styling
- **Zustand 5.0** — State management
- **Axios 1.7** — HTTP client
- **@supabase/supabase-js 2.42** — Supabase client

### Directory Structure
```
frontend/
├─ app/                 # App Router pages
│   ├─ layout.tsx       # Root layout
│   ├─ page.tsx         # Home page
│   ├─ products/        # Product pages
│   ├─ cart/            # Cart page
│   ├─ checkout/        # Checkout flow
│   └─ orders/          # Order history
├─ components/          # Reusable components
│   ├─ ProductCard.tsx
│   ├─ CartItem.tsx
│   └─ Navbar.tsx
├─ services/            # API clients
│   ├─ api.ts           # Axios instance
│   └─ supabase.ts      # Supabase client
└─ store/               # Zustand stores
    ├─ useAuthStore.ts
    └─ useCartStore.ts
```

## 🚀 Setup

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env.local

# Start development server
npm run dev
```

## 🔧 Configuration

Edit `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_SUPABASE_URL=https://xyzcompany.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## 📄 Pages

### Public Pages
- `/` — Home page with featured products
- `/products` — Product listing with filters
- `/products/[slug]` — Product detail page
- `/login` — User login
- `/register` — User registration

### Protected Pages (Auth Required)
- `/cart` — Shopping cart
- `/checkout` — Checkout flow
- `/orders` — Order history
- `/orders/[id]` — Order details
- `/profile` — User profile

### Seller Pages (Seller Role Required)
- `/seller/dashboard` — Seller dashboard
- `/seller/products` — Manage products
- `/seller/orders` — Seller orders

## 🎨 Styling

### Tailwind CSS
Utility-first CSS framework configured in `tailwind.config.ts`.

Custom theme colors:
```typescript
primary: {
  50: '#f0f9ff',
  500: '#0ea5e9',
  900: '#0c4a6e',
}
```

### Components
- Responsive design (mobile-first)
- Dark mode support (optional)
- Accessible (ARIA labels, keyboard navigation)

## 🔐 Authentication

### Auth Flow
1. User submits login form
2. Frontend sends credentials to Django API
3. Django returns JWT tokens (access + refresh)
4. Tokens stored in Zustand store (memory)
5. Axios interceptor adds token to requests
6. Auto-refresh on 401 errors

### Zustand Store
```typescript
interface AuthState {
  user: User | null
  accessToken: string | null
  refreshToken: string | null
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  refreshAccessToken: () => Promise<void>
}
```

## 🛒 Cart Management

### Zustand Cart Store
```typescript
interface CartState {
  items: CartItem[]
  addItem: (product: Product, quantity: number) => void
  removeItem: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
  total: number
}
```

### Optimistic Updates
- Add to cart → Update UI immediately
- Sync with backend in background
- Rollback on error

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run E2E tests
npm run test:e2e

# Lint
npm run lint

# Type check
npm run type-check
```

## 📊 Performance

### Optimization Strategies
- **SSR** for home and product list pages
- **ISR** for product detail pages (revalidate: 60s)
- **Image optimization** with next/image
- **Code splitting** with dynamic imports
- **Font optimization** with next/font

### Lighthouse Targets
- Performance: >90
- Accessibility: >90
- Best Practices: >90
- SEO: >90

## 🚢 Deployment

### Vercel (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Environment Variables (Vercel)
Set in Vercel dashboard:
- `NEXT_PUBLIC_API_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Docker
```bash
# Build production image
docker build -f Dockerfile -t ecommerce-frontend .

# Run container
docker run -p 3000:3000 ecommerce-frontend
```

## 🔗 Useful Commands

```bash
# Development
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint
npm run lint

# Type check
npm run type-check

# Clean build cache
rm -rf .next
```

## 📝 Code Style

### TypeScript
- Strict mode enabled
- Explicit return types for functions
- Interface over type for objects

### React
- Functional components only
- Hooks for state management
- Server Components by default (App Router)

### Naming Conventions
- Components: PascalCase (ProductCard.tsx)
- Files: kebab-case (use-auth-store.ts)
- Constants: UPPER_SNAKE_CASE

