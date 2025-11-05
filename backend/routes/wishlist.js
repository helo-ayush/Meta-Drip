import express from 'express';
import Wishlist from '../models/Wishlist.js';

const router = express.Router();

// Get user's wishlist
router.get('/:userId', async (req, res) => {
  try {
    const wishlist = await Wishlist.findOne({ userId: req.params.userId })
      .populate('products');
    
    if (!wishlist) {
      return res.json({ products: [] });
    }
    
    res.json(wishlist);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add product to wishlist
router.post('/:userId/add/:productId', async (req, res) => {
  try {
    let wishlist = await Wishlist.findOne({ userId: req.params.userId });
    
    if (!wishlist) {
      wishlist = new Wishlist({
        userId: req.params.userId,
        products: [req.params.productId]
      });
    } else {
      // Check if product already in wishlist
      if (!wishlist.products.includes(req.params.productId)) {
        wishlist.products.push(req.params.productId);
      }
    }
    
    await wishlist.save();
    await wishlist.populate('products');
    
    res.json(wishlist);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Remove product from wishlist
router.delete('/:userId/remove/:productId', async (req, res) => {
  try {
    const wishlist = await Wishlist.findOne({ userId: req.params.userId });
    
    if (!wishlist) {
      return res.status(404).json({ error: 'Wishlist not found' });
    }
    
    wishlist.products = wishlist.products.filter(
      id => id.toString() !== req.params.productId
    );
    
    await wishlist.save();
    await wishlist.populate('products');
    
    res.json(wishlist);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Clear entire wishlist
router.delete('/:userId/clear', async (req, res) => {
  try {
    const wishlist = await Wishlist.findOne({ userId: req.params.userId });
    
    if (!wishlist) {
      return res.status(404).json({ error: 'Wishlist not found' });
    }
    
    wishlist.products = [];
    await wishlist.save();
    
    res.json(wishlist);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
