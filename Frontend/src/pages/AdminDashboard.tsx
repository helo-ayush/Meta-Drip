import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, LogOut, Package } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Product {
  _id: string;
  name: string;
  category: string;
  price: number;
  image: string;
  overlayImage: string;
  links: {
    amazon: string;
    flipkart: string;
    myntra: string;
    ajio: string;
    other: string;
  };
  badge: string;
  rating: number;
  reviews: number;
}

const AdminDashboard = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: "",
    category: "eyeglasses",
    price: "",
    badge: "",
    links: {
      amazon: "",
      flipkart: "",
      myntra: "",
      ajio: "",
      other: "",
    },
  });

  const [displayImage, setDisplayImage] = useState<string>("");
  const [overlayImage, setOverlayImage] = useState<string>("");

  const getAuthHeaders = () => {
    const token = localStorage.getItem("adminToken");
    if (!token) {
      navigate("/admin");
      return null;
    }
    return {
      "Content-Type": "application/json",
      "x-admin-token": token,
    };
  };

  const fetchProducts = async () => {
    const headers = getAuthHeaders();
    if (!headers) return;

    try {
      const response = await fetch("http://localhost:5000/api/admin/products", {
        headers,
      });

      if (response.ok) {
        const data = await response.json();
        setProducts(data);
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch products",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to connect to server",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, type: "display" | "overlay") => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        if (type === "display") {
          setDisplayImage(base64);
        } else {
          setOverlayImage(base64);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!displayImage || !overlayImage) {
      toast({
        title: "Missing Images",
        description: "Please upload both display and overlay images",
        variant: "destructive",
      });
      return;
    }

    const headers = getAuthHeaders();
    if (!headers) return;

    setLoading(true);

    try {
      const response = await fetch("http://localhost:5000/api/admin/products", {
        method: "POST",
        headers,
        body: JSON.stringify({
          ...formData,
          price: parseFloat(formData.price),
          image: displayImage,
          overlayImage: overlayImage,
        }),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Product created successfully",
        });
        setShowForm(false);
        resetForm();
        fetchProducts();
      } else {
        const data = await response.json();
        toast({
          title: "Error",
          description: data.error || "Failed to create product",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to connect to server",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;

    const headers = getAuthHeaders();
    if (!headers) return;

    try {
      const response = await fetch(`http://localhost:5000/api/admin/products/${id}`, {
        method: "DELETE",
        headers,
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Product deleted successfully",
        });
        fetchProducts();
      } else {
        toast({
          title: "Error",
          description: "Failed to delete product",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to connect to server",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      category: "eyeglasses",
      price: "",
      badge: "",
      links: {
        amazon: "",
        flipkart: "",
        myntra: "",
        ajio: "",
        other: "",
      },
    });
    setDisplayImage("");
    setOverlayImage("");
  };

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    navigate("/admin");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background p-4 md:p-8">
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-between items-center mb-8"
        >
          <div>
            <h1 className="text-4xl font-bold gradient-text mb-2">Admin Dashboard</h1>
            <p className="text-muted-foreground">Manage your product catalog</p>
          </div>
          <Button variant="glass" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </motion.div>

        {/* Add Product Button */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-6"
        >
          <Button variant="accent" onClick={() => setShowForm(!showForm)}>
            <Plus className="w-4 h-4 mr-2" />
            {showForm ? "Cancel" : "Add New Product"}
          </Button>
        </motion.div>

        {/* Product Form */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-8"
            >
              <Card className="glass">
                <CardHeader>
                  <CardTitle>Create New Product</CardTitle>
                  <CardDescription>Add a new product to your catalog</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Product Name</Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          required
                          className="glass-strong"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="category">Category</Label>
                        <Select
                          value={formData.category}
                          onValueChange={(value) => setFormData({ ...formData, category: value })}
                        >
                          <SelectTrigger className="glass-strong">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="eyeglasses">Eyeglasses</SelectItem>
                            <SelectItem value="sunglasses">Sunglasses</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="price">Price ($)</Label>
                        <Input
                          id="price"
                          type="number"
                          step="0.01"
                          value={formData.price}
                          onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                          required
                          className="glass-strong"
                        />
                      </div>

                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="badge">Badge (Optional)</Label>
                        <Input
                          id="badge"
                          value={formData.badge}
                          onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
                          placeholder="e.g., New, Popular"
                          className="glass-strong"
                        />
                      </div>
                    </div>

                    {/* Product Links */}
                    <div className="space-y-3">
                      <Label className="text-lg font-semibold">Product Links</Label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="amazon">Amazon Link</Label>
                          <Input
                            id="amazon"
                            type="url"
                            value={formData.links.amazon}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                links: { ...formData.links, amazon: e.target.value },
                              })
                            }
                            placeholder="https://amazon.com/..."
                            className="glass-strong"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="flipkart">Flipkart Link</Label>
                          <Input
                            id="flipkart"
                            type="url"
                            value={formData.links.flipkart}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                links: { ...formData.links, flipkart: e.target.value },
                              })
                            }
                            placeholder="https://flipkart.com/..."
                            className="glass-strong"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="myntra">Myntra Link</Label>
                          <Input
                            id="myntra"
                            type="url"
                            value={formData.links.myntra}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                links: { ...formData.links, myntra: e.target.value },
                              })
                            }
                            placeholder="https://myntra.com/..."
                            className="glass-strong"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="ajio">Ajio Link</Label>
                          <Input
                            id="ajio"
                            type="url"
                            value={formData.links.ajio}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                links: { ...formData.links, ajio: e.target.value },
                              })
                            }
                            placeholder="https://ajio.com/..."
                            className="glass-strong"
                          />
                        </div>

                        <div className="space-y-2 md:col-span-2">
                          <Label htmlFor="other">Other Link</Label>
                          <Input
                            id="other"
                            type="url"
                            value={formData.links.other}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                links: { ...formData.links, other: e.target.value },
                              })
                            }
                            placeholder="https://..."
                            className="glass-strong"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Image Uploads */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="displayImage">Display Image</Label>
                        <Input
                          id="displayImage"
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleImageUpload(e, "display")}
                          required
                          className="glass-strong"
                        />
                        {displayImage && (
                          <img src={displayImage} alt="Display" className="mt-2 w-32 h-32 object-contain rounded-lg glass p-2" />
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="overlayImage">AR Overlay Image (PNG)</Label>
                        <Input
                          id="overlayImage"
                          type="file"
                          accept="image/png"
                          onChange={(e) => handleImageUpload(e, "overlay")}
                          required
                          className="glass-strong"
                        />
                        {overlayImage && (
                          <img src={overlayImage} alt="Overlay" className="mt-2 w-32 h-32 object-contain rounded-lg glass p-2" />
                        )}
                      </div>
                    </div>

                    <Button type="submit" variant="accent" disabled={loading} className="w-full">
                      {loading ? "Creating..." : "Create Product"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Products List */}
        <div>
          <h2 className="text-2xl font-bold mb-4 flex items-center">
            <Package className="w-6 h-6 mr-2" />
            Products ({products.length})
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence>
              {products.map((product, index) => (
                <motion.div
                  key={product._id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="glass overflow-hidden">
                    <div className="aspect-square bg-gradient-to-br from-muted to-background p-4">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <CardContent className="p-4 space-y-3">
                      <div>
                        <p className="text-xs text-muted-foreground uppercase">{product.category}</p>
                        <h3 className="font-semibold text-lg">{product.name}</h3>
                      </div>
                      <p className="text-xl font-bold text-primary">${product.price}</p>
                      <div className="flex gap-2">
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(product._id)}
                          className="flex-1"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {products.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-20 glass rounded-2xl"
            >
              <Package className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground text-lg">No products yet. Add your first product!</p>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
