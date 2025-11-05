import { useParams, Link, useNavigate } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import { Button } from "@/components/ui/button";
import { Camera, Heart, Share2, Star, ArrowLeft, ShoppingBag, ThumbsUp } from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { API_ENDPOINTS } from "@/config/api";

const ProductDetail = () => {
  const { id } = useParams();
  const { user } = useUser();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedImage, setSelectedImage] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const [product, setProduct] = useState<any>(null);
  const [relatedProducts, setRelatedProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewStats, setReviewStats] = useState<{ averageRating: number; totalReviews: number; ratingDistribution: Record<number, number> }>({ averageRating: 0, totalReviews: 0, ratingDistribution: { 1:0,2:0,3:0,4:0,5:0 } });
  const [reviews, setReviews] = useState<any[]>([]);
  const [ratingInput, setRatingInput] = useState<number>(5);
  const [commentInput, setCommentInput] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [userReviewId, setUserReviewId] = useState<string | null>(null);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await fetch(`${API_ENDPOINTS.products}/${id}`);
        if (response.ok) {
          const data = await response.json();
          setProduct(data);
          
          // Fetch related products
          const allProductsResponse = await fetch(API_ENDPOINTS.products);
          if (allProductsResponse.ok) {
            const allProducts = await allProductsResponse.json();
            // Filter related products by same category, exclude current product
            const related = allProducts
              .filter((p: any) => p.category === data.category && p._id !== data._id)
              .slice(0, 3);
            setRelatedProducts(related);
          }
        } else {
          toast({
            title: "Error",
            description: "Product not found",
            variant: "destructive",
          });
          navigate("/store");
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load product",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchProduct();
    }
  }, [id, navigate, toast]);

  // Fetch reviews and stats
  useEffect(() => {
    const fetchReviews = async () => {
      if (!id) return;
      try {
        const [statsRes, reviewsRes] = await Promise.all([
          fetch(`${API_ENDPOINTS.reviews}/product/${id}/stats`),
          fetch(`${API_ENDPOINTS.reviews}/product/${id}`)
        ]);
        if (statsRes.ok) setReviewStats(await statsRes.json());
        if (reviewsRes.ok) {
          const list = await reviewsRes.json();
          setReviews(list);
        }
        // Prefill user's existing review
        if (user?.id) {
          const userRes = await fetch(`${API_ENDPOINTS.reviews}/product/${id}/user/${user.id}`);
          if (userRes.ok) {
            const data = await userRes.json();
            if (data?.hasReviewed && data.review) {
              setRatingInput(data.review.rating);
              setCommentInput(data.review.comment);
              setUserReviewId(data.review._id);
            }
          }
        }
      } catch (e) {
        // ignore
      }
    };
    fetchReviews();
  }, [id, user]);

  // Check if product is in wishlist
  useEffect(() => {
    const checkWishlist = async () => {
      if (!user?.id || !id) return;

      try {
        const response = await fetch(`${API_ENDPOINTS.wishlist}/${user.id}`);
        if (response.ok) {
          const data = await response.json();
          const isInWishlist = data.products.some((p: any) => p._id === id);
          setIsFavorite(isInWishlist);
        }
      } catch (error) {
        console.error("Failed to check wishlist", error);
      }
    };

    checkWishlist();
  }, [user, id]);

  if (loading) {
    return (
      <div className="min-h-screen">
        <Navigation />
        <div className="container mx-auto px-4 py-20 text-center">
          <p className="text-lg text-muted-foreground">Loading product...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return null;
  }

  return (
    <div className="min-h-screen">
      <Navigation />

      <div className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-6"
        >
          <Button variant="ghost" asChild>
            <Link to="/store">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Store
            </Link>
          </Button>
        </motion.div>

        {/* Product Section */}
        <div className="grid md:grid-cols-2 gap-12 mb-16">
          {/* Images */}
          <motion.div 
            className="space-y-4"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <motion.div 
              className="glass rounded-3xl overflow-hidden p-8 aspect-square"
              whileHover={{ scale: 1.02 }}
            >
              <motion.img
                src={product.image}
                alt={product.name}
                className="w-full h-full object-contain"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
              />
            </motion.div>
          </motion.div>

          {/* Product Info */}
          <motion.div 
            className="space-y-6"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <div>
              <motion.div 
                className="inline-block glass px-4 py-1.5 rounded-full mb-3"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
              >
                <span className="text-sm font-semibold text-accent">{product.category}</span>
              </motion.div>
              
              <motion.h1 
                className="text-4xl font-bold mb-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                {product.name}
              </motion.h1>
              
              {/* Rating */}
              <motion.div 
                className="flex items-center gap-4 mb-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-5 h-5 ${
                        i < Math.round(reviewStats.averageRating)
                          ? "fill-accent text-accent"
                          : "text-muted-foreground"
                      }`}
                    />
                  ))}
                  <span className="ml-2 font-semibold">{reviewStats.averageRating.toFixed(1)}</span>
                </div>
                <span className="text-sm text-muted-foreground">
                  {reviewStats.totalReviews} reviews
                </span>
              </motion.div>

              {/* Price */}
              <motion.div 
                className="flex items-baseline gap-3 mb-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <span className="text-4xl font-bold text-primary">${product.price}</span>
                {product.badge && (
                  <span className="glass-strong text-accent text-sm font-semibold px-3 py-1 rounded-full">
                    {product.badge}
                  </span>
                )}
              </motion.div>

              {/* Product Facts */}
              <motion.div 
                className="glass rounded-2xl p-5 mb-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <h3 className="font-semibold mb-3 text-primary">Product Details:</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-muted-foreground">Category:</span>
                    <span className="ml-2 font-medium capitalize">{product.category}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Average Rating:</span>
                    <span className="ml-2 font-medium">{reviewStats.averageRating.toFixed(1)} / 5</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Total Reviews:</span>
                    <span className="ml-2 font-medium">{reviewStats.totalReviews}</span>
                  </div>
                </div>
              </motion.div>

              {/* Write a Review */}
              <motion.div
                className="glass rounded-2xl p-5 mb-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                <h3 className="font-semibold mb-3 text-primary">Rate & Review</h3>
                {user ? (
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      if (!id) return;
                      setSubmitting(true);
                      try {
                        const res = await fetch(`${API_ENDPOINTS.reviews}/product/${id}`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            userId: user.id,
                            userName: user.fullName || user.username || 'User',
                            userEmail: user.primaryEmailAddress?.emailAddress || 'unknown@example.com',
                            rating: ratingInput,
                            comment: commentInput,
                          }),
                        });
                        if (res.ok) {
                          toast({ title: 'Thanks!', description: 'Your review has been saved.' });
                          // Refresh reviews and stats
                          const [statsRes, reviewsRes] = await Promise.all([
                            fetch(`${API_ENDPOINTS.reviews}/product/${id}/stats`),
                            fetch(`${API_ENDPOINTS.reviews}/product/${id}`)
                          ]);
                          if (statsRes.ok) setReviewStats(await statsRes.json());
                          if (reviewsRes.ok) setReviews(await reviewsRes.json());
                        } else {
                          const data = await res.json();
                          toast({ title: 'Error', description: data.error || 'Failed to save review', variant: 'destructive' });
                        }
                      } finally {
                        setSubmitting(false);
                      }
                    }}
                    className="space-y-3"
                  >
                    <div className="flex items-center gap-2">
                      {[1,2,3,4,5].map((val) => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => setRatingInput(val)}
                          className="focus:outline-none"
                          aria-label={`Rate ${val} star`}
                        >
                          <Star className={`w-6 h-6 ${val <= ratingInput ? 'fill-accent text-accent' : 'text-muted-foreground'}`} />
                        </button>
                      ))}
                      <span className="text-sm text-muted-foreground ml-2">{ratingInput} / 5</span>
                    </div>
                    <textarea
                      value={commentInput}
                      onChange={(e) => setCommentInput(e.target.value)}
                      placeholder="Share your thoughts about this product..."
                      className="w-full h-24 glass-strong rounded-md p-3 text-sm outline-none"
                      required
                    />
                    <div className="flex gap-2">
                      <Button type="submit" disabled={submitting} variant="accent">
                        {userReviewId ? 'Update Review' : 'Submit Review'}
                      </Button>
                    </div>
                  </form>
                ) : (
                  <p className="text-sm text-muted-foreground">Sign in to rate and review this product.</p>
                )}
              </motion.div>

              {/* Reviews List */}
              <motion.div
                className="glass rounded-2xl p-5"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
              >
                <h3 className="font-semibold mb-4 text-primary">Customer Reviews ({reviewStats.totalReviews})</h3>
                <div className="space-y-4">
                  {reviews.length === 0 && (
                    <p className="text-sm text-muted-foreground">No reviews yet. Be the first to review!</p>
                  )}
                  {reviews.map((r) => (
                    <div key={r._id} className="rounded-xl p-4 glass-strong">
                      <div className="flex items-center justify-between mb-1">
                        <div className="font-medium text-sm">{r.userName}</div>
                        <div className="text-xs text-muted-foreground">{new Date(r.createdAt).toLocaleDateString()}</div>
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        {[1,2,3,4,5].map((i) => (
                          <Star key={i} className={`w-4 h-4 ${i <= r.rating ? 'fill-accent text-accent' : 'text-muted-foreground'}`} />
                        ))}
                      </div>
                      <p className="text-sm">{r.comment}</p>
                      <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                        <button
                          className="inline-flex items-center gap-1 hover:text-foreground"
                          onClick={async () => {
                            const res = await fetch(`${API_ENDPOINTS.reviews}/${r._id}/helpful`, { method: 'POST' });
                            if (res.ok) {
                              // update helpful count locally
                              setReviews((prev) => prev.map((x) => x._id === r._id ? { ...x, helpful: (x.helpful || 0) + 1 } : x));
                            }
                          }}
                        >
                          <ThumbsUp className="w-3 h-3" /> Helpful ({r.helpful || 0})
                        </button>
                        {user?.id === r.userId && (
                          <button
                            className="hover:text-destructive"
                            onClick={async () => {
                              const res = await fetch(`${API_ENDPOINTS.reviews}/${r._id}`, {
                                method: 'DELETE',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ userId: user.id })
                              });
                              if (res.ok) {
                                setReviews((prev) => prev.filter((x) => x._id !== r._id));
                                const statsRes = await fetch(`${API_ENDPOINTS.reviews}/product/${id}/stats`);
                                if (statsRes.ok) setReviewStats(await statsRes.json());
                                toast({ title: 'Deleted', description: 'Your review was removed.' });
                              }
                            }}
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>

            {/* Action Buttons */}
            <motion.div 
              className="space-y-3"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 }}
            >
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button asChild size="xl" variant="accent" className="w-full">
                  <Link to={`/try-on/${product._id}`}>
                    <Camera className="w-5 h-5 mr-2" />
                    TRY ME
                  </Link>
                </Button>
              </motion.div>
              
              {/* Buy Links */}
              <motion.div 
                className="space-y-2"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1 }}
              >
                {product.links.amazon && (
                  <a href={product.links.amazon} target="_blank" rel="noopener noreferrer">
                    <Button variant="default" className="w-full">
                      <ShoppingBag className="w-4 h-4 mr-2" />
                      Buy on Amazon
                    </Button>
                  </a>
                )}
                {product.links.flipkart && (
                  <a href={product.links.flipkart} target="_blank" rel="noopener noreferrer">
                    <Button variant="default" className="w-full">
                      <ShoppingBag className="w-4 h-4 mr-2" />
                      Buy on Flipkart
                    </Button>
                  </a>
                )}
                {product.links.myntra && (
                  <a href={product.links.myntra} target="_blank" rel="noopener noreferrer">
                    <Button variant="default" className="w-full">
                      <ShoppingBag className="w-4 h-4 mr-2" />
                      Buy on Myntra
                    </Button>
                  </a>
                )}
                {product.links.ajio && (
                  <a href={product.links.ajio} target="_blank" rel="noopener noreferrer">
                    <Button variant="default" className="w-full">
                      <ShoppingBag className="w-4 h-4 mr-2" />
                      Buy on Ajio
                    </Button>
                  </a>
                )}
                {product.links.other && (
                  <a href={product.links.other} target="_blank" rel="noopener noreferrer">
                    <Button variant="default" className="w-full">
                      <ShoppingBag className="w-4 h-4 mr-2" />
                      Buy Now
                    </Button>
                  </a>
                )}
              </motion.div>
              
              <div className="flex gap-3">
                <motion.div className="flex-1" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button 
                    variant="glass" 
                    className="w-full"
                    onClick={async () => {
                      if (!user?.id) {
                        toast({
                          title: "Login Required",
                          description: "Please sign in to add items to your wishlist",
                          variant: "destructive",
                        });
                        return;
                      }

                      const endpoint = isFavorite ? 'remove' : 'add';
                      const method = isFavorite ? 'DELETE' : 'POST';

                      try {
                        const response = await fetch(
                          `${API_ENDPOINTS.wishlist}/${user.id}/${endpoint}/${id}`,
                          { method }
                        );

                        if (response.ok) {
                          setIsFavorite(!isFavorite);
                          toast({
                            title: isFavorite ? "Removed from wishlist" : "Added to wishlist",
                            description: isFavorite 
                              ? "Product removed from your wishlist" 
                              : "Product added to your wishlist",
                          });
                        }
                      } catch (error) {
                        toast({
                          title: "Error",
                          description: "Failed to update wishlist",
                          variant: "destructive",
                        });
                      }
                    }}
                  >
                    <Heart className={`w-4 h-4 mr-2 ${isFavorite ? "fill-current text-red-500" : ""}`} />
                    {isFavorite ? "Remove from Wishlist" : "Add to Wishlist"}
                  </Button>
                </motion.div>
                <motion.div className="flex-1" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button variant="glass" className="w-full">
                    <Share2 className="w-4 h-4 mr-2" />
                    Share
                  </Button>
                </motion.div>
              </div>
            </motion.div>

            {/* Shipping Info */}
            <motion.div 
              className="glass-strong rounded-2xl p-5 text-sm"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1 }}
            >
              <p className="font-medium mb-1 flex items-center gap-2">
                <span className="text-xl">🚚</span>
                Free shipping on orders over $50
              </p>
              <p className="text-muted-foreground">30-day returns policy</p>
            </motion.div>
          </motion.div>
        </div>

        {/* Related Products */}
        <div>
          <motion.h2 
            className="text-3xl font-bold mb-6"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            You Might Also <span className="gradient-text">Like</span>
          </motion.h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            {relatedProducts.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ y: -8 }}
              >
                <Link
                  to={`/product/${item._id}`}
                  className="block glass rounded-2xl overflow-hidden group"
                >
                  <div className="aspect-square bg-gradient-to-br from-muted to-background p-6">
                    <motion.img 
                      src={item.image} 
                      alt={item.name} 
                      className="w-full h-full object-contain"
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold mb-2 line-clamp-2">{item.name}</h3>
                    <p className="text-lg font-bold text-primary">${item.price}</p>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default ProductDetail;
