# TraceChain Backend

This directory contains the backend API server for the TraceChain blockchain product traceability platform.

## 📁 Structure

```
backend/
├── server-mongodb.js       # Main server file (ACTIVE)
├── server.js              # Basic server (LEGACY)
├── server-full.js         # Firebase server (LEGACY)
├── package.json           # Dependencies and scripts
├── .env                   # Environment variables
├── models/
│   └── Product.js         # MongoDB product schema
├── database/
│   └── connection.js      # Database connection management
└── node_modules/          # Installed dependencies
```

## 🛠️ Technologies Used

- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB Atlas** - Cloud NoSQL database
- **Mongoose** - MongoDB object modeling
- **CORS** - Cross-origin resource sharing
- **QRCode** - QR code generation
- **UUID** - Unique identifier generation
- **dotenv** - Environment variable management

## 🗄️ Database Schema

### Product Model:
```javascript
{
  productId: String (unique),
  productName: String (required),
  manufacturer: String (required),
  category: String (required),
  description: String,
  origin: String,
  certifications: [String],
  batchNumber: String,
  serialNumber: String,
  registrationTime: Date,
  status: String,
  supplyChainHistory: [SupplyChainEvent],
  qrCode: String,
  weight: Object,
  dimensions: Object,
  price: Object
}
```

## 🚀 API Endpoints

### Health & Info:
- `GET /` - Basic health check
- `GET /api/health` - API health check
- `GET /api/health/database` - Database connectivity check
- `GET /api/message` - Simple test message

### Products:
- `POST /api/products/register` - Register new product with QR code
- `GET /api/products` - List all products
- `GET /api/products/:id` - Get specific product details
- `PUT /api/products/:id/update` - Update product supply chain

### Analytics:
- `GET /api/analytics/dashboard` - Analytics overview
- `GET /api/analytics/supply-chain` - Supply chain analytics

## ⚙️ Environment Variables

Create a `.env` file with:

```env
# MongoDB Atlas Connection
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/tracechain

# Server Configuration
PORT=3000

# CORS Origins
CORS_ORIGINS=http://localhost:3000,http://localhost:8000,http://localhost:5500
```

## 🏃‍♂️ Running the Server

```bash
# Install dependencies
npm install

# Start the server
npm start

# Or run directly
node server-mongodb.js
```

Server will start on `http://localhost:3000`

## 🔒 Security Features

- CORS protection with configurable origins
- Input validation and sanitization
- Error handling with secure error messages
- MongoDB injection protection via Mongoose

## 📊 Database Connection

The server connects to MongoDB Atlas cloud database:
- Automatic connection retry
- Connection health monitoring
- Graceful error handling
- Demo mode fallback if database unavailable

## 🧪 Testing

Test API endpoints using:

```bash
# Health check
curl http://localhost:3000/api/health

# Register product
curl -X POST http://localhost:3000/api/products/register \
  -H "Content-Type: application/json" \
  -d '{"productName":"Test","manufacturer":"TestCorp","category":"Electronics"}'
```
