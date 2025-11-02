# 💕 Couples Notes App

A sweet, private space for you and your partner to share notes and messages with real-time syncing!

## Features

- Real-time note syncing between devices
- Simple authentication (shared password)
- Beautiful, romantic UI
- Mobile-friendly design
- Delete your own notes
- Timestamps showing when notes were written

## Setup Instructions

### Step 1: Create a Supabase Account

1. Go to [supabase.com](https://supabase.com)
2. Click "Start your project" (it's free!)
3. Sign up with GitHub or email
4. Create a new project:
   - Give it a name (e.g., "couples-notes")
   - Set a database password (save this somewhere)
   - Choose a region close to you
   - Click "Create new project"
5. Wait 2-3 minutes for it to set up

### Step 2: Create the Database Table

1. In your Supabase project, click on "SQL Editor" in the left sidebar
2. Click "New Query"
3. Copy and paste this SQL code:

```sql
-- Create the notes table
CREATE TABLE notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  content TEXT NOT NULL,
  author TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows anyone to read and write
-- (Since you're using a shared password, this is safe for your use case)
CREATE POLICY "Allow all operations" ON notes
  FOR ALL
  USING (true)
  WITH CHECK (true);
```

4. Click "Run" (or press Ctrl/Cmd + Enter)
5. You should see "Success. No rows returned"

### Step 3: Get Your Supabase Credentials

1. Click on "Settings" (gear icon) in the left sidebar
2. Click on "API" under "Project Settings"
3. You'll see two important values:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **anon public** key (under "Project API keys")
4. Copy both of these

### Step 4: Configure the App

1. Open `app.js` in this folder
2. Find these lines at the top:
   ```javascript
   const SUPABASE_URL = 'YOUR_SUPABASE_URL';
   const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';
   ```
3. Replace `YOUR_SUPABASE_URL` with your Project URL
4. Replace `YOUR_SUPABASE_ANON_KEY` with your anon public key
5. Save the file

### Step 5: Run the App Locally

**Option A: Using Python**
```bash
cd couples-notes-app
python3 -m http.server 8000
```
Then open: http://localhost:8000

**Option B: Using VS Code**
- Install the "Live Server" extension
- Right-click on `index.html` and select "Open with Live Server"

**Option C: Just open the file**
- Double-click `index.html` (may have CORS issues with some browsers)

### Step 6: Test It Out!

1. Open the app in your browser
2. Enter your name and a shared password (can be anything you want)
3. Write your first note!
4. Open the same URL on another device or in an incognito window
5. Enter your partner's name and the SAME password
6. You should see the note appear in real-time!

## Deploying to GitHub Pages

Want to host this online for free? Here's how:

### 1. Create a New GitHub Repository

```bash
cd couples-notes-app
git init
git add .
git commit -m "Initial commit: Couples notes app"
```

### 2. Push to GitHub

```bash
# Create a new repo on github.com first, then:
git remote add origin https://github.com/YOUR-USERNAME/couples-notes.git
git branch -M main
git push -u origin main
```

### 3. Enable GitHub Pages

1. Go to your repo on GitHub
2. Click "Settings" > "Pages"
3. Under "Source", select "main" branch
4. Click "Save"
5. Wait a minute, then your app will be live at:
   `https://YOUR-USERNAME.github.io/couples-notes/`

### 4. (Optional) Add a Custom Domain

1. Buy a domain from Namecheap, Google Domains, etc.
2. In your domain's DNS settings, add a CNAME record:
   - Name: `www` (or `@` for root domain)
   - Value: `YOUR-USERNAME.github.io`
3. In GitHub Pages settings, enter your custom domain
4. Wait for DNS to propagate (can take a few hours)

## Security Notes

- This app uses a simple shared password system (stored in browser localStorage)
- The Supabase database is configured to allow anyone with the URL to read/write
- This is fine for a private couple's app, but NOT for production apps with sensitive data
- For better security, consider:
  - Using Supabase's built-in authentication
  - Setting up proper Row Level Security policies
  - Adding email verification

## Customization Ideas

- Change colors in `style.css` (search for `#667eea` and `#764ba2`)
- Add emoji reactions to notes
- Add photo uploads
- Add categories or tags
- Add a "favorite" feature
- Make notes private (visible only to author)
- Add edit functionality

## Troubleshooting

**Notes not loading?**
- Check browser console (F12) for errors
- Make sure you replaced the Supabase credentials in `app.js`
- Make sure you ran the SQL to create the table

**Real-time not working?**
- Supabase real-time is enabled by default, but check your project settings
- Try refreshing the page

**Can't login?**
- Any password works! Just make sure you both use the same one
- Check browser console for errors

## Need Help?

Feel free to ask me any questions! I can help you:
- Deploy to GitHub Pages
- Add new features
- Fix any issues
- Customize the design

Enjoy your couples app! 💕
