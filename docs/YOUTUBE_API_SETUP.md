# YouTube View Count Setup Instructions

## Getting Your YouTube Data API Key

1. **Go to Google Cloud Console**
   - Visit: https://console.cloud.google.com/

2. **Create a New Project**
   - Click "Select a project" dropdown at the top
   - Click "New Project"
   - Enter project name: "TTTM Videos" (or any name you prefer)
   - Click "Create"

3. **Enable YouTube Data API v3**
   - Use the search bar at the top and type "YouTube Data API v3"
   - Click on "YouTube Data API v3" in the results
   - Click the "Enable" button

4. **Create API Credentials**
   - Click "Credentials" in the left sidebar
   - Click "Create Credentials" button at the top
   - Select "API Key"
   - Copy the API key that appears

5. **Restrict Your API Key (Recommended for Security)**
   - Click on the API key you just created
   - Under "Application restrictions":
     - Select "HTTP referrers (web sites)"
     - Click "Add an item"
     - Add your website URL (e.g., `https://yourdomain.com/*`)
     - For local testing, also add: `http://localhost:*` and `http://127.0.0.1:*`
   - Under "API restrictions":
     - Select "Restrict key"
     - Check only "YouTube Data API v3"
   - Click "Save"

## Configuring Your Website

1. **Open the config file**
   - Navigate to: `docs/js/config.js`

2. **Add Your API Key**
   - Find the `YOUTUBE_CONFIG` section
   - Replace `YOUR_YOUTUBE_API_KEY_HERE` with your actual API key
   - Change `enabled: false` to `enabled: true`

   Example:
   ```javascript
   const YOUTUBE_CONFIG = {
     apiKey: "AIzaSyBxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
     enabled: true
   };
   ```

3. **Save the file**

4. **Refresh your website**
   - The view counts should now appear below each video thumbnail

## Features

- **Automatic View Counts**: Shows YouTube view counts below each video thumbnail
- **Batch Loading**: Efficiently fetches data for multiple videos at once
- **Caching**: Stores results to avoid repeated API calls
- **Number Formatting**: Displays counts as "1.5K" or "2.3M" for large numbers
- **Error Handling**: Gracefully handles API errors without breaking the site

## API Quota Information

- **Daily Quota**: 10,000 units per day (default free tier)
- **Cost per Request**: 1 unit per video statistics request
- **Batch Requests**: Can fetch up to 50 videos per request
- **Example**: With 200 videos, you'll use approximately 4-5 units per page load

The quota should be more than sufficient for your needs!

## Troubleshooting

**View counts not showing:**
- Check browser console (F12) for errors
- Verify API key is correct in `config.js`
- Verify `enabled: true` is set
- Check that your domain is in the allowed referrers list
- Ensure YouTube Data API v3 is enabled in Google Cloud Console

**"403 Forbidden" error:**
- Your API key restrictions may be too strict
- Add your domain to the HTTP referrers list
- For local testing, add `http://localhost:*`

**"429 Too Many Requests" error:**
- You've exceeded your daily quota
- Wait until the next day (quota resets at midnight Pacific Time)
- Or request a quota increase in Google Cloud Console
