import express from 'express';
import Review from '../models/Review.js';
import mongoose from 'mongoose';

const router = express.Router();

// Get all reviews for a product
router.get('/product/:productId', async (req, res) => {
  try {
    const reviews = await Review.find({ productId: req.params.productId })
      .sort({ createdAt: -1 });
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get product rating statistics
router.get('/product/:productId/stats', async (req, res) => {
  try {
    const reviews = await Review.find({ productId: req.params.productId });
    
    if (reviews.length === 0) {
      return res.json({
        averageRating: 0,
        totalReviews: 0,
        ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
      });
    }

    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = totalRating / reviews.length;

    const ratingDistribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach(review => {
      ratingDistribution[review.rating]++;
    });

    res.json({
      averageRating: Math.round(averageRating * 10) / 10,
      totalReviews: reviews.length,
      ratingDistribution
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Check if user has reviewed a product
router.get('/product/:productId/user/:userId', async (req, res) => {
  try {
    const review = await Review.findOne({
      productId: req.params.productId,
      userId: req.params.userId
    });
    res.json({ hasReviewed: !!review, review });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create or update a review
router.post('/product/:productId', async (req, res) => {
  try {
    const { userId, userName, userEmail, rating, comment } = req.body;

    if (!userId || !userName || !userEmail || !rating || !comment) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    // Check if review already exists
    let review = await Review.findOne({
      productId: req.params.productId,
      userId
    });

    if (review) {
      // Update existing review
      review.rating = rating;
      review.comment = comment;
      review.userName = userName;
      review.userEmail = userEmail;
      await review.save();
    } else {
      // Create new review
      review = new Review({
        productId: req.params.productId,
        userId,
        userName,
        userEmail,
        rating,
        comment
      });
      await review.save();
    }

    res.status(201).json(review);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete a review
router.delete('/:reviewId', async (req, res) => {
  try {
    const review = await Review.findById(req.params.reviewId);
    
    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }

    // Verify user owns the review
    if (review.userId !== req.body.userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    await Review.findByIdAndDelete(req.params.reviewId);
    res.json({ success: true, message: 'Review deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Mark review as helpful
router.post('/:reviewId/helpful', async (req, res) => {
  try {
    const review = await Review.findById(req.params.reviewId);
    
    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }

    review.helpful += 1;
    await review.save();

    res.json(review);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
