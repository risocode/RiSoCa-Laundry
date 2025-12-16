# Promo Management System

## Overview
A dynamic promotional campaign management system that allows admins to create, manage, and activate promotional campaigns without code changes. The banner automatically shows/hides based on promo dates.

## Database Setup

### 1. Run the Migration
Execute the SQL migration file to create the `promos` table:

```sql
-- Run this in your Supabase SQL Editor
-- File: src/docs/create-promos-table.sql
```

This creates:
- `promos` table with all necessary fields
- Indexes for performance
- RLS policies (admin-only write, public read for active promos)
- Auto-update trigger for `updated_at` timestamp

## Features

### Admin Promo Management Page
**Location:** `/admin/promo`

**Features:**
- Create new promos with date, time, price, and display text
- Edit existing promos
- Activate/deactivate promos (only one active at a time)
- Delete promos
- View all promos with status indicators:
  - **LIVE** (green) - Currently active and within date range
  - **UPCOMING** (yellow) - Active but hasn't started yet
  - **INACTIVE** (gray) - Not activated

### Automatic Banner Display
- Banner automatically shows when:
  - A promo is active (`is_active = true`)
  - Current time is between `start_date` and `end_date`
- Banner automatically hides when:
  - No active promo exists
  - Promo has ended
  - Promo hasn't started yet (but will show countdown if active)

### Countdown Timer
- Shows "Promo Starts In:" before promo begins
- Shows "Promo Ends In:" during the promo
- Automatically hides after promo ends

## How to Use

### Creating a New Promo

1. Navigate to `/admin/promo` (accessible from admin menu)
2. Click "New Promo" button
3. Fill in the form:
   - **Date**: Select the promo date
   - **Start Time**: When promo begins (24-hour format)
   - **End Time**: When promo ends (24-hour format)
   - **Price per Load**: Promotional price (e.g., 150)
   - **Display Date Text**: How to display the date (e.g., "December 17, 2025")
4. Click "Create"
5. Click "Activate" on the promo card to enable it

### Activating a Promo

- Only one promo can be active at a time
- Clicking "Activate" on a promo will:
  - Deactivate all other promos
  - Activate the selected promo
  - Banner will show if current time is within the promo date range

### Editing a Promo

1. Click the edit icon (pencil) on any promo card
2. Modify the fields
3. Click "Update"

### Deleting a Promo

1. Click the delete icon (trash) on any promo card
2. Confirm deletion

## Technical Details

### API Functions (`src/lib/api/promos.ts`)

- `getActivePromo()` - Fetches currently active promo (if any)
- `getAllPromos()` - Fetches all promos (admin only)
- `createPromo()` - Creates a new promo
- `updatePromo()` - Updates an existing promo
- `deletePromo()` - Deletes a promo
- `activatePromo()` - Activates a promo (deactivates others)

### Components

- **PromoBanner** (`src/components/promo-banner.tsx`)
  - Fetches active promo from database
  - Auto-refreshes every minute
  - Shows/hides based on promo status

- **AppHeader** (`src/components/app-header.tsx`)
  - Shows promo banner on homepage
  - Uses same dynamic promo logic

- **AdminPromoPage** (`src/app/admin/promo/page.tsx`)
  - Full CRUD interface for promo management

### Database Schema

```sql
promos (
  id UUID PRIMARY KEY
  start_date TIMESTAMPTZ NOT NULL
  end_date TIMESTAMPTZ NOT NULL
  price_per_load DECIMAL(10, 2) NOT NULL
  display_date TEXT NOT NULL
  is_active BOOLEAN DEFAULT false
  created_at TIMESTAMPTZ
  updated_at TIMESTAMPTZ
  created_by UUID (references profiles)
)
```

## Future Promos

To create a new promo after the current one ends:

1. Create a new promo with future dates
2. Click "Activate" when ready
3. Banner will automatically show when the promo start date arrives
4. Banner will automatically hide when the promo ends

No code changes needed! 🎉

