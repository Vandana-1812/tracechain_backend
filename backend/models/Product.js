const mongoose = require('mongoose');

// Supply Chain History Schema
const supplyChainHistorySchema = new mongoose.Schema({
    timestamp: {
        type: Date,
        default: Date.now,
        required: true
    },
    event: {
        type: String,
        required: true,
        trim: true
    },
    location: {
        type: String,
        required: true,
        trim: true
    },
    details: {
        type: String,
        trim: true,
        default: ''
    },
    updatedBy: {
        type: String,
        trim: true,
        default: 'System'
    },
    coordinates: {
        latitude: Number,
        longitude: Number
    }
});

// Product Schema
const productSchema = new mongoose.Schema({
    productId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    productName: {
        type: String,
        required: true,
        trim: true,
        maxlength: 200
    },
    manufacturer: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100
    },
    category: {
        type: String,
        required: true,
        trim: true,
        enum: ['Electronics', 'Clothing', 'Food', 'Pharmaceuticals', 'Automotive', 'Other']
    },
    description: {
        type: String,
        trim: true,
        maxlength: 1000,
        default: ''
    },
    origin: {
        type: String,
        trim: true,
        default: ''
    },
    certifications: [{
        type: String,
        trim: true
    }],
    batchNumber: {
        type: String,
        trim: true,
        default: ''
    },
    serialNumber: {
        type: String,
        trim: true,
        default: ''
    },
    status: {
        type: String,
        required: true,
        enum: ['registered', 'in-production', 'in-transit', 'delivered', 'recalled', 'disposed'],
        default: 'registered'
    },
    currentLocation: {
        type: String,
        trim: true,
        default: 'Unknown'
    },
    qrCode: {
        type: String, // Base64 encoded QR code image
        default: ''
    },
    supplyChainHistory: [supplyChainHistorySchema],
    
    // Metadata
    registrationTime: {
        type: Date,
        default: Date.now
    },
    lastUpdated: {
        type: Date,
        default: Date.now
    },
    isActive: {
        type: Boolean,
        default: true
    },
    
    // Additional product details
    weight: {
        value: Number,
        unit: {
            type: String,
            enum: ['kg', 'g', 'lb', 'oz'],
            default: 'kg'
        }
    },
    dimensions: {
        length: Number,
        width: Number,
        height: Number,
        unit: {
            type: String,
            enum: ['cm', 'mm', 'in', 'ft'],
            default: 'cm'
        }
    },
    price: {
        value: Number,
        currency: {
            type: String,
            default: 'USD'
        }
    },
    
    // Regulatory information
    regulatoryInfo: {
        fdaApproved: Boolean,
        ceMarking: Boolean,
        iso: [String],
        customsCode: String
    }
}, {
    timestamps: true, // Adds createdAt and updatedAt automatically
    versionKey: false
});

// Indexes for better query performance
productSchema.index({ productId: 1 });
productSchema.index({ manufacturer: 1 });
productSchema.index({ category: 1 });
productSchema.index({ status: 1 });
productSchema.index({ registrationTime: -1 });
productSchema.index({ 'supplyChainHistory.timestamp': -1 });

// Pre-save middleware to update lastUpdated
productSchema.pre('save', function(next) {
    this.lastUpdated = new Date();
    next();
});

// Virtual for product age
productSchema.virtual('age').get(function() {
    return Math.floor((Date.now() - this.registrationTime) / (1000 * 60 * 60 * 24)); // days
});

// Instance method to add supply chain event
productSchema.methods.addSupplyChainEvent = function(event, location, details, updatedBy = 'System') {
    this.supplyChainHistory.push({
        timestamp: new Date(),
        event,
        location,
        details,
        updatedBy
    });
    this.currentLocation = location;
    this.lastUpdated = new Date();
    return this.save();
};

// Static method to find products by manufacturer
productSchema.statics.findByManufacturer = function(manufacturer) {
    return this.find({ manufacturer: manufacturer, isActive: true });
};

// Static method to get analytics
productSchema.statics.getAnalytics = function() {
    return this.aggregate([
        { $match: { isActive: true } },
        {
            $group: {
                _id: null,
                totalProducts: { $sum: 1 },
                byStatus: {
                    $push: {
                        status: '$status',
                        count: 1
                    }
                },
                byCategory: {
                    $push: {
                        category: '$category',
                        count: 1
                    }
                },
                byManufacturer: {
                    $push: {
                        manufacturer: '$manufacturer',
                        count: 1
                    }
                }
            }
        }
    ]);
};

module.exports = mongoose.model('Product', productSchema);
