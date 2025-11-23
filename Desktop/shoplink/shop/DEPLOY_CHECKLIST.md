# 🚀 Quick Deploy Checklist for Render

## ✅ Pre-Deployment Checklist

- [x] Code pushed to GitHub ✅
- [x] Deployment files created (render.yaml, Procfile) ✅
- [x] Gunicorn added to requirements.txt ✅
- [x] App configured for production ✅
- [x] Deployment guide created ✅

## 📝 Deploy Now - Follow These Steps:

### 1. Sign Up / Login to Render
🔗 **Go to:** https://render.com
- Click "Get Started for Free"
- Sign up with GitHub account (recommended)

### 2. Deploy Backend

1. **Dashboard → New + → Web Service**
2. **Connect GitHub repository:** `shoplink-website`
3. **Configure:**
   ```
   Name: shoplink-backend
   Region: Oregon (or closest to you)
   Branch: master
   Root Directory: backend
   Runtime: Python 3
   Build Command: pip install -r requirements.txt
   Start Command: gunicorn app:app
   ```
4. **Environment Variables:**
   ```
   JWT_SECRET_KEY = MySecretKey123!@#ChangeThis
   FLASK_ENV = production
   PYTHON_VERSION = 3.9.16
   ```
5. **Click "Create Web Service"**
6. **Wait 5-10 minutes** ⏳
7. **Copy your backend URL:** `https://shoplink-backend-XXXX.onrender.com`

### 3. Deploy Frontend

1. **Dashboard → New + → Web Service**
2. **Connect same GitHub repository**
3. **Configure:**
   ```
   Name: shoplink-frontend
   Region: Same as backend
   Branch: master  
   Root Directory: frontend
   Runtime: Node
   Build Command: npm install && npm run build
   Start Command: npm run preview
   ```
4. **Environment Variables:**
   ```
   NODE_VERSION = 18.18.0
   VITE_API_URL = [PASTE YOUR BACKEND URL HERE]/api
   ```
   Example: `https://shoplink-backend-XXXX.onrender.com/api`
   
5. **Click "Create Web Service"**
6. **Wait 5-10 minutes** ⏳

### 4. Test Your Deployment

**Backend Health Check:**
```bash
curl https://shoplink-backend-XXXX.onrender.com/api/health
```
Should return: `{"status":"healthy","service":"shoplink-api"}`

**Frontend:**
Open: `https://shoplink-frontend-XXXX.onrender.com`

### 5. Test All Features

- [ ] Sign up for new account
- [ ] Login
- [ ] Create a shop
- [ ] Add products
- [ ] Create an event
- [ ] Browse shops
- [ ] Add to cart
- [ ] Test all functionality

## 🎉 Done!

Your ShopLink platform is now live on the internet!

**Share your URLs:**
- **Frontend (User-facing):** `https://shoplink-frontend-XXXX.onrender.com`
- **Backend (API):** `https://shoplink-backend-XXXX.onrender.com/api`

---

## ⚠️ Important Notes

### Free Tier Limitations:
- Services spin down after 15 minutes of inactivity
- First request takes ~30 seconds to wake up
- Database resets periodically (no persistent storage)
- 750 hours/month free compute time

### For Production (Paid - $7/month per service):
- Services stay active (no spin down)
- Persistent SSD storage
- Better performance
- Suitable for real users

---

## 🐛 Quick Troubleshooting

**Backend won't start?**
- Check Logs tab in Render dashboard
- Verify all environment variables are set
- Ensure `gunicorn` is in requirements.txt

**Frontend can't connect to backend?**
- Check `VITE_API_URL` environment variable
- Must include `/api` at the end
- Backend must be deployed first

**"Failed to fetch" errors?**
- Wait for backend to wake up (30 seconds on free tier)
- Check backend logs for errors
- Verify CORS settings

---

## 📞 Need Help?

1. **Read full guide:** `DEPLOYMENT_GUIDE.md`
2. **Check Render logs:** Dashboard → Service → Logs
3. **Render docs:** https://render.com/docs
4. **Community:** https://community.render.com

---

## 🔄 Future Updates

To update your deployed app:

```bash
# Make your code changes
git add .
git commit -m "Your update message"
git push origin master

# Render will automatically redeploy! 🚀
```

---

**Good luck with your deployment! 🎊**
