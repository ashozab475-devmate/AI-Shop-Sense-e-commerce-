# 🚀 Start Script Guide

## Quick Start

### **Easiest Way to Start All Services**

Simply **double-click** this file:
```
start-frontend-backends.bat
```

That's it! The script will:
1. ✅ Check all prerequisites
2. ✅ Install missing dependencies
3. ✅ Start Next.js frontend (port 3000)
4. ✅ Start Python AI backend (port 5000)
5. ✅ Open your browser automatically

---

## 📋 What the Script Does

### **Automated Checks**
- ✅ Verifies Node.js installation
- ✅ Verifies Python installation
- ✅ Checks npm dependencies
- ✅ Checks Python dependencies (Flask, PyTorch, FAISS, CLIP)
- ✅ Creates `.env.local` if missing
- ✅ Validates configuration files

### **Service Startup**
1. **Next.js Frontend** (Port 3000)
   - React-based UI
   - Visual Search component
   - Shopping pages
   - Admin/Seller dashboards

2. **Python AI Backend** (Port 5000)
   - CLIP image embeddings
   - Category classifier
   - FAISS similarity search
   - Visual search API

---

## 🎯 Usage

### **Method 1: Double-Click (Recommended)**
```
📁 fypapp/
  └─ start-frontend-backends.bat  ← Double-click this
```

### **Method 2: Command Line**
```cmd
cd fypapp
start-frontend-backends.bat
```

### **Method 3: PowerShell**
```powershell
cd fypapp
./start-frontend-backends.bat
```

---

## 🖥️ What You'll See

### **Console Output**
```
============================================================================
              ShopSense - Starting Frontend and All Backends
============================================================================

[1/5] Checking Node.js installation...
OK - Node.js found
v24.6.0

[2/5] Checking Python installation...
OK - Python found
Python 3.14.2

[3/5] Checking Node.js dependencies...
OK - Dependencies already installed

[4/5] Checking Python dependencies...
OK - Python dependencies already installed

[5/5] Checking configuration files...
OK - .env.local file found

============================================================================
                    Starting Services
============================================================================

[1/2] Starting Frontend (Next.js on port 3000)...
[2/2] Starting Python AI Search Backend (port 5000)...
```

### **Service Windows**
Two new command windows will open:
1. **"ShopSense Frontend"** - Next.js development server
2. **"ShopSense Python Backend"** - Python Flask server

### **Browser**
Your default browser will automatically open to:
```
http://localhost:3000
```

---

## 📊 Service Information

### **Frontend (Port 3000)**
| Feature | URL |
|---------|-----|
| Home | http://localhost:3000 |
| Shopping | http://localhost:3000/shopping |
| Search | http://localhost:3000/search |
| Admin Dashboard | http://localhost:3000/admin/dashboard |
| Seller Dashboard | http://localhost:3000/seller/products |
| Contact | http://localhost:3000/contact |
| FAQ | http://localhost:3000/faq |
| Help | http://localhost:3000/help |

### **Backend (Port 5000)**
| Endpoint | URL |
|----------|-----|
| Health Check | http://localhost:5000/ |
| Image Search | http://localhost:5000/api/image-search/search |
| Visual Search | http://localhost:5000/api/visual-search/search |
| Text Search | http://localhost:5000/api/search?q=laptop |
| Products | http://localhost:5000/api/products |
| Categories | http://localhost:5000/api/categories |
| Recommendations | http://localhost:5000/api/recommendations |

---

## 🔍 AI Visual Search

### **How to Use**
1. Go to http://localhost:3000
2. Click the **"Visual Search"** button (bottom-right floating button)
3. Upload a product image (JPG, PNG, WebP)
4. View AI-powered similar products

### **Features**
- ✅ CLIP image embeddings (512-dimensional vectors)
- ✅ Category classifier (20 product categories)
- ✅ FAISS similarity search (fast vector search)
- ✅ Category-aware filtering (prevents cross-category noise)
- ✅ Real-time similarity scoring (0-100%)

### **Supported Categories**
Appliances, Beds, Bicycles, Cameras, Chairs, Cookware, Dinnerware, Dresses, Headphones, Jackets, Jeans, Laptops, Outdoors, Shirts, Shoes, Smartphones, Sofas, Sports, Tables, Tablets

---

## 🛑 How to Stop Services

### **Option 1: Close Windows**
Close the two service windows:
- "ShopSense Frontend"
- "ShopSense Python Backend"

### **Option 2: Ctrl+C**
Press `Ctrl+C` in each service window

### **Option 3: Task Manager**
1. Open Task Manager (`Ctrl+Shift+Esc`)
2. Find processes:
   - `node.exe` (Next.js)
   - `python.exe` (Flask)
3. End tasks

---

## ⚙️ Configuration

### **Environment Variables (.env.local)**
The script automatically creates `.env.local` with defaults:

```env
NEXT_PUBLIC_API_URL=http://localhost:3000
DATABASE_URL="postgresql://postgres:password@localhost:5432/fypapp"
SEARCH_SERVICE_URL="http://127.0.0.1:5000/api/image-search/search"
STRIPE_PUBLIC_KEY="pk_test_your_public_key"
STRIPE_SECRET_KEY="sk_test_your_secret_key"
NEXT_PUBLIC_STRIPE_PUBLIC_KEY="pk_test_your_public_key"
```

