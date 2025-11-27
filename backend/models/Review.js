const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const reviewSchema = new Schema({
  // Who reviewed
  user: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  
  // What was reviewed
  pharmacy: { 
    type: Schema.Types.ObjectId, 
    ref: 'Pharmacy', 
    required: true 
  },
  
  // Rating & Review
  rating: { 
    type: Number, 
    required: true, 
    min: 1, 
    max: 5 
  },
  comment: { 
    type: String, 
    trim: true 
  },
  
  // Optional: related order
  order: { 
    type: Schema.Types.ObjectId, 
    ref: 'Order' 
  },
  
  // Timestamps
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// One review per user per pharmacy
reviewSchema.index({ user: 1, pharmacy: 1 }, { unique: true });
reviewSchema.index({ pharmacy: 1, createdAt: -1 });

// Middleware to update pharmacy average rating
reviewSchema.post('save', async function() {
  const Review = this.constructor;
  const pharmacy = await mongoose.model('Pharmacy').findById(this.pharmacy);
  
  if (!pharmacy) return;
  
  const stats = await Review.aggregate([
    { $match: { pharmacy: this.pharmacy } },
    { 
      $group: { 
        _id: null, 
        avgRating: { $avg: '$rating' },
        count: { $sum: 1 }
      }
    }
  ]);
  
  if (stats.length > 0) {
    pharmacy.averageRating = Math.round(stats[0].avgRating * 10) / 10;
    pharmacy.totalReviews = stats[0].count;
    await pharmacy.save();
  }
});

module.exports = mongoose.model('Review', reviewSchema);

