import mongoose from 'mongoose';

const wishlistSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  products: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }]
}, {
  timestamps: true
});

// Ensure one wishlist per user
wishlistSchema.index({ userId: 1 }, { unique: true });

export default mongoose.model('Wishlist', wishlistSchema);
