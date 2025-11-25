# Quick Fix Checklist - 404 on /login

## ✅ What I've Already Fixed in Code
- [x] Fixed `_redirects` file
- [x] Created `server.js` as backup
- [x] Verified API configuration
- [x] Verified backend routes

## 🔧 What You Need to Do (Choose ONE method)

### Method 1: Dashboard - Custom Pages (Easiest) ⭐

1. [ ] Go to https://cloud.digitalocean.com/apps
2. [ ] Click on your app
3. [ ] Click **"Settings"** tab
4. [ ] Click **"Components"** in left sidebar
5. [ ] Click on your **frontend component**
6. [ ] Scroll down to **"Custom Pages"** section
7. [ ] Set **"Error Document"** to: `index.html`
8. [ ] Set **"Catch-all Document"** to: `index.html` (if you see it)
9. [ ] Click **"Save"**
10. [ ] Wait for redeploy
11. [ ] Test: Go to `/login` - should work!

**If you can't find "Custom Pages":**
- Look for "Error Pages" or "404 Page" settings
- Or try Method 2 below

---

### Method 2: Switch to Web Service (Backup)

1. [ ] Go to Settings → Components
2. [ ] Click on frontend component
3. [ ] Change type from "Static Site" to **"Web Service"**
4. [ ] Set **Run Command** to: `node server.js`
5. [ ] Set **HTTP Port** to: `5173`
6. [ ] Make sure **Build Command** is: `npm install && npm run build`
7. [ ] Click **"Save"**
8. [ ] Wait for redeploy
9. [ ] Test: Go to `/login` - should work!

---

### Method 3: Use App Spec (Advanced)

1. [ ] Open `.do/app.yaml` file
2. [ ] Replace `YOUR_GITHUB_USERNAME/YOUR_REPO_NAME` with your actual repo
3. [ ] Replace all `YOUR_*` placeholders with real values
4. [ ] In DigitalOcean: Settings → App Spec
5. [ ] Click "Edit"
6. [ ] Paste the updated app.yaml content
7. [ ] Save
8. [ ] Wait for redeploy
9. [ ] Test: Go to `/login` - should work!

---

## 🧪 After Fixing - Test These

- [ ] `https://your-app.ondigitalocean.app/login` - No 404
- [ ] `https://your-app.ondigitalocean.app/register` - No 404
- [ ] Can navigate between pages
- [ ] Login form works
- [ ] Registration form works

---

## 📍 Where Exactly to Look

**In DigitalOcean Dashboard:**

```
Apps → [Your App] → Settings → Components → [Frontend Component]
                                                      ↓
                                            Scroll down to find:
                                            - Custom Pages
                                            - Error Document
                                            - Catch-all Document
```

**The setting you're looking for might be labeled as:**
- "Error Document"
- "Catch-all Document"  
- "404 Page"
- "Catch-all Page"
- "Error Page"

**Set it to:** `index.html`

---

## 🆘 Still Stuck?

If you can't find the setting:
1. Try Method 2 (Web Service) - it's guaranteed to work
2. Or tell me what you see in your Settings → Components page and I'll help you find it

