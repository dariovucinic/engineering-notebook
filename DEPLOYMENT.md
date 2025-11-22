# Deployment Guide

## Deploy to Vercel

### One-Time Setup
1. Install Vercel CLI (already done):
   ```bash
   npm install -g vercel
   ```

2. Login to Vercel:
   ```bash
   vercel login
   ```
   This will open your browser to authenticate.

### Deploy
Simply run:
```bash
vercel
```

Follow the prompts:
- **Set up and deploy?** → Yes
- **Which scope?** → Your account
- **Link to existing project?** → No
- **Project name?** → (press Enter to use default or type a custom name)
- **Directory?** → `./` (press Enter)
- **Override settings?** → No

Vercel will:
1. Build your app
2. Deploy it
3. Give you a live URL like `https://engineering-notebook-xyz.vercel.app`

### Update Deployment
After making changes, just run:
```bash
vercel --prod
```

## Share with Friends
Once deployed, share the URL with your friends. They can access it from any device with a browser - no installation needed!

## Notes
- Free tier includes unlimited deployments
- Automatic HTTPS
- Global CDN for fast loading
- Each deployment gets a unique preview URL
