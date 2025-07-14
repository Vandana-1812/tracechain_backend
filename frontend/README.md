# TraceChain Frontend

This directory contains all the frontend files for the TraceChain blockchain product traceability platform.

## 📁 Structure

```
frontend/
├── index.html          # Landing page
├── register.html       # Product registration form (✅ Updated for MongoDB)
├── scan.html          # QR code scanning page (⚠️ Needs MongoDB update)
├── admin.html         # Admin dashboard (⚠️ Needs MongoDB update)
├── history.html       # Product history page (⚠️ Needs MongoDB update)
├── assets/            # Static assets (images, icons)
├── css/               # Custom CSS files
└── js/                # Custom JavaScript files
```

## 🛠️ Technologies Used

- **HTML5** - Semantic markup and structure
- **CSS3 + Tailwind CSS** - Styling and responsive design
- **Vanilla JavaScript** - Frontend logic and API interactions
- **Fetch API** - HTTP requests to backend APIs

## 🔌 API Integration

The frontend communicates with the backend API running on `http://localhost:3000`:

### Working Endpoints:
- `GET /api/health` - Health check
- `POST /api/products/register` - Register new product
- `GET /api/products` - List all products
- `GET /api/products/:id` - Get product details

### Status:
- ✅ **register.html** - Fully integrated with MongoDB backend
- ⚠️ **scan.html** - Still uses Firebase (needs update)
- ⚠️ **admin.html** - Still uses Firebase (needs update)
- ⚠️ **history.html** - Still uses Firebase (needs update)

## 🚀 Development

The frontend is served statically by the Express backend server. No separate build process required.

To view the frontend:
1. Start the backend server: `npm start` (from backend directory)
2. Open browser to: `http://localhost:3000`

## 📝 Notes

- All pages use Tailwind CSS for styling
- Forms include client-side validation
- QR code generation is handled by the backend
- Error handling with custom modal dialogs
