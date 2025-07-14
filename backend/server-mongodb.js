// Complete TraceChain Backend with MongoDB Atlas Integration
const express = require('express');
const cors = require('cors');
const path = require('path');
const QRCode = require('qrcode');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

// Import database and models
const dbConnection = require('./database/connection');
const Product = require('./models/Product');

const app = express();
const port = process.env.PORT || 3000;

// Initialize database connection
let dbConnected = false;

async function initializeDatabase() {
    try {
        await dbConnection.connect();
        dbConnected = dbConnection.isConnected;
        console.log('✅ Database initialization completed');
    } catch (error) {
        console.error('❌ Database initialization failed:', error.message);
        dbConnected = false;
    }
}

// Configure CORS
const corsOrigins = process.env.CORS_ORIGINS ? 
    process.env.CORS_ORIGINS.split(',') : 
    ['http://localhost:3000', 'http://localhost:8000', 'http://localhost:5500', 'http://127.0.0.1:8000'];

const corsOptions = {
    origin: corsOrigins,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
    optionsSuccessStatus: 204
};
app.use(cors(corsOptions));

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files (HTML, CSS, JS) from frontend directory
app.use(express.static(path.join(__dirname, '../frontend')));

// Request logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url} - Origin: ${req.headers.origin}`);
    next();
});

// === BASIC ENDPOINTS ===

// Health check
app.get('/', (req, res) => {
    const status = dbConnection.getConnectionStatus();
    res.json({ 
        message: 'TraceChain Backend with MongoDB is running!', 
        timestamp: new Date().toISOString(),
        database: {
            connected: dbConnected,
            status: status.readyState === 1 ? 'Connected' : 'Disconnected',
            host: status.host,
            dbName: status.name
        },
        version: '2.0.0-mongodb'
    });
});

// Simple message endpoint
app.get('/api/message', (req, res) => {
    res.json({ 
        message: 'Hello from TraceChain Backend with MongoDB!', 
        timestamp: new Date().toISOString(),
        database: dbConnected ? 'MongoDB Connected' : 'Demo Mode - No Database'
    });
});

// API health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'healthy',
        message: 'TraceChain Backend API is running',
        timestamp: new Date().toISOString(),
        database: dbConnected ? 'MongoDB Connected' : 'Demo Mode - No Database'
    });
});

