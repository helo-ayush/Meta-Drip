import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import { Button } from "@/components/ui/button";
import { Camera, Trash2, ShoppingBag, Heart } from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

const Wishlist = () => {
  const { user } = useUser();
  const { toast } = useToast();
  const [wishlistItems, setWishlistItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWishlist = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`http://localhost:5000/api/wishlist/${user.id}`);
        if (response.ok) {
          const data = await response.json();
          setWishlistItems(data.products || []);
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load wishlist",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchWishlist();
  }, [user]);

  const removeFromWishlist = async (productId: string) => {
    if (!user?.id) return;

    try {
      const response = await fetch(
        `http://localhost:5000/api/wishlist/${user.id}/remove/${productId}`,
        { method: "DELETE" }
      );

      if (response.ok) {
        setWishlistItems((prev) => prev.filter((item) => item._id !== productId));
        toast({
          title: "Removed",
          description: "Product removed from wishlist",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove product",
        variant: "destructive",
      });
    }
  };

  const clearWishlist = async () => {
    if (!user?.id || wishlistItems.length === 0) return;

    if (!confirm("Are you sure you want to clear your entire wishlist?")) return;

    try {
      const response = await fetch(
        `http://localhost:5000/api/wishlist/${user.id}/clear`,
        { method: "DELETE" }
      );

      if (response.ok) {
        setWishlistItems([]);
        toast({
          title: "Cleared",
          description: "Wishlist cleared successfully",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to clear wishlist",
        variant: "destructive",
      });
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen">
        <Navigation />
        <div className="container mx-auto px-4 py-20 text-center">
          <Heart className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-2xl font-bold mb-4">Sign in to view your wishlist</h2>
          <p className="text-muted-foreground mb-6">
            Save your favorite products and access them anytime
          </p>
        </div>
        <Footer />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen">
        <Navigation />
        <div className="container mx-auto px-4 py-20 text-center">
          <p className="text-lg text-muted-foreground">Loading wishlist...</p>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navigation />

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold mb-2">
                My <span className="gradient-text">Wishlist</span>
              </h1>
              <p className="text-muted-foreground text-lg">
                {wishlistItems.length} {wishlistItems.length === 1 ? "item" : "items"} saved
              </p>
            </div>
            {wishlistItems.length > 0 && (
              <Button variant="destructive" onClick={clearWishlist}>
                Clear All
              </Button>
            )}
          </div>
        </motion.div>

        {/* Empty State */}
        {wishlistItems.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <Heart className="w-24 h-24 mx-auto mb-6 text-muted-foreground" />
            <h2 className="text-2xl font-bold mb-4">Your wishlist is empty</h2>
            <p className="text-muted-foreground mb-6">
              Start adding products you love to your wishlist
            </p>
            <Button asChild variant="accent">
              <Link to="/store">Browse Products</Link>
            </Button>
          </motion.div>
        )}

        {/* Wishlist Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          <AnimatePresence>
            {wishlistItems.map((product, index) => (
              <motion.div
                key={product._id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ y: -8 }}
                className="group glass rounded-2xl overflow-hidden"
              >
                {/* Product Image */}
                <div className="relative aspect-square bg-gradient-to-br from-muted to-background p-6">
                  <Link to={`/product/${product._id}`}>
                    <motion.img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-contain"
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      transition={{ duration: 0.3 }}
                    />
                  </Link>
                  {product.badge && (
                    <div className="absolute top-3 right-3 bg-accent text-accent-foreground text-xs font-semibold px-3 py-1.5 rounded-full shadow-lg">
                      {product.badge}
                    </div>
                  )}
                  <motion.button
                    className="absolute top-3 left-3 w-9 h-9 bg-red-500 text-white rounded-full flex items-center justify-center shadow-md"
                    aria-label="Remove from wishlist"
                    onClick={() => removeFromWishlist(product._id)}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </motion.button>
                </div>

                {/* Product Info */}
                <div className="p-5 space-y-3">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                      {product.category}
                    </p>
                    <h3 className="font-semibold text-lg line-clamp-2">{product.name}</h3>
                  </div>

                  <p className="text-2xl font-bold text-primary">${product.price}</p>

                  {/* Actions */}
                  <div className="space-y-2 pt-2">
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      <Button asChild className="w-full" size="sm" variant="accent">
                        <Link to={`/try-on/${product._id}`}>
                          <Camera className="w-4 h-4 mr-2" />
                          Try On
                        </Link>
                      </Button>
                    </motion.div>
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      <Button asChild variant="glass" className="w-full" size="sm">
                        <Link to={`/product/${product._id}`}>View Details</Link>
                      </Button>
                    </motion.div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Wishlist;
