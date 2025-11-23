# 🚀 Deploy ShopLink to Render

This guide will walk you through deploying your ShopLink e-commerce platform to Render.

## 📋 Prerequisites

1. GitHub account with your project repository
2. Render account (sign up at https://render.com)
3. Your code pushed to GitHub

## 🔧 Deployment Steps

### Method 1: Using Render Dashboard (Recommended for Beginners)

#### **Step 1: Deploy Backend (Flask API)**

1. **Log in to Render** → https://dashboard.render.com

2. **Create New Web Service**
   - Click "New +" button → Select "Web Service"
   - Connect your GitHub repository: `shoplink-website`
   - Click "Connect"

3. **Configure Backend Service**
   ```
   Name: shoplink-backend
   Region: Choose closest to you (e.g., Oregon, Frankfurt)
   Branch: master
   Root Directory: backend
   Runtime: Python 3
   Build Command: pip install -r requirements.txt
   Start Command: gunicorn app:app
   ```

4. **Add Environment Variables**
   Click "Environment" tab and add:
   ```
   JWT_SECRET_KEY = [Generate a random string, keep it secret!]
   FLASK_ENV = production
   PYTHON_VERSION = 3.9.16
   PORT = 10000
   ```

5. **Set Instance Type**
   - Free tier is fine for testing
   - For production, choose "Starter" ($7/month)

6. **Deploy**
   - Click "Create Web Service"
   - Wait 5-10 minutes for deployment
   - Note your backend URL: `https://shoplink-backend.onrender.com`

#### **Step 2: Deploy Frontend (React App)**

1. **Create Another Web Service**
   - Click "New +" → "Web Service"
   - Connect same GitHub repository

2. **Configure Frontend Service**
   ```
   Name: shoplink-frontend
   Region: Same as backend
   Branch: master
   Root Directory: frontend
   Runtime: Node
   Build Command: npm install && npm run build
   Start Command: npm run preview
   ```

3. **Add Environment Variables**
   ```
   NODE_VERSION = 18.18.0
   VITE_API_URL = https://shoplink-backend.onrender.com/api
   ```
   ⚠️ Replace with your actual backend URL from Step 1!

4. **Deploy**
   - Click "Create Web Service"
   - Wait 5-10 minutes
   - Your app will be live at: `https://shoplink-frontend.onrender.com`

---

### Method 2: Using render.yaml (Blueprint - Advanced)

1. **Ensure render.yaml is in your repository root** ✅ (Already created)

2. **Create New Blueprint**
   - Go to Render Dashboard
   - Click "New +" → "Blueprint"
   - Connect GitHub repository
   - Render will automatically detect `render.yaml`
   - Review services and click "Apply"

3. **Configure Environment Variables**
   After deployment, go to each service and add:
   
   **Backend:**
   ```
   JWT_SECRET_KEY = your-super-secret-key-here
   FLASK_ENV = production
   ```
   
   **Frontend:**
   ```
   VITE_API_URL = https://shoplink-backend.onrender.com/api
   ```

---

## ⚙️ Post-Deployment Configuration

### Update Frontend API URL

1. Go to Frontend service in Render
2. Environment tab
3. Update `VITE_API_URL` with your backend URL
4. Click "Save Changes" (will trigger redeploy)

### Update Backend CORS

If you get CORS errors, update `backend/app.py`:
```python
CORS(app, resources={
    r"/api/*": {
        "origins": [
            "https://shoplink-frontend.onrender.com",
            "http://localhost:3000"
        ]
    }
})
```

---

## 🗄️ Database Setup

### Option 1: SQLite (Default - Good for Testing)
- Already configured
- Stored in service disk (may reset on free tier)
- No additional setup needed

### Option 2: PostgreSQL (Recommended for Production)

1. **Create PostgreSQL Database**
   - In Render Dashboard: "New +" → "PostgreSQL"
   - Name: `shoplink-db`
   - Region: Same as backend
   - Plan: Free or Starter
   - Click "Create Database"

2. **Update Backend Code**
   
   Install PostgreSQL adapter:
   ```bash
   # Add to backend/requirements.txt
   psycopg2-binary==2.9.9
   ```
   
   Update `backend/database.py`:
   ```python
   import os
   from sqlalchemy import create_engine
   
   DATABASE_URL = os.getenv('DATABASE_URL', 'sqlite:///shoplink.db')
   # Render uses postgresql:// but SQLAlchemy needs postgresql://
   if DATABASE_URL.startswith('postgres://'):
       DATABASE_URL = DATABASE_URL.replace('postgres://', 'postgresql://', 1)
   
   engine = create_engine(DATABASE_URL)
   ```

3. **Add Database URL to Backend Environment**
   - Go to Backend service → Environment
   - Add: `DATABASE_URL = [Internal Database URL from PostgreSQL service]`

---

## 🔍 Troubleshooting

### Backend Won't Start
- Check logs: Service → "Logs" tab
- Verify `requirements.txt` has all dependencies
- Check `Start Command` is correct: `gunicorn app:app`

### Frontend Shows "Failed to Fetch"
- Verify `VITE_API_URL` matches backend URL exactly
- Check backend is running and accessible
- Update CORS settings in backend

### Database Resets on Free Tier
- Free tier has no persistent disk
- Upgrade to paid plan OR use external PostgreSQL
- Use Render's PostgreSQL service (also has free tier)

### Files Upload Not Working
- Render's free tier doesn't persist files
- Use cloud storage (AWS S3, Cloudinary) for production
- Or upgrade to paid plan with persistent disk

---

## 📊 Monitoring

### View Logs
```
Render Dashboard → Your Service → Logs tab
```

### Restart Service
```
Render Dashboard → Your Service → Manual Deploy → Deploy
```

### Check Health
```bash
# Backend health check
curl https://shoplink-backend.onrender.com/api/health

# Should return:
{"status":"healthy","service":"shoplink-api"}
```

---

## 🚀 Custom Domain (Optional)

### Backend
1. Go to Backend service → Settings → Custom Domain
2. Add your domain: `api.yourdomain.com`
3. Configure DNS (instructions provided by Render)

### Frontend
1. Go to Frontend service → Settings → Custom Domain
2. Add your domain: `www.yourdomain.com`
3. Configure DNS

---

## 💰 Pricing

### Free Tier Limitations
- Services spin down after 15 minutes of inactivity
- First request after spindown takes ~30 seconds
- No persistent disk storage
- 750 hours/month free

### Paid Tier Benefits ($7/month per service)
- Always on (no spin down)
- Persistent SSD storage
- Better performance
- Custom domains with SSL

**Recommended for Production:**
- Backend: Starter ($7/month)
- Frontend: Starter ($7/month)
- PostgreSQL: Free tier OK, or Starter ($7/month)
**Total: ~$14-21/month**

---

## 🔐 Security Checklist

- [ ] Change `JWT_SECRET_KEY` to a strong random value
- [ ] Set `FLASK_ENV=production`
- [ ] Configure proper CORS origins (remove wildcard *)
- [ ] Use HTTPS URLs only
- [ ] Enable Render's DDoS protection
- [ ] Set up database backups (paid plans)
- [ ] Add rate limiting to API endpoints
- [ ] Review exposed endpoints

---

## 📝 Common Issues

### Issue: "Application failed to respond"
**Solution:** Check PORT environment variable. Render provides dynamic port.
```python
port = int(os.environ.get('PORT', 10000))
```

### Issue: Database tables not created
**Solution:** Ensure `init_db()` runs on first deployment
```python
if __name__ == '__main__':
    from database import init_db
    init_db()  # Creates tables if they don't exist
```

### Issue: Static files (CSS/JS) not loading
**Solution:** Check build output directory matches Vite config
```typescript
build: {
  outDir: 'dist',
}
```

---

## 🎉 Success!

If everything is deployed correctly:

1. **Backend API:** `https://shoplink-backend.onrender.com/api/health`
   - Should return: `{"status":"healthy"}`

2. **Frontend App:** `https://shoplink-frontend.onrender.com`
   - Should load your React app

3. **Test Features:**
   - Sign up for a new account
   - Create a shop
   - Add products
   - Everything should work end-to-end!

---

## 📞 Support

- **Render Documentation:** https://render.com/docs
- **Render Community:** https://community.render.com
- **GitHub Issues:** Create issue in your repository

---

## 🔄 Continuous Deployment

Render automatically redeploys when you push to GitHub:

```bash
# Make changes to your code
git add .
git commit -m "Update feature"
git push origin master

# Render automatically detects and deploys!
```

**Auto-deploy can be disabled in:** Service Settings → Build & Deploy → Auto-Deploy

---

**🎊 Congratulations!** Your ShopLink e-commerce platform is now live on the internet!

Share your live URL: `https://shoplink-frontend.onrender.com`
