const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const orderSchema = new Schema({
  // Order reference
  orderNumber: { 
    type: String, 
    required: true, 
    unique: true 
  },
  
  // Customer
  customer: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  
  // Pharmacy
  pharmacy: { 
    type: Schema.Types.ObjectId, 
    ref: 'Pharmacy', 
    required: true 
  },
  
  // Items in order
  items: [{
    item: { 
      type: Schema.Types.ObjectId, 
      ref: 'Item', 
      required: true 
    },
    quantity: { 
      type: Number, 
      required: true, 
      min: 1 
    },
    priceAtOrder: { 
      type: Number, 
      required: true 
    },
    subtotal: { type: Number, required: true }
  }],
  
  // Total
  totalAmount: { 
    type: Number, 
    required: true 
  },
  
  // Status
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'ready', 'completed', 'cancelled'],
    default: 'pending'
  },
  
  // Notes
  customerNotes: { type: String },
  pharmacyNotes: { type: String },
  
  // Timestamps
  createdAt: { type: Date, default: Date.now },
  confirmedAt: { type: Date },
  completedAt: { type: Date },
  cancelledAt: { type: Date }
});

// Indexes
orderSchema.index({ customer: 1, createdAt: -1 });
orderSchema.index({ pharmacy: 1, status: 1 });
// Note: orderNumber index is automatically created by unique: true

module.exports = mongoose.model('Order', orderSchema);
