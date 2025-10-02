# ShowTime

ShowTime is a full-stack application for managing and exploring TV shows, actors, and user favorites.  
It includes a **RESTful API** built with **ASP.NET Core**, a **React (Vite) frontend**, and a **PostgreSQL** database.  
The project demonstrates authentication with JWT (with TTL), data filtering and pagination, CSV/PDF exports (frontend), and dynamic email notifications via **SendGrid**.

---

## 📌 Features

- **User Authentication** with JWT (expiration + refresh tokens).
- **TV Shows Management** with details, episodes, and genres.
- **Actors** with biographies and related shows.
- **Favorites** list per user with add/remove.
- **Recommendations** via email (SendGrid).
- **CSV/PDF Export** of listings (client-side).
- **Session-based Cache** for stable datasets and external images (OMDb/Wikipedia).
- **GDPR compliance** (consent field and user data handling).

---

## 🏗️ Architecture

- **Backend**: ASP.NET Core 8 (API REST, EF Core, JWT, SendGrid).
- **Frontend**: React (Vite, Shadcn UI, Tailwind).
- **Database**: PostgreSQL (UUID, citext, pgcrypto).
- **Email**: SendGrid API.

```
[React SPA] <--> [ASP.NET Core API] <--> [PostgreSQL]
     |                  |
     |--> [OMDb API]    |--> [SendGrid API]
```

---

## ⚙️ Prerequisites

- [.NET SDK 8](https://dotnet.microsoft.com/en-us/download)
- [Node.js 18+](https://nodejs.org/)
- [PostgreSQL 15+](https://www.postgresql.org/download/)
- Git
- [pgAdmin4](https://www.pgadmin.org/download/) (Recommended)

---

## 🚀 Installation

### 1. Clone the Repository
```bash
git clone <REPO_URL>
cd programa
```

### 2. Database Setup
Create the database and enable extensions:
```sql
CREATE DATABASE "Challenge";
\c Challenge
CREATE SCHEMA IF NOT EXISTS app;
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS citext;
```

Run the schema script provided in `/docs/schema.sql` and then the seed data.

### 3. API Setup
```bash
cd api/TvTracker.Api
dotnet restore
dotnet run
```

Default API URL: **http://localhost:30120**

Configure connection string in `appsettings.Development.json`:
```json
"ConnectionStrings": {
  "Default": "Host=localhost;Port=5432;Database=Challenge;Username=postgres;Password=123456"
}
```

Add your SendGrid key if using email:
```json
"SendGrid": { "ApiKey": "<YOUR_SENDGRID_API_KEY>" }
```

### 4. Frontend Setup
```bash
cd aplication/tvshows-fe
npm install
npm run dev
```

Frontend runs on **http://localhost:5173**

---

## 🔑 Example Usage

### Login
```bash
curl -X POST http://localhost:30120/auth/login   -H "Content-Type: application/json"   -d '{"email":"user@test.com","password":"Password123"}'
```

### List Shows
```bash
curl http://localhost:30120/tv-shows -H "Authorization: Bearer <TOKEN>"
```

In the UI:
- Register/Login
- Browse TV Shows & Actors
- Add/Remove Favorites
- Export CSV/PDF
- Trigger email recommendations

---

## 🗄️ Database Schema (excerpt)

```sql
CREATE TABLE IF NOT EXISTS app.tv_shows (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    title text NOT NULL,
    description text,
    type text,
    release_year integer,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS app.actors (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name text NOT NULL,
    nationality text,
    birth_date date,
    introduction text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- More tables: users, favorites, episodes, genres, relations...
```
---

## 🧪 Testing

- No automated unit tests implemented.
- Manual testing covered:
  - Authentication
  - CRUD for shows, actors, episodes
  - Favorites add/remove
  - Email recommendations
  - CSV/PDF exports

---

## 🔒 Security

- Passwords stored with ASP.NET Identity hasher.
- JWT with expiry required for all protected endpoints.
- Input validation in API and frontend.
- HTTPS recommended in production.
