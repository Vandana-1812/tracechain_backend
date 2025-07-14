// Complete TraceChain Backend with Firebase Database Integration
const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');
const QRCode = require('qrcode');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Initialize Firebase Admin SDK
let db;
try {
    // For development - you'll need to set up Firebase credentials
    if (process.env.FIREBASE_PROJECT_ID) {
        const serviceAccount = {
            projectId: process.env.FIREBASE_PROJECT_ID,
            privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL
        };

        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            projectId: process.env.FIREBASE_PROJECT_ID
        });

        db = admin.firestore();
        console.log('✅ Firebase Admin initialized successfully');
    } else {
        console.log('⚠️  Firebase credentials not found. Running in demo mode.');
        db = null;
    }
} catch (error) {
    console.error('❌ Firebase initialization error:', error.message);
    db = null;
}

// Configure CORS
const corsOrigins = process.env.CORS_ORIGINS ? 
    process.env.CORS_ORIGINS.split(',') : 
    ['http://localhost:8000', 'http://localhost:5500', 'http://127.0.0.1:8000'];

const corsOptions = {
    origin: corsOrigins,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
    optionsSuccessStatus: 204
};
app.use(cors(corsOptions));

// Middleware
app.use(express.json());
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url} - Origin: ${req.headers.origin}`);
    next();
});

// === BASIC ENDPOINTS ===

// Health check
app.get('/', (req, res) => {
    res.json({ 
        message: 'TraceChain Backend is running!', 
        timestamp: new Date().toISOString(),
        database: db ? 'Connected' : 'Demo Mode',
        version: '1.0.0'
    });
});

// Simple message endpoint
app.get('/api/message', (req, res) => {
    res.json({ 
        message: 'Hello from TraceChain Backend!', 
        timestamp: new Date().toISOString(),
        database: db ? 'Firebase Connected' : 'Demo Mode - No Database'
    });
});

// === PRODUCT MANAGEMENT ENDPOINTS ===

// Register a new product
app.post('/api/products/register', async (req, res) => {
    try {
        const { 
            productName, 
            manufacturer, 
            category, 
            description, 
            origin, 
            certifications,
            batchNumber 
        } = req.body;

        // Validate required fields
        if (!productName || !manufacturer || !category) {
            return res.status(400).json({ 
                error: 'Missing required fields: productName, manufacturer, category' 
            });
        }

        // Generate unique product ID and QR code
        const productId = uuidv4();
        const registrationTime = new Date().toISOString();

        // Product data
        const productData = {
            productId,
            productName,
            manufacturer,
            category,
            description: description || '',
            origin: origin || '',
            certifications: certifications || [],
            batchNumber: batchNumber || '',
            registrationTime,
            status: 'registered',
            currentLocation: origin || 'Unknown',
            supplyChainHistory: [
                {
                    timestamp: registrationTime,
                    event: 'Product Registered',
                    location: origin || 'Unknown',
                    details: `Product ${productName} registered by ${manufacturer}`
                }
            ]
        };

        // Generate QR Code
        const qrCodeData = {
            productId,
            productName,
            manufacturer,
            scanUrl: `${req.protocol}://${req.get('host')}/api/products/${productId}`
        };
        
        const qrCodeDataUrl = await QRCode.toDataURL(JSON.stringify(qrCodeData));

        // Save to database (if available)
        if (db) {
            await db.collection('products').doc(productId).set(productData);
            console.log(`✅ Product ${productId} saved to database`);
        } else {
            console.log(`📝 Demo mode: Product ${productId} would be saved to database`);
        }

        res.status(201).json({
            success: true,
            message: 'Product registered successfully',
            data: {
                productId,
                productName,
                manufacturer,
                qrCode: qrCodeDataUrl,
                registrationTime,
                scanUrl: `${req.protocol}://${req.get('host')}/api/products/${productId}`
            }
        });

    } catch (error) {
        console.error('❌ Error registering product:', error);
        res.status(500).json({ 
            error: 'Failed to register product', 
            details: error.message 
        });
    }
});

// Get product information by ID
app.get('/api/products/:productId', async (req, res) => {
    try {
        const { productId } = req.params;

        if (db) {
            const doc = await db.collection('products').doc(productId).get();
            
            if (!doc.exists) {
                return res.status(404).json({ 
                    error: 'Product not found' 
                });
            }

            const productData = doc.data();
            res.json({
                success: true,
                data: productData
            });
        } else {
            // Demo response
            res.json({
                success: true,
                demo: true,
                data: {
                    productId,
                    productName: 'Demo Product',
                    manufacturer: 'Demo Manufacturer',
                    category: 'Electronics',
                    description: 'This is a demo product response',
                    registrationTime: '2025-07-14T16:00:00.000Z',
                    status: 'registered',
                    currentLocation: 'Demo Location',
                    supplyChainHistory: [
                        {
                            timestamp: '2025-07-14T16:00:00.000Z',
                            event: 'Product Registered',
                            location: 'Demo Location',
                            details: 'Demo product registration'
                        }
                    ]
                }
            });
        }

    } catch (error) {
        console.error('❌ Error fetching product:', error);
        res.status(500).json({ 
            error: 'Failed to fetch product', 
            details: error.message 
        });
    }
});

