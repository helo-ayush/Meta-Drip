import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    required: true,
    enum: ['eyeglasses', 'sunglasses'],
    default: 'eyeglasses'
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  image: {
    type: String,
    required: true // Base64 encoded image
  },
  overlayImage: {
    type: String,
    required: true // Base64 encoded PNG for AR overlay
  },
  links: {
    amazon: {
      type: String,
      default: ''
    },
    flipkart: {
      type: String,
      default: ''
    },
    myntra: {
      type: String,
      default: ''
    },
    ajio: {
      type: String,
      default: ''
    },
    other: {
      type: String,
      default: ''
    }
  },
  badge: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

export default mongoose.model('Product', productSchema);
