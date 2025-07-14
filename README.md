# TraceChain - Blockchain Product Traceability Platform

A comprehensive product traceability system using blockchain technology, MongoDB, and QR codes to ensure transparency and authenticity in supply chains.

## 📁 Project Structure

```
tracechain_backend/
├── 📁 frontend/           # Frontend HTML/CSS/JS files
│   ├── index.html         # Landing page
│   ├── register.html      # Product registration (✅ MongoDB integrated)
│   ├── scan.html          # QR scanning (⚠️ Needs MongoDB update)
│   ├── admin.html         # Admin dashboard (⚠️ Needs MongoDB update)
│   ├── history.html       # Product history (⚠️ Needs MongoDB update)
│   ├── assets/            # Static assets
│   ├── css/               # Custom styles
│   └── js/                # Custom scripts
│
├── 📁 backend/            # Backend API server
│   ├── server-mongodb.js  # Main server (ACTIVE)
│   ├── package.json       # Dependencies
│   ├── .env               # Environment config
│   ├── models/            # MongoDB schemas
│   └── database/          # DB connection
│
└── README.md              # This file
```

## 🚀 Quick Start

### 1. Start Backend Server:
```bash
cd backend
npm install
npm start
```

### 2. Access Frontend:
Open browser to: `http://localhost:3000`

### 3. Register Products:
Navigate to: `http://localhost:3000/register.html`

## 🛠️ Tech Stack

### Frontend:
- **HTML5** + **CSS3** + **Tailwind CSS**
- **Vanilla JavaScript**
- **Fetch API** for HTTP requests

### Backend:
- **Node.js** + **Express.js**
- **MongoDB Atlas** (Cloud Database)
- **Mongoose** (ODM)
- **QR Code Generation**
- **CORS** enabled

### Features:
- ✅ Product registration with QR codes
- ✅ Supply chain tracking
- ✅ Analytics dashboard
- ✅ Real-time database integration
- ✅ Responsive design

## 🔧 Configuration

### Environment Variables (.env):
```env
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/tracechain
PORT=3000
CORS_ORIGINS=http://localhost:3000,http://localhost:8000
```

## 📊 API Documentation

### Core Endpoints:
- `POST /api/products/register` - Register product + generate QR
- `GET /api/products` - List all products  
- `GET /api/products/:id` - Get product details
- `GET /api/analytics/dashboard` - Analytics data

### Example Registration:
```json
{
  "productName": "Organic Coffee",
  "manufacturer": "Fair Trade Corp",
  "category": "Food & Beverages",
  "origin": "Colombia",
  "description": "Premium organic coffee beans"
}
```

## ✅ Current Status

### Working Features:
- ✅ Backend API fully functional
- ✅ MongoDB Atlas connected
- ✅ Product registration with QR codes
- ✅ Static file serving
- ✅ CORS properly configured
- ✅ Error handling and validation

### Needs Update:
- ⚠️ Scan page (Firebase → MongoDB migration)
- ⚠️ Admin page (Firebase → MongoDB migration)  
- ⚠️ History page (Firebase → MongoDB migration)

## 🎯 Next Steps

1. **Update remaining frontend pages** to use MongoDB backend
2. **Add user authentication** system
3. **Implement advanced analytics** features
4. **Add mobile app** support
5. **Deploy to cloud** platform

## 🤝 Development Workflow

### Project Organization:
- **Frontend**: All HTML/CSS/JS in `/frontend` directory
- **Backend**: All server code in `/backend` directory
- **Clear separation** of concerns
- **Modular architecture** for easy maintenance

### Running in Development:
1. Backend serves both API and static files
2. Single port (3000) for everything
3. Hot reload with nodemon (optional)
4. Environment-based configuration

## 📝 Notes

- Frontend pages served statically by Express
- QR codes contain product tracking URLs
- Database schemas support complex supply chain data
- Responsive design works on mobile devices
- Error handling with user-friendly messages

---

**Built with ❤️ for supply chain transparency and product authenticity.**