// Update product location/status
app.put('/api/products/:productId/update', async (req, res) => {
    try {
        const { productId } = req.params;
        const { location, event, details, status } = req.body;

        if (!location || !event) {
            return res.status(400).json({ 
                error: 'Missing required fields: location, event' 
            });
        }

        const timestamp = new Date().toISOString();
        const historyEntry = {
            timestamp,
            event,
            location,
            details: details || ''
        };

        if (db) {
            const productRef = db.collection('products').doc(productId);
            const doc = await productRef.get();

            if (!doc.exists) {
                return res.status(404).json({ 
                    error: 'Product not found' 
                });
            }

            // Update product with new history entry
            await productRef.update({
                currentLocation: location,
                status: status || 'in-transit',
                supplyChainHistory: admin.firestore.FieldValue.arrayUnion(historyEntry),
                lastUpdated: timestamp
            });

            res.json({
                success: true,
                message: 'Product updated successfully',
                data: historyEntry
            });
        } else {
            res.json({
                success: true,
                demo: true,
                message: 'Product would be updated in database',
                data: historyEntry
            });
        }

    } catch (error) {
        console.error('❌ Error updating product:', error);
        res.status(500).json({ 
            error: 'Failed to update product', 
            details: error.message 
        });
    }
});

// Get all products (for admin dashboard)
app.get('/api/products', async (req, res) => {
    try {
        const { limit = 50, manufacturer, status } = req.query;

        if (db) {
            let query = db.collection('products').limit(parseInt(limit));
            
            if (manufacturer) {
                query = query.where('manufacturer', '==', manufacturer);
            }
            if (status) {
                query = query.where('status', '==', status);
            }

            const snapshot = await query.get();
            const products = [];
            
            snapshot.forEach(doc => {
                products.push({
                    id: doc.id,
                    ...doc.data()
                });
            });

            res.json({
                success: true,
                count: products.length,
                data: products
            });
        } else {
            // Demo response
            res.json({
                success: true,
                demo: true,
                count: 3,
                data: [
                    {
                        productId: 'demo-1',
                        productName: 'Demo Smartphone',
                        manufacturer: 'TechCorp',
                        category: 'Electronics',
                        status: 'delivered',
                        registrationTime: '2025-07-14T15:00:00.000Z'
                    },
                    {
                        productId: 'demo-2',
                        productName: 'Demo Laptop',
                        manufacturer: 'ComputerCo',
                        category: 'Electronics',
                        status: 'in-transit',
                        registrationTime: '2025-07-14T14:00:00.000Z'
                    },
                    {
                        productId: 'demo-3',
                        productName: 'Demo T-Shirt',
                        manufacturer: 'FashionBrand',
                        category: 'Clothing',
                        status: 'registered',
                        registrationTime: '2025-07-14T13:00:00.000Z'
                    }
                ]
            });
        }

    } catch (error) {
        console.error('❌ Error fetching products:', error);
        res.status(500).json({ 
            error: 'Failed to fetch products', 
            details: error.message 
        });
    }
});

// === ANALYTICS ENDPOINTS ===

// Get dashboard analytics
app.get('/api/analytics/dashboard', async (req, res) => {
    try {
        if (db) {
            const productsRef = db.collection('products');
            const snapshot = await productsRef.get();
            
            let totalProducts = 0;
            let byStatus = {};
            let byManufacturer = {};
            let byCategory = {};

            snapshot.forEach(doc => {
                const data = doc.data();
                totalProducts++;
                
                byStatus[data.status] = (byStatus[data.status] || 0) + 1;
                byManufacturer[data.manufacturer] = (byManufacturer[data.manufacturer] || 0) + 1;
                byCategory[data.category] = (byCategory[data.category] || 0) + 1;
            });

            res.json({
                success: true,
                data: {
                    totalProducts,
                    byStatus,
                    byManufacturer,
                    byCategory,
                    generatedAt: new Date().toISOString()
                }
            });
        } else {
            // Demo analytics
            res.json({
                success: true,
                demo: true,
                data: {
                    totalProducts: 156,
                    byStatus: {
                        'registered': 45,
                        'in-transit': 67,
                        'delivered': 44
                    },
                    byManufacturer: {
                        'TechCorp': 89,
                        'FashionBrand': 34,
                        'FoodCo': 33
                    },
                    byCategory: {
                        'Electronics': 89,
                        'Clothing': 34,
                        'Food': 33
                    },
                    generatedAt: new Date().toISOString()
                }
            });
        }

    } catch (error) {
        console.error('❌ Error fetching analytics:', error);
        res.status(500).json({ 
            error: 'Failed to fetch analytics', 
            details: error.message 
        });
    }
});

// Start server
app.listen(port, () => {
    console.log(`🚀 TraceChain Backend listening at http://localhost:${port}`);
    console.log(`📊 Database: ${db ? 'Firebase Connected' : 'Demo Mode'}`);
    console.log(`🌐 CORS Origins: ${corsOrigins.join(', ')}`);
    console.log(`📋 Available endpoints:`);
    console.log(`   GET  /                              - Health check`);
    console.log(`   GET  /api/message                   - Simple message`);
    console.log(`   POST /api/products/register         - Register new product`);
    console.log(`   GET  /api/products/:id              - Get product details`);
    console.log(`   PUT  /api/products/:id/update       - Update product`);
    console.log(`   GET  /api/products                  - Get all products`);
    console.log(`   GET  /api/analytics/dashboard       - Get analytics`);
});

module.exports = app;
