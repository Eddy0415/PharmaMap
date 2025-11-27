const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const inventorySchema = new Schema({
  pharmacy: { 
    type: Schema.Types.ObjectId, 
    ref: 'Pharmacy', 
    required: true 
  },
  item: { 
    type: Schema.Types.ObjectId, 
    ref: 'Item', 
    required: true 
  },
  
  // Stock
  quantity: { 
    type: Number, 
    required: true, 
    min: 0,
    default: 0 
  },
  
  // Price at this pharmacy
  price: { 
    type: Number, 
    required: true,
    min: 0
  },
  
  // Stock status
  stockStatus: {
    type: String,
    enum: ['in-stock', 'low-stock', 'out-of-stock'],
    default: function() {
      if (this.quantity === 0) return 'out-of-stock';
      if (this.quantity < this.lowStockThreshold) return 'low-stock';
      return 'in-stock';
    }
  },
  
  // Low stock threshold for notifications
  lowStockThreshold: { type: Number, default: 10 },
  
  // Availability
  isAvailable: { type: Boolean, default: true },
  
  // Stats
  totalOrders: { type: Number, default: 0 },
  
  // Timestamps
  lastRestocked: { type: Date },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Compound index: one item per pharmacy
inventorySchema.index({ pharmacy: 1, item: 1 }, { unique: true });
inventorySchema.index({ pharmacy: 1, stockStatus: 1 });

// Pre-save middleware to update stock status
inventorySchema.pre('save', function(next) {
  if (this.quantity === 0) {
    this.stockStatus = 'out-of-stock';
  } else if (this.quantity < this.lowStockThreshold) {
    this.stockStatus = 'low-stock';
  } else {
    this.stockStatus = 'in-stock';
  }
  next();
});

module.exports = mongoose.model('Inventory', inventorySchema);

