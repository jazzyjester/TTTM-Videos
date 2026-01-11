# Visitor Counter Setup Guide

## Firebase Setup (5 minutes)

Your visitor counter is ready to work, but needs a Firebase database to store global counts.

### Step 1: Create Free Firebase Account

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **"Add project"** or **"Create a project"**
3. Name it: `tttm-videos` (or any name you prefer)
4. Disable Google Analytics (not needed for counter)
5. Click **"Create project"**

### Step 2: Create Realtime Database

1. In your Firebase project, click **"Realtime Database"** in left menu
2. Click **"Create Database"**
3. Choose location: **United States** or closest to you
4. Security rules: Select **"Start in test mode"** (we'll secure it in next step)
5. Click **"Enable"**

### Step 3: Set Security Rules

1. In Realtime Database page, click **"Rules"** tab
2. Replace the rules with this:

```json
{
  "rules": {
    "counters": {
      ".read": true,
      ".write": true,
      "$counter": {
        ".validate": "newData.isNumber()"
      }
    }
  }
}
```

3. Click **"Publish"**

**What this does:**
- Allows anyone to read counter values (public)
- Allows anyone to increment counters (but only numbers)
- Restricts access to `/counters` path only

### Step 4: Get Your Database URL

1. In Realtime Database page, find your database URL at the top
2. It looks like: `https://tttm-videos-default-rtdb.firebaseio.com/`
3. Copy this URL

### Step 5: Update Your Code

Open `js/visitor-counter.js` and update line 9:

**Replace:**
```javascript
databaseURL: 'https://tttm-videos-default-rtdb.firebaseio.com/'
```

**With your actual database URL from step 4**

### Step 6: Test

1. Save the file
2. Deploy to GitHub (commit & push)
3. Visit your live site
4. The counter should increment!

## Verification

After setup, check your browser console (F12):
- ✅ Should see: `✅ Firebase - Total: X, Today: Y`
- ❌ If you see errors, verify database URL and security rules

## Current Status

- **Local Testing**: Uses localStorage (only you see it)
- **After Firebase Setup**: Global counter (all visitors see same numbers)

## Alternative: Simple Badge Counter

If you prefer not to set up Firebase, you can use a simple badge:

Add this to your footer in `index.html`:

```html
<img src="https://hits.sh/tttm.co.il.svg?style=flat&label=visitors&color=0066cc" alt="Visitors">
```

This shows a visitor badge image instead of custom counter.

---

**Need help?** The current code works with localStorage as fallback, so your site won't break even without Firebase!
