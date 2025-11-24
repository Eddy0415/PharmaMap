const mongoose = require('mongoose');

const medicationSchema = new mongoose.Schema({
    pharmacy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Pharmacy',
        required: true
    },
    name: {
        type: String,
        required: [true, 'Medication name is required'],
        trim: true
    },
    genericName: {
        type: String,
        trim: true
    },
    category: {
        type: String,
        required: [true, 'Category is required'],
        enum: [
            'Pain Relief',
            'Antibiotics',
            'Respiratory',
            'Cardiac Care',
            'Stomach Care',
            'Derma Products',
            'Oral Care',
            'Sexual Health',
            'Elderly Care',
            'Cold & Immunity',
            'Liver Care',
            'Other'
        ]
    },
    dosage: {
        type: String,
        trim: true
    },
    form: {
        type: String,
        enum: ['Tablet', 'Capsule', 'Syrup', 'Injection', 'Cream', 'Inhaler', 'Drops', 'Other'],
        default: 'Other'
    },
    manufacturer: {
        type: String,
        trim: true
    },
    price: {
        type: Number,
        required: [true, 'Price is required'],
        min: 0
    },
    stock: {
        type: Number,
        required: [true, 'Stock quantity is required'],
        min: 0,
        default: 0
    },
    stockStatus: {
        type: String,
        enum: ['in-stock', 'low-stock', 'out-of-stock'],
        default: function() {
            if (this.stock === 0) return 'out-of-stock';
            if (this.stock <= 10) return 'low-stock';
            return 'in-stock';
        }
    },
    description: {
        type: String,
        trim: true
    },
    sideEffects: {
        type: String,
        trim: true
    },
    prescriptionRequired: {
        type: Boolean,
        default: false
    },
    images: [{
        type: String
    }],
    barcode: {
        type: String,
        trim: true
    },
    expiryDate: {
        type: Date
    },
    active: {
        type: Boolean,
        default: true
    },
    searchCount: {
        type: Number,
        default: 0
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Update stock status before saving
medicationSchema.pre('save', function(next) {
    if (this.stock === 0) {
        this.stockStatus = 'out-of-stock';
    } else if (this.stock <= 10) {
        this.stockStatus = 'low-stock';
    } else {
        this.stockStatus = 'in-stock';
    }
    next();
});

// Index for text search
medicationSchema.index({ name: 'text', genericName: 'text', category: 'text' });

module.exports = mongoose.model('Medication', medicationSchema);
