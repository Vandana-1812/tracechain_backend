const mongoose = require('mongoose');
require('dotenv').config();

class DatabaseConnection {
    constructor() {
        this.isConnected = false;
        this.connectionString = process.env.MONGODB_URI || 'mongodb://localhost:27017/tracechain';
        this.dbName = process.env.MONGODB_DB_NAME || 'tracechain';
    }

    async connect() {
        try {
            if (this.isConnected) {
                console.log('🔄 Already connected to MongoDB');
                return;
            }

            // MongoDB connection options
            const options = {
                useNewUrlParser: true,
                useUnifiedTopology: true,
                maxPoolSize: 10, // Maintain up to 10 socket connections
                serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
                socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
                family: 4, // Use IPv4, skip trying IPv6
                dbName: this.dbName
            };

            await mongoose.connect(this.connectionString, options);
            
            this.isConnected = true;
            console.log('✅ Connected to MongoDB Atlas successfully');
            console.log(`📊 Database: ${this.dbName}`);
            
            // Set up connection event listeners
            this.setupEventListeners();
            
        } catch (error) {
            console.error('❌ MongoDB connection error:', error.message);
            this.isConnected = false;
            
            // For development, we'll continue without database
            if (process.env.NODE_ENV === 'development') {
                console.log('⚠️  Continuing in demo mode without database...');
                return;
            }
            
            throw error;
        }
    }

    setupEventListeners() {
        mongoose.connection.on('connected', () => {
            console.log('🔗 Mongoose connected to MongoDB');
        });

        mongoose.connection.on('error', (err) => {
            console.error('❌ Mongoose connection error:', err);
            this.isConnected = false;
        });

        mongoose.connection.on('disconnected', () => {
            console.log('🔌 Mongoose disconnected from MongoDB');
            this.isConnected = false;
        });

        // Handle application termination
        process.on('SIGINT', () => {
            mongoose.connection.close(() => {
                console.log('🛑 Mongoose connection closed through app termination');
                process.exit(0);
            });
        });
    }

    async disconnect() {
        try {
            await mongoose.connection.close();
            this.isConnected = false;
            console.log('🔌 Disconnected from MongoDB');
        } catch (error) {
            console.error('❌ Error disconnecting from MongoDB:', error);
        }
    }

    getConnectionStatus() {
        return {
            isConnected: this.isConnected,
            readyState: mongoose.connection.readyState,
            host: mongoose.connection.host,
            port: mongoose.connection.port,
            name: mongoose.connection.name
        };
    }

    async testConnection() {
        try {
            if (!this.isConnected) {
                throw new Error('Not connected to database');
            }

            // Simple ping to test connection
            await mongoose.connection.db.admin().ping();
            return {
                success: true,
                message: 'Database connection is healthy',
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            return {
                success: false,
                message: 'Database connection failed',
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }
}

// Export singleton instance
module.exports = new DatabaseConnection();
