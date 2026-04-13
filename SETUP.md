# POS Setup Guide

This guide helps you run the full POS project locally (`backend` + `frontend`).

## Prerequisites

- Node.js 18+ and npm
- PostgreSQL installed locally

## 1) Start PostgreSQL

Use one of these commands:

```bash
sudo service postgresql start
```

or

```bash
sudo pg_ctlcluster 17 main start
```

## 2) Configure Backend Environment

Create `backend/.env` with:

```env
PORT=5000
DATABASE_URL=postgres://pratik:root@localhost:5432/pos_db
JWT_SECRET=your-super-secret-jwt-key-change-this
JWT_EXPIRES_IN=24h
```

If your DB username/password/database name are different, update `DATABASE_URL`.

## 3) Install Dependencies

Backend:

```bash
cd backend
npm install
```

Frontend:

```bash
cd ../frontend
npm install
```

## 4) Initialize Database Schema

From `backend`:

```bash
npm run db:init
```

This creates tables and default users:

- `admin / admin123`
- `cashier / cashier123`

## 5) Seed Menu Data

From `backend`:

```bash
npm run db:seed-menu
```

This imports categories and menu items.

## 6) Run Backend

From `backend`:

```bash
npm run dev
```

Backend URL: `http://localhost:5000`

## 7) Run Frontend

From `frontend`:

```bash
npm run dev
```

Frontend URL (default): `http://localhost:8080`

## 8) Login

Use one of:

- Admin: `admin / admin123`
- Cashier: `cashier / cashier123`

## Common Issues

- `relation "users" does not exist`:
  - Run `npm run db:init` in `backend`.
- `connect ECONNREFUSED 127.0.0.1:5432`:
  - PostgreSQL is not running; start it and retry.
- Menu appears empty:
  - Run `npm run db:seed-menu`.
