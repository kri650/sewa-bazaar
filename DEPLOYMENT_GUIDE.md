# Deployment Guide for Hostinger

## ✅ Repository Structure (Pushed to GitHub)

```
sewa-bazaar/                    ← GitHub Repository
├── .git/                       ← Git repository
├── .gitignore                  ← Excludes backend, node_modules, .next
├── README.md                   ← Project documentation
└── frontend/                   ← All Next.js application files
    ├── components/             ← React components
    ├── contexts/               ← React contexts (CartContext)
    ├── data/                   ← Static data files
    ├── pages/                  ← Next.js pages
    │   ├── _app.js
    │   ├── index.js
    │   ├── product/
    │   ├── vegetables/
    │   └── ...
    ├── public/                 ← Static assets (images, logos)
    ├── styles/                 ← CSS files
    ├── package.json            ← Dependencies
    ├── package-lock.json       ← Lock file
    └── next.config.js          ← Next.js configuration
```

## ⚠️ Backend (NOT in GitHub)

The `backend/` folder is kept **locally only** and excluded from Git via `.gitignore`

## 🚀 Deployment Steps for Hostinger

### Step 1: Access cPanel/File Manager
1. Login to your Hostinger account
2. Go to File Manager
3. Navigate to `public_html/` directory

### Step 2: Upload Frontend Files
**Upload ONLY the contents of the `frontend/` folder**

From your local machine, upload these files/folders to `public_html/`:
```
public_html/
├── components/
├── contexts/
├── data/
├── pages/
├── public/
├── styles/
├── package.json
├── package-lock.json
├── next.config.js
└── .gitignore
```

### Step 3: Install Dependencies
Using Hostinger's Terminal or SSH:
```bash
cd public_html
npm install
```

### Step 4: Build the Application
```bash
npm run build
```

### Step 5: Start the Application
For production:
```bash
npm start
```

Or use PM2 for process management:
```bash
npm install -g pm2
pm2 start npm --name "organic-frontend" -- start
pm2 save
pm2 startup
```

## 📁 What's in GitHub vs What's Local

### In GitHub Repository:
✅ frontend/ folder (complete Next.js app)
✅ .gitignore (configured)
✅ README.md

### Local Only (NOT in GitHub):
❌ backend/ folder
❌ node_modules/
❌ .next/
❌ .env files

## 🔄 Future Updates

To push updates to GitHub:
```bash
cd /home/sama/organic
git add frontend/
git commit -m "Your update message"
git push origin local-work
```

## 🌐 Domain Configuration

Your main domain should point to: `public_html/`

The Next.js app will run directly at: `https://yourdomain.com`

## ✅ Verification

After deployment, check:
1. `https://yourdomain.com` - Homepage loads
2. `https://yourdomain.com/vegetables` - Category pages work
3. `https://yourdomain.com/product/fresh-tomato` - Product pages work
4. Cart functionality works

## 🛠️ Troubleshooting

If the site doesn't load:
1. Check if Node.js is installed: `node -v`
2. Check if dependencies are installed: `ls node_modules`
3. Check build: `npm run build`
4. Check logs: `pm2 logs` (if using PM2)

---

**Note:** The repository structure is now clean. Only frontend files are in GitHub, and backend remains local for development.
