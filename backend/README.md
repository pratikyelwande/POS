# Cafe POS Backend

Express.js + PostgreSQL backend for the Cafe POS system.

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your PostgreSQL connection string and JWT secret
   ```

3. **Initialize database:**
   ```bash
   npm run db:init
   ```
   This creates all tables and seeds default users:
   - **Admin:** `admin` / `admin123`
   - **Cashier:** `cashier` / `cashier123`

4. **Start server:**
   ```bash
   npm run dev    # Development (with hot reload)
   npm start      # Production
   ```

## API Endpoints (19 total)

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| POST | `/api/auth/login` | ❌ | - | Login → JWT token |
| POST | `/api/auth/logout` | ✅ | - | Logout |
| GET | `/api/menu` | ✅ | - | Get menu items |
| POST | `/api/menu` | ✅ | admin | Add menu item |
| PUT | `/api/menu/:id` | ✅ | admin | Update menu item |
| DELETE | `/api/menu/:id` | ✅ | admin | Deactivate menu item |
| GET | `/api/menu/categories` | ✅ | - | Get categories |
| POST | `/api/orders` | ✅ | - | Create order |
| GET | `/api/orders` | ✅ | - | List orders (filterable) |
| GET | `/api/orders/pending` | ✅ | - | Get pending orders |
| PUT | `/api/orders/:id` | ✅ | - | Edit order (preparing only) |
| PATCH | `/api/orders/:id/status` | ✅ | - | Mark as served |
| PATCH | `/api/orders/:id/complete` | ✅ | - | Clear pending payment |
| POST | `/api/expenses` | ✅ | - | Add expense |
| GET | `/api/expenses` | ✅ | - | List expenses (filterable) |
| DELETE | `/api/expenses/:id` | ✅ | admin | Delete expense |
| GET | `/api/reports/summary` | ✅ | - | Revenue summary |
| GET | `/api/reports/export` | ✅ | admin | Export orders CSV |
| GET | `/api/reports/pending-export` | ✅ | admin | Export pending CSV |

## Deploy

Recommended: [Railway](https://railway.app), [Render](https://render.com), or any VPS with Node.js + PostgreSQL.
