# Synoptic Deployment Guide - DigitalOcean App Platform

This guide covers the environment configuration needed to deploy Synoptic on DigitalOcean after migrating from Supabase.

## Required Environment Variables

Configure these in your DigitalOcean App Platform settings:

### Database Configuration

| Variable       | Value                                                                                                                      | Type   |
| -------------- | -------------------------------------------------------------------------------------------------------------------------- | ------ |
| `DATABASE_URL` | `postgresql://doadmin:<PASSWORD>@synoptic-data-do-user-31216037-0.f.db.ondigitalocean.com:25060/defaultdb?sslmode=require` | SECRET |

### Authentication

| Variable     | Value                                  | Type   |
| ------------ | -------------------------------------- | ------ |
| `JWT_SECRET` | (generate with `openssl rand -hex 32`) | SECRET |

### AI Provider (DigitalOcean Gradient AI)

| Variable              | Value                                                          | Type    |
| --------------------- | -------------------------------------------------------------- | ------- |
| `AI_PROVIDER`         | `gradient`                                                     | Runtime |
| `DO_GRADIENT_API_KEY` | (create at DO Control Panel → AI Platform → Model Access Keys) | SECRET  |
| `DO_GRADIENT_MODEL`   | `llama3.3-70b-instruct` (optional, this is default)            | Runtime |

### Services

| Variable          | Value                      | Type    |
| ----------------- | -------------------------- | ------- |
| `PDF_SERVICE_URL` | `http://synoptic-pdf:3000` | Runtime |

## Database Initialization

After setting the DATABASE_URL environment variable locally, initialize the schema:

```bash
DATABASE_URL="postgresql://doadmin:<PASSWORD>@..." node scripts/init-db.js
```

This creates:

- `profiles` - User accounts with bcrypt password hashes
- `projects` - Project data with JSONB content/settings
- `activity_log` - Optional analytics

## DigitalOcean Control Panel Steps

1. Go to **Apps** → Your App → **Settings** → **App-Level Environment Variables**
2. Add each variable from the table above
3. For secrets, check "Encrypt"
4. Click "Save"
5. The app will automatically redeploy

## Creating a Gradient AI Access Key

1. Go to **AI Platform** in DO Control Panel
2. Select **Serverless Inference**
3. Click **Create Access Key**
4. Name it "synoptic-production"
5. Copy the key and add as `DO_GRADIENT_API_KEY`

## Verification

After deployment, test:

1. Visit `/auth/login` - should show login form
2. Create an account
3. Create a project in dashboard
4. Test AI translation (requires Gradient API key)
