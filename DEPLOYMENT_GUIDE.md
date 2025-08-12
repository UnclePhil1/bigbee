# Deployment Guide

## Project Structure Overview

Your project is now organized as:
```
crossroad/
├── frontend/          # React + Vite application
├── backend/           # Node.js server
├── package.json       # Root package manager
└── README.md         # Project documentation
```

## Deployment Options

### Option 1: Deploy as Single Project (Easiest)

Most modern hosting platforms can handle this structure directly:

#### Vercel Deployment
1. Connect your GitHub repository to Vercel
2. Vercel will automatically detect it's a Vite project
3. Set build command: `npm run build:frontend`
4. Set output directory: `frontend/dist`
5. Add environment variables in Vercel dashboard

#### Netlify Deployment
1. Connect your GitHub repository to Netlify
2. Set build command: `npm run build:frontend`
3. Set publish directory: `frontend/dist`
4. Add environment variables in Netlify dashboard

#### Railway/Render Deployment
1. Connect your repository
2. Set build command: `npm run build:frontend`
3. Set start command: `npm run start:frontend`

### Option 2: Deploy Frontend and Backend Separately (More Control)

#### Frontend Deployment

**Build the frontend:**
```bash
cd frontend
npm run build
```

**Deploy to:**
- **Vercel**: Upload `frontend/dist` folder
- **Netlify**: Upload `frontend/dist` folder  
- **GitHub Pages**: Push `frontend/dist` to gh-pages branch
- **AWS S3 + CloudFront**: Upload `frontend/dist` to S3 bucket
- **Firebase Hosting**: Upload `frontend/dist` to Firebase

#### Backend Deployment

**Build the backend:**
```bash
cd backend
npm run build
npm start
```

**Deploy to:**
- **Railway**: Connect backend folder
- **Render**: Connect backend folder
- **Heroku**: Connect backend folder
- **AWS EC2**: Upload backend files
- **DigitalOcean App Platform**: Connect backend folder

## Environment Variables Setup

### Frontend Environment Variables
Create `.env` file in `frontend/`:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_SOLANA_RPC_URL=https://api.devnet.solana.com
```

### Backend Environment Variables
Create `.env` file in `backend/`:
```env
PORT=3001
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_supabase_service_key
```

## Step-by-Step Deployment Examples

### Example 1: Vercel (Recommended for Frontend)

1. **Install Vercel CLI:**
   ```bash
   npm i -g vercel
   ```

2. **Deploy from root:**
   ```bash
   vercel
   ```

3. **Configure build settings:**
   - Build Command: `npm run build:frontend`
   - Output Directory: `frontend/dist`
   - Install Command: `npm run install:all`

4. **Add environment variables in Vercel dashboard**

### Example 2: Railway (Recommended for Backend)

1. **Connect GitHub repository to Railway**
2. **Select backend folder as source**
3. **Set environment variables in Railway dashboard**
4. **Deploy**

### Example 3: Netlify (Frontend)

1. **Connect GitHub repository to Netlify**
2. **Configure build settings:**
   - Build command: `cd frontend && npm install && npm run build`
   - Publish directory: `frontend/dist`
3. **Add environment variables**
4. **Deploy**

## Production Checklist

### Before Deployment
- [ ] Test build locally: `npm run build:frontend`
- [ ] Verify environment variables are set
- [ ] Check Supabase database is configured
- [ ] Test multiplayer functionality
- [ ] Verify Solana wallet integration

### After Deployment
- [ ] Test the deployed application
- [ ] Verify multiplayer works across different browsers
- [ ] Check wallet connection works
- [ ] Test all game stages
- [ ] Monitor for any console errors

## Troubleshooting

### Common Issues

1. **Build fails with module not found:**
   - Run `npm run install:all` to install all dependencies
   - Check that all files were moved to frontend/ correctly

2. **Environment variables not working:**
   - Ensure variables are prefixed with `VITE_` for frontend
   - Check hosting platform's environment variable settings

3. **Multiplayer not working:**
   - Verify Supabase URL and keys are correct
   - Check that database tables exist
   - Ensure RLS policies are configured

4. **Wallet connection issues:**
   - Verify Solana RPC URL is correct
   - Check that wallet adapter is properly configured

## Performance Optimization

### Frontend
- Enable gzip compression on your hosting platform
- Use CDN for static assets
- Consider code splitting for large chunks

### Backend
- Enable caching where appropriate
- Monitor database query performance
- Use connection pooling for database connections

## Security Considerations

- Never commit `.env` files to version control
- Use environment variables for all sensitive data
- Enable HTTPS on all deployments
- Regularly update dependencies
- Monitor for security vulnerabilities