**Important:** Update these values for production:
- `DATABASE_URL` - Your PostgreSQL connection string
- `STRIPE_*` - Your Stripe API keys

---

## 🔧 Troubleshooting

### **"Node.js is not installed"**
**Solution:** Install Node.js from https://nodejs.org/
- Recommended: LTS version
- Restart terminal after installation

### **"Python is not installed"**
**Solution:** Install Python from https://www.python.org/
- Recommended: Python 3.9 or higher
- Check "Add Python to PATH" during installation

### **"Failed to install npm dependencies"**
**Solution:**
```cmd
cd fypapp
npm install
```

### **"Failed to install Python dependencies"**
**Solution:**
```cmd
cd fypapp
pip install -r search_service/requirements.txt
```

### **Port Already in Use**
**Error:** `EADDRINUSE: address already in use :::3000`

**Solution:**
```cmd
# Windows - Kill process on port 3000
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Or use different port
set PORT=3001
npm run dev
```

### **Python Backend Not Responding**
**Check:**
1. Is Python service window open?
2. Check for errors in Python window
3. Verify dependencies:
   ```cmd
   python -c "import flask, torch, faiss, open_clip"
   ```

### **Visual Search Not Working**
**Check:**
1. Python backend is running (http://localhost:5000/)
2. Model files exist in `search_service/`:
   - `category_classifier.pkl`
   - `visual_search_faiss_index.bin`
   - `visual_search_train_embeddings.npy`
3. Check browser console for errors

---

## 📦 Dependencies

### **Node.js Dependencies**
Automatically installed from `package.json`:
- Next.js 15.5.6
- React 19.1.0
- Prisma 6.19.0
- Stripe
- And more...

### **Python Dependencies**
Automatically installed from `search_service/requirements.txt`:
- Flask
- PyTorch
- FAISS
- OpenCLIP
- Pillow
- NumPy
- Waitress

---

## 🎓 First Time Setup

### **Complete Setup Process**

1. **Clone/Download Project**
   ```cmd
   cd "D:\FYP Project\fypapp"
   ```

2. **Run Start Script**
   ```cmd
   start-frontend-backends.bat
   ```

3. **Wait for Installation**
   - First run may take 5-10 minutes
   - npm dependencies: ~2-3 minutes
   - Python dependencies: ~5-7 minutes (PyTorch is large)

4. **Services Start**
   - Frontend: ~10 seconds
   - Backend: ~5-15 seconds (model loading)

5. **Browser Opens**
   - Automatically opens to http://localhost:3000

---

## 📝 Alternative Start Scripts

### **Individual Services**

**Start Only Frontend:**
```cmd
npm run dev
```

**Start Only Python Backend:**
```cmd
python search_service/start_server.py
```

**Start Visual Search Backend:**
```cmd
start-visual-search.bat
```

**Start All Services (including Node backend):**
```cmd
start-all.bat
```

---

## 🧪 Testing

### **Test Script Functionality**
```powershell
./test-start-script.ps1
```

### **Test Visual Search**
```powershell
./test-visual-search.ps1
```

### **Demo Visual Search API**
```powershell
./demo-visual-search.ps1
```

---

## 📚 Additional Documentation

- **Visual Search Status:** `VISUAL_SEARCH_STATUS.md`
- **API Documentation:** http://localhost:5000/api/docs/endpoints
- **Model Information:** `search_service/visual_search_model_info.json`

---

## ✨ Features Summary

### **What's Included**
- ✅ Automated dependency installation
- ✅ Environment configuration
- ✅ Service health checks
- ✅ Automatic browser launch
- ✅ Clear status messages
- ✅ Error handling
- ✅ Service window management

### **What Gets Started**
- ✅ Next.js Frontend (React, Tailwind CSS)
- ✅ Python AI Backend (Flask, CLIP, FAISS)
- ✅ Visual Search Feature
- ✅ Product Search
- ✅ Shopping Pages
- ✅ Admin/Seller Dashboards

---

## 🎉 Success Indicators

When everything is working, you'll see:

1. **Two service windows open** (Frontend + Backend)
2. **Browser opens** to http://localhost:3000
3. **No error messages** in console
4. **Visual Search button** visible (bottom-right)
5. **Backend health check** returns online status

---

## 💡 Tips

- **First Run:** Be patient, dependency installation takes time
- **Subsequent Runs:** Much faster (~15 seconds total)
- **Keep Windows Open:** Don't close service windows
- **Check Logs:** Service windows show real-time logs
- **Browser DevTools:** F12 to check for frontend errors
- **Test Backend:** Visit http://localhost:5000/ to verify

---

## 🆘 Support

If you encounter issues:

1. **Check Prerequisites:**
   - Node.js installed?
   - Python installed?
   - Both in PATH?

2. **Check Ports:**
   - Port 3000 available?
   - Port 5000 available?

3. **Check Dependencies:**
   - `node_modules/` exists?
   - Python packages installed?

4. **Check Configuration:**
   - `.env.local` exists?
   - Valid database URL?

5. **Check Logs:**
   - Frontend window for Next.js errors
   - Backend window for Python errors

---

## 🚀 Ready to Go!

Your `start-frontend-backends.bat` script is now **fully functional** and ready to use!

**Just double-click it and you're good to go!** 🎉