// Database health check
app.get('/api/health/database', async (req, res) => {
    try {
        const healthCheck = await dbConnection.testConnection();
        res.json(healthCheck);
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Database health check failed',
            error: error.message
        });
    }
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
            batchNumber,
            serialNumber,
            weight,
            dimensions,
            price
        } = req.body;

        // Validate required fields
        if (!productName || !manufacturer || !category) {
            return res.status(400).json({ 
                error: 'Missing required fields: productName, manufacturer, category' 
            });
        }

        // Generate unique product ID
        const productId = uuidv4();
        const registrationTime = new Date();

        // Generate QR Code
        const qrCodeData = {
            productId,
            productName,
            manufacturer,
            scanUrl: `${req.protocol}://${req.get('host')}/api/products/${productId}`,
            generatedAt: registrationTime.toISOString()
        };
        
        const qrCodeDataUrl = await QRCode.toDataURL(JSON.stringify(qrCodeData), {
            errorCorrectionLevel: 'M',
            type: 'image/png',
            quality: 0.92,
            margin: 1,
            color: {
                dark: '#000000',
                light: '#FFFFFF'
            }
        });

        if (dbConnected) {
            // Create new product with MongoDB
            const productData = {
                productId,
                productName,
                manufacturer,
                category,
                description: description || '',
                origin: origin || '',
                certifications: certifications || [],
                batchNumber: batchNumber || '',
                serialNumber: serialNumber || '',
                qrCode: qrCodeDataUrl,
                currentLocation: origin || 'Unknown',
                weight: weight || {},
                dimensions: dimensions || {},
                price: price || {}
            };

            const product = new Product(productData);
            
            // Add initial supply chain event
            product.supplyChainHistory.push({
                timestamp: registrationTime,
                event: 'Product Registered',
                location: origin || 'Unknown',
                details: `Product ${productName} registered by ${manufacturer}`,
                updatedBy: 'System'
            });

            await product.save();
            
            console.log(`✅ Product ${productId} saved to MongoDB`);

            res.status(201).json({
                success: true,
                message: 'Product registered successfully',
                data: {
                    productId,
                    productName,
                    manufacturer,
                    category,
                    qrCode: qrCodeDataUrl,
                    registrationTime: product.registrationTime,
                    scanUrl: `${req.protocol}://${req.get('host')}/api/products/${productId}`,
                    status: product.status
                }
            });

        } else {
            // Demo mode response
            console.log(`📝 Demo mode: Product ${productId} would be saved to MongoDB`);
            
            res.status(201).json({
                success: true,
                demo: true,
                message: 'Product registered successfully (Demo Mode)',
                data: {
                    productId,
                    productName,
                    manufacturer,
                    category,
                    qrCode: qrCodeDataUrl,
                    registrationTime,
                    scanUrl: `${req.protocol}://${req.get('host')}/api/products/${productId}`,
                    status: 'registered'
                }
            });
        }

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

        if (dbConnected) {
            const product = await Product.findOne({ productId, isActive: true });
            
            if (!product) {
                return res.status(404).json({ 
                    error: 'Product not found',
                    productId 
                });
            }

            res.json({
                success: true,
                data: product
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
                            details: 'Demo product registration',
                            updatedBy: 'System'
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
        const { location, event, details, status, updatedBy } = req.body;

        if (!location || !event) {
            return res.status(400).json({ 
                error: 'Missing required fields: location, event' 
            });
        }

        if (dbConnected) {
            const product = await Product.findOne({ productId, isActive: true });

            if (!product) {
                return res.status(404).json({ 
                    error: 'Product not found',
                    productId 
                });
            }

            // Add new supply chain event
            await product.addSupplyChainEvent(event, location, details || '', updatedBy || 'System');
            
            // Update status if provided
            if (status) {
                product.status = status;
                await product.save();
            }

            res.json({
                success: true,
                message: 'Product updated successfully',
                data: {
                    productId,
                    currentLocation: product.currentLocation,
                    status: product.status,
                    lastUpdated: product.lastUpdated,
                    newEvent: product.supplyChainHistory[product.supplyChainHistory.length - 1]
                }
            });
        } else {
            res.json({
                success: true,
                demo: true,
                message: 'Product would be updated in MongoDB',
                data: {
                    productId,
                    event,
                    location,
                    details,
                    timestamp: new Date().toISOString()
                }
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
        const { limit = 50, manufacturer, status, category, page = 1 } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        if (dbConnected) {
            // Build query
            let query = { isActive: true };
            
            if (manufacturer) query.manufacturer = manufacturer;
            if (status) query.status = status;
            if (category) query.category = category;

            const products = await Product.find(query)
                .select('-qrCode') // Exclude QR code from list view for performance
                .sort({ registrationTime: -1 })
                .limit(parseInt(limit))
                .skip(skip)
                .lean(); // Use lean() for better performance

            const totalCount = await Product.countDocuments(query);

            res.json({
                success: true,
                count: products.length,
                totalCount,
                page: parseInt(page),
                totalPages: Math.ceil(totalCount / parseInt(limit)),
                data: products
            });
        } else {
            // Demo response
            res.json({
                success: true,
                demo: true,
                count: 3,
                totalCount: 3,
                page: 1,
                totalPages: 1,
                data: [
                    {
                        productId: 'demo-1',
                        productName: 'Demo Smartphone',
                        manufacturer: 'TechCorp',
                        category: 'Electronics',
                        status: 'delivered',
                        currentLocation: 'Customer',
                        registrationTime: '2025-07-14T15:00:00.000Z'
                    },
                    {
                        productId: 'demo-2',
                        productName: 'Demo Laptop',
                        manufacturer: 'ComputerCo',
                        category: 'Electronics',
                        status: 'in-transit',
                        currentLocation: 'Distribution Center',
                        registrationTime: '2025-07-14T14:00:00.000Z'
                    },
                    {
                        productId: 'demo-3',
                        productName: 'Demo T-Shirt',
                        manufacturer: 'FashionBrand',
                        category: 'Clothing',
                        status: 'registered',
                        currentLocation: 'Factory',
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
        if (dbConnected) {
            const [totalProducts, statusStats, categoryStats, manufacturerStats] = await Promise.all([
                Product.countDocuments({ isActive: true }),
                Product.aggregate([
                    { $match: { isActive: true } },
                    { $group: { _id: '$status', count: { $sum: 1 } } }
                ]),
                Product.aggregate([
                    { $match: { isActive: true } },
                    { $group: { _id: '$category', count: { $sum: 1 } } }
                ]),
                Product.aggregate([
                    { $match: { isActive: true } },
                    { $group: { _id: '$manufacturer', count: { $sum: 1 } } }
                ])
            ]);

            // Format aggregation results
            const byStatus = {};
            statusStats.forEach(item => byStatus[item._id] = item.count);

            const byCategory = {};
            categoryStats.forEach(item => byCategory[item._id] = item.count);

            const byManufacturer = {};
            manufacturerStats.forEach(item => byManufacturer[item._id] = item.count);

            res.json({
                success: true,
                data: {
                    totalProducts,
                    byStatus,
                    byCategory,
                    byManufacturer,
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
                    byCategory: {
                        'Electronics': 89,
                        'Clothing': 34,
                        'Food': 33
                    },
                    byManufacturer: {
                        'TechCorp': 89,
                        'FashionBrand': 34,
                        'FoodCo': 33
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

// Get supply chain analytics
app.get('/api/analytics/supply-chain', async (req, res) => {
    try {
        if (dbConnected) {
            const supplyChainStats = await Product.aggregate([
                { $match: { isActive: true } },
                { $unwind: '$supplyChainHistory' },
                {
                    $group: {
                        _id: {
                            event: '$supplyChainHistory.event',
                            location: '$supplyChainHistory.location'
                        },
                        count: { $sum: 1 },
                        lastOccurrence: { $max: '$supplyChainHistory.timestamp' }
                    }
                },
                { $sort: { count: -1 } },
                { $limit: 20 }
            ]);

            res.json({
                success: true,
                data: {
                    supplyChainEvents: supplyChainStats,
                    generatedAt: new Date().toISOString()
                }
            });
        } else {
            res.json({
                success: true,
                demo: true,
                data: {
                    supplyChainEvents: [
                        { _id: { event: 'Product Registered', location: 'Factory' }, count: 156, lastOccurrence: '2025-07-14T15:30:00.000Z' },
                        { _id: { event: 'Shipped', location: 'Distribution Center' }, count: 134, lastOccurrence: '2025-07-14T14:20:00.000Z' },
                        { _id: { event: 'Delivered', location: 'Customer' }, count: 44, lastOccurrence: '2025-07-14T13:10:00.000Z' }
                    ],
                    generatedAt: new Date().toISOString()
                }
            });
        }
    } catch (error) {
        console.error('❌ Error fetching supply chain analytics:', error);
        res.status(500).json({ 
            error: 'Failed to fetch supply chain analytics', 
            details: error.message 
        });
    }
});

// === SERVER STARTUP ===

async function startServer() {
    try {
        // Initialize database first
        await initializeDatabase();
        
        // Start server
        app.listen(port, () => {
            console.log(`🚀 TraceChain Backend with MongoDB listening at http://localhost:${port}`);
            console.log(`📊 Database: ${dbConnected ? 'MongoDB Connected' : 'Demo Mode'}`);
            console.log(`🌐 CORS Origins: ${corsOrigins.join(', ')}`);
            console.log(`📋 Available endpoints:`);
            console.log(`   GET  /                              - Health check`);
            console.log(`   GET  /api/message                   - Simple message`);
            console.log(`   GET  /api/health                    - API health check`);
            console.log(`   GET  /api/health/database           - Database health`);
            console.log(`   POST /api/products/register         - Register new product`);
            console.log(`   GET  /api/products/:id              - Get product details`);
            console.log(`   PUT  /api/products/:id/update       - Update product`);
            console.log(`   GET  /api/products                  - Get all products`);
            console.log(`   GET  /api/analytics/dashboard       - Get analytics`);
            console.log(`   GET  /api/analytics/supply-chain    - Supply chain analytics`);
        });
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
}

// Start the server
startServer();

module.exports = app;
