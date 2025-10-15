import React, { useState, useCallback, useEffect, useMemo } from "react";
import { Store, Plus, Edit, AlertCircle, Loader2, LogIn, BarChart3, Trash2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Navbar from "@/components/Navbar";
import { shopApi, productApi, photoApi, authApi, handleApiError, type Shop as ApiShop, type Product as ApiProduct, type ProductPhoto as ApiProductPhoto } from "@/lib/api";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

// Import new components
import ShopForm from "@/components/ShopForm";
import ShopDisplay from "@/components/ShopDisplay";
import AnalyticsDashboard from "@/components/AnalyticsDashboard";

// Simplified TypeScript interfaces
interface ShopData {
  id: string;
  name: string;
  category: string;
  description: string;
  shopPhoto: string | null;
  location: string;
  phone: string;
  email: string;
  hours: string;
  rating: number;
  reviews: number;
  followers: number;
  productCount: number;
  isOnline: boolean;
  productPhotos: Array<{
    id: string;
    url: string;
    alt?: string;
  }>;
  products: Array<{
    id: string;
    name: string;
    price: number;
    originalPrice?: number;
    discount?: number;
    image: string;
    inStock: boolean;
    description?: string;
    category?: string;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

interface ShopFormData {
  name: string;
  category: string;
  description: string;
  shopPhoto: File | null;
  location: string;
  phone: string;
  email: string;
  hours: string;
  isOnline: boolean;
  productPhotos: File[];
  products: Array<{
    name: string;
    price: number;
    originalPrice?: number;
    discount?: number;
    image: string;
    inStock: boolean;
  }>;
}

const ListShop = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  // Core state
  const [shopData, setShopData] = useState<ApiShop | null>(null);
  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [photos, setPhotos] = useState<ApiProductPhoto[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [editingMode, setEditingMode] = useState<'none' | 'shop' | 'products'>('none');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingShop, setIsLoadingShop] = useState(true);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [isLoadingPhotos, setIsLoadingPhotos] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [currentShopId, setCurrentShopId] = useState<number | null>(null);
  const [currentView, setCurrentView] = useState<'shop' | 'analytics'>('shop');

  // Product list state for managing added products
  const [productList, setProductList] = useState<ApiProduct[]>([]);
  const [showProductList, setShowProductList] = useState(false);

  // Transform shop data for ShopDisplay component
  const transformedShopData = useMemo((): ShopData | null => {
    if (!shopData) return null;

    return {
      id: shopData.id.toString(),
      name: shopData.name,
      category: shopData.category,
      description: shopData.description,
      shopPhoto: shopData.image_url,
      location: shopData.location,
      phone: shopData.phone,
      email: shopData.email || '',
      hours: shopData.business_hours || '',
      rating: shopData.rating,
      reviews: shopData.reviews_count,
      followers: shopData.followers_count,
      productCount: shopData.product_count,
      isOnline: Boolean(shopData.is_online),
      productPhotos: photos.map(photo => ({
        id: photo.id.toString(),
        url: photo.photo_url,
        alt: `${shopData.name} product photo`
      })),
      products: products.map(product => ({
        id: product.id.toString(),
        name: product.name,
        price: product.price,
        originalPrice: product.original_price,
        discount: product.discount_percentage,
        image: product.image_url || '/placeholder.svg',
        inStock: product.is_in_stock,
        description: product.description,
        category: shopData.category
      })),
      createdAt: new Date(shopData.created_at),
      updatedAt: new Date(shopData.updated_at)
    };
  }, [shopData, photos, products]);

  // Form state
  const [formData, setFormData] = useState<ShopFormData>({
    name: '',
    category: '',
    description: '',
    shopPhoto: null,
    location: '',
    phone: '',
    email: '',
    hours: '',
    isOnline: false,
    productPhotos: [],
    products: []
  });

  // Transform API Shop data to ShopDisplay format
  const transformShopData = useCallback((apiShop: ApiShop): ShopData => {
    return {
      id: apiShop.id.toString(),
      name: apiShop.name,
      category: apiShop.category,
      description: apiShop.description,
      shopPhoto: apiShop.image_url,
      location: apiShop.location,
      phone: apiShop.phone,
      email: apiShop.email || '',
      hours: apiShop.business_hours || '',
      rating: apiShop.rating,
      reviews: apiShop.reviews_count,
      followers: apiShop.followers_count,
      productCount: apiShop.product_count,
      isOnline: Boolean(apiShop.is_online),
      productPhotos: photos.map(photo => ({
        id: photo.id.toString(),
        url: photo.photo_url,
        alt: `${apiShop.name} product photo`
      })),
      products: products.map(product => ({
        id: product.id.toString(),
        name: product.name,
        price: product.price,
        originalPrice: product.original_price,
        discount: product.discount_percentage,
        image: product.image_url || '/placeholder.svg',
        inStock: product.is_in_stock,
        description: product.description,
        category: apiShop.category
      })),
      createdAt: new Date(apiShop.created_at),
      updatedAt: new Date(apiShop.updated_at)
    };
  }, [photos, products]);

  // Load shop data from API
  const loadShopData = useCallback(async (shopId?: number) => {
    if (!shopId) return;

    console.log('🏪 Loading shop data for ID:', shopId);
    setIsLoadingShop(true);
    setErrors({});

    try {
      const response = await shopApi.getById(shopId);
      if (response.data) {
        setShopData(response.data);
        setCurrentShopId(shopId);
      } else {
        setErrors({ general: handleApiError(response.error || 'Failed to load shop') });
      }
    } catch (error) {
      setErrors({ general: 'Failed to load shop data' });
    } finally {
      setIsLoadingShop(false);
    }
  }, []);

  // Load products for shop
  const loadProducts = useCallback(async (shopId: number) => {
    setIsLoadingProducts(true);
    try {
      const response = await productApi.getByShopId(shopId);
      if (response.data) {
        setProducts(response.data);
      } else {
        setErrors(prev => ({ ...prev, products: handleApiError(response.error || 'Failed to load products') }));
      }
    } finally {
      setIsLoadingProducts(false);
    }
  }, []);

  // Load photos for shop
  const loadPhotos = useCallback(async (shopId: number) => {
    setIsLoadingPhotos(true);
    try {
      const response = await photoApi.getByShopId(shopId);
      if (response.data) {
        setPhotos(response.data);
      } else {
        setErrors(prev => ({ ...prev, photos: handleApiError(response.error || 'Failed to load photos') }));
      }
    } finally {
      setIsLoadingPhotos(false);
    }
  }, []);

  // Load all shop data
  const loadAllShopData = useCallback(async (shopId: number) => {
    await Promise.allSettled([
      loadShopData(shopId),
      loadProducts(shopId),
      loadPhotos(shopId)
    ]);
  }, [loadShopData, loadProducts, loadPhotos]);

  // Check authentication status
  const checkAuthentication = useCallback(async () => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      setIsAuthenticated(false);
      return false;
    }

    try {
      const response = await authApi.getCurrentUser();
      if (response.data) {
        setIsAuthenticated(true);
        return true;
      } else {
        setIsAuthenticated(false);
        localStorage.removeItem('access_token');
        return false;
      }
    } catch (error) {
      setIsAuthenticated(false);
      localStorage.removeItem('access_token');
      return false;
    }
  }, []);

  // Initialize component
  useEffect(() => {
    const initializeComponent = async () => {
      await checkAuthentication();

      try {
        const response = await shopApi.getAll();
        if (response.data && response.data.length > 0) {
          await loadAllShopData(response.data[0].id);
        }
      } catch (error) {
        setErrors({ general: 'Failed to load shops' });
      } finally {
        setIsLoadingShop(false);
      }
    };

    initializeComponent();
  }, [loadAllShopData, checkAuthentication]);


  // Form validation
  const validateForm = useCallback(() => {
    const newErrors: {[key: string]: string} = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Shop name is required';
    }

    if (!formData.category.trim()) {
      newErrors.category = 'Shop category is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Shop description is required';
    }

    if (!formData.location.trim()) {
      newErrors.location = 'Location is required';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    }

    if (!formData.hours.trim()) {
      newErrors.hours = 'Business hours are required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  // Handle form submission
  const handleFormSubmit = useCallback(async () => {
    if (!validateForm()) return;

    if (!isAuthenticated) {
      setErrors({ general: 'Please sign in to create and manage your shop listing' });
      navigate('/auth');
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      // TODO: Implement shop save logic using the form components
      console.log('Saving shop data...', formData);

      // For now, just simulate success
      setTimeout(() => {
        setEditingMode('none');
        setIsLoading(false);
      }, 1000);
    } catch (error) {
      setErrors({ general: 'Failed to save shop data' });
      setIsLoading(false);
    }
  }, [validateForm, formData, isAuthenticated, navigate]);

  // Handle edit mode
  const handleEditShop = useCallback(() => {
    if (!shopData) return;

    setEditingMode('shop');
    setFormData({
      name: shopData.name,
      category: shopData.category,
      description: shopData.description,
      shopPhoto: null,
      location: shopData.location,
      phone: shopData.phone,
      email: shopData.email || '',
      hours: shopData.business_hours || '',
      isOnline: Boolean(shopData.is_online),
      productPhotos: [],
      products: []
    });
    setErrors({});
  }, [shopData]);

  // Handle cancel edit
  const handleCancelEdit = useCallback(() => {
    setEditingMode('none');
    setFormData({
      name: '',
      category: '',
      description: '',
      shopPhoto: null,
      location: '',
      phone: '',
      email: '',
      hours: '',
      isOnline: false,
      productPhotos: [],
      products: []
    });
    setErrors({});
  }, []);

  // Handle edit products mode
  const handleEditProducts = useCallback(() => {
    if (!shopData) return;

    setEditingMode('products');
    setFormData({
      name: shopData.name,
      category: shopData.category,
      description: shopData.description,
      shopPhoto: null,
      location: shopData.location,
      phone: shopData.phone,
      email: shopData.email || '',
      hours: shopData.business_hours || '',
      isOnline: Boolean(shopData.is_online),
      productPhotos: [],
      products: products.map(product => ({
        name: product.name,
        price: product.price,
        originalPrice: product.original_price,
        discount: product.discount_percentage,
        image: product.image_url || '',
        inStock: product.is_in_stock
      }))
    });
    setErrors({});
  }, [shopData, products]);

  // Handle adding product to list
  const handleAddToList = useCallback((product: ApiProduct) => {
    setProductList(prev => {
      // Check for duplicates
      const isDuplicate = prev.some(p => p.id === product.id);
      if (isDuplicate) {
        toast({
          title: "Already in list",
          description: `${product.name} is already in your product list.`,
          variant: "destructive",
        });
        return prev;
      }

      toast({
        title: "Added to list",
        description: `${product.name} has been added to your product list.`,
      });
      return [...prev, product];
    });
    setShowProductList(true);
  }, []);

  // Handle removing product from list
  const handleRemoveFromList = useCallback((productId: number) => {
    setProductList(prev => {
      const productToRemove = prev.find(p => p.id === productId);
      const newList = prev.filter(p => p.id !== productId);

      if (productToRemove) {
        toast({
          title: "Removed from list",
          description: `${productToRemove.name} has been removed from your product list.`,
        });
      }

      return newList;
    });
  }, []);

  // Handle clearing entire product list
  const handleClearList = useCallback(() => {
    setProductList([]);
    toast({
      title: "List cleared",
      description: "All products have been removed from your list.",
    });
  }, []);

  // Render loading state
  if (isLoadingShop && !shopData) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center py-12">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Loading shop data...</h3>
              <p className="text-muted-foreground">Please wait while we fetch your shop information.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-full mb-4">
              <Store className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-4xl font-bold mb-2">List Your Shop</h1>
            <p className="text-muted-foreground">
              Create and manage your shop listing with photos and details
            </p>
          </div>

          {/* Authentication Status */}
          {!isAuthenticated && (
            <Card className="mb-6 border-amber-200 bg-amber-50">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-amber-800">
                    <LogIn className="h-4 w-4" />
                    <span>Please sign in to create and manage your shop listing</span>
                  </div>
                  <Button onClick={() => navigate('/auth')} variant="outline" size="sm">
                    <LogIn className="h-4 w-4 mr-2" />
                    Sign In
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Error Display */}
          {errors.general && (
            <Card className="mb-6 border-destructive">
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2 text-destructive">
                  <AlertCircle className="h-4 w-4" />
                  <span>{errors.general}</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Main Content Card */}
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {isLoadingShop && <Loader2 className="h-4 w-4 animate-spin" />}
                    {currentView === 'analytics'
                      ? 'Analytics Dashboard'
                      : (editingMode === 'shop'
                        ? 'Edit Shop Details'
                        : (editingMode === 'products'
                          ? 'Edit Products'
                          : (shopData ? shopData.name : 'Shop Details')))
                    }
                  </CardTitle>
                  <CardDescription>
                    {currentView === 'analytics'
                      ? 'View performance insights and analytics'
                      : (editingMode === 'shop'
                        ? 'Update your shop information and photos'
                        : (editingMode === 'products'
                          ? 'Add, edit, or remove products from your shop'
                          : 'Manage your shop listing'))
                    }
                  </CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                  {currentView === 'shop' && editingMode === 'none' && shopData && (
                    <>
                      <Button
                        onClick={isAuthenticated ? handleEditShop : () => navigate('/auth')}
                        variant="outline"
                        size="sm"
                      >
                        {isAuthenticated ? (
                          <>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Shop
                          </>
                        ) : (
                          <>
                            <LogIn className="h-4 w-4 mr-2" />
                            Sign In to Edit
                          </>
                        )}
                      </Button>
                      <Button
                        onClick={isAuthenticated ? handleEditProducts : () => navigate('/auth')}
                        variant="outline"
                        size="sm"
                      >
                        {isAuthenticated ? (
                          <>
                            <Plus className="h-4 w-4 mr-2" />
                            Edit Products
                          </>
                        ) : (
                          <>
                            <LogIn className="h-4 w-4 mr-2" />
                            Sign In to Edit
                          </>
                        )}
                      </Button>
                    </>
                  )}
                  {shopData && (
                    <>
                      <Button
                        variant={currentView === 'shop' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setCurrentView('shop')}
                      >
                        Shop Management
                      </Button>
                      <Button
                        variant={currentView === 'analytics' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setCurrentView('analytics')}
                      >
                        <BarChart3 className="h-4 w-4 mr-2" />
                        Analytics
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {currentView === 'analytics' && shopData ? (
                <AnalyticsDashboard
                  shopId={shopData.id}
                  shopName={shopData.name}
                />
              ) : editingMode !== 'none' ? (
                editingMode === 'products' ? (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold">Edit Products</h3>
                        <p className="text-sm text-muted-foreground">
                          Add, edit, or remove products from your shop
                        </p>
                      </div>
                      <Button variant="outline" onClick={handleCancelEdit}>
                        Cancel
                      </Button>
                    </div>

                    {/* Product Form Section */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label>Products ({formData.products.length})</Label>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const newProduct = {
                              name: '',
                              price: 0,
                              originalPrice: 0,
                              discount: 0,
                              image: '',
                              inStock: true
                            };
                            setFormData(prev => ({
                              ...prev,
                              products: [...prev.products, newProduct]
                            }));
                          }}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Product
                        </Button>
                      </div>

                      {formData.products.length > 0 ? (
                        <div className="space-y-4">
                          {formData.products.map((product, index) => (
                            <Card key={index} className="p-4">
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                <div className="space-y-2">
                                  <Label>Product Name</Label>
                                  <Input
                                    value={product.name}
                                    onChange={(e) => {
                                      const updatedProducts = [...formData.products];
                                      updatedProducts[index].name = e.target.value;
                                      setFormData(prev => ({ ...prev, products: updatedProducts }));
                                    }}
                                    placeholder="Product name"
                                  />
                                </div>

                                <div className="space-y-2">
                                  <Label>Price (₹)</Label>
                                  <Input
                                    type="number"
                                    value={product.price}
                                    onChange={(e) => {
                                      const updatedProducts = [...formData.products];
                                      updatedProducts[index].price = Number(e.target.value);
                                      setFormData(prev => ({ ...prev, products: updatedProducts }));
                                    }}
                                    placeholder="0"
                                  />
                                </div>

                                <div className="space-y-2">
                                  <Label>Original Price (₹)</Label>
                                  <Input
                                    type="number"
                                    value={product.originalPrice || ''}
                                    onChange={(e) => {
                                      const updatedProducts = [...formData.products];
                                      updatedProducts[index].originalPrice = Number(e.target.value) || 0;
                                      setFormData(prev => ({ ...prev, products: updatedProducts }));
                                    }}
                                    placeholder="0"
                                  />
                                </div>

                                <div className="flex items-end gap-2">
                                  <div className="flex items-center space-x-2">
                                    <input
                                      type="checkbox"
                                      id={`in-stock-${index}`}
                                      checked={product.inStock}
                                      onChange={(e) => {
                                        const updatedProducts = [...formData.products];
                                        updatedProducts[index].inStock = e.target.checked;
                                        setFormData(prev => ({ ...prev, products: updatedProducts }));
                                      }}
                                    />
                                    <Label htmlFor={`in-stock-${index}`}>In Stock</Label>
                                  </div>
                                  <Button
                                    type="button"
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => {
                                      setFormData(prev => ({
                                        ...prev,
                                        products: prev.products.filter((_, i) => i !== index)
                                      }));
                                    }}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            </Card>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          No products added yet. Click "Add Product" to get started.
                        </div>
                      )}

                      <div className="flex gap-2 pt-4">
                        <Button
                          onClick={() => {
                            // TODO: Implement product save logic
                            console.log('Saving products...', formData.products);
                            toast({
                              title: "Products saved!",
                              description: "Your product changes have been saved successfully.",
                            });
                            setEditingMode('none');
                          }}
                          className="flex-1"
                        >
                          <Save className="h-4 w-4 mr-2" />
                          Save Products
                        </Button>
                        <Button variant="outline" onClick={handleCancelEdit}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <ShopForm
                    formData={formData}
                    setFormData={setFormData}
                    errors={errors}
                    setErrors={setErrors}
                    onSubmit={handleFormSubmit}
                    onCancel={handleCancelEdit}
                    isLoading={isLoading}
                    isAuthenticated={isAuthenticated}
                  />
                )
              ) : shopData ? (
                <ShopDisplay
                  shopData={transformedShopData}
                  isLoadingProducts={isLoadingProducts}
                  isLoadingPhotos={isLoadingPhotos}
                  onEdit={handleEditShop}
                  isAuthenticated={isAuthenticated}
                  onAddToList={(productId) => {
                    // Find the product by ID and add it to the list
                    const product = products.find(p => p.id.toString() === productId);
                    if (product) {
                      handleAddToList(product);
                    }
                  }}
                />
              ) : (
                /* Empty State - No Shop Created Yet */
                <div className="text-center py-12">
                  <Store className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Ready to create your shop?</h3>
                  <p className="text-muted-foreground mb-4">
                    Start by creating your shop listing to showcase your business.
                  </p>
                  {isAuthenticated ? (
                    <Button onClick={() => setEditingMode('shop')}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Your Shop
                    </Button>
                  ) : (
                    <Button onClick={() => navigate('/auth')}>
                      <LogIn className="h-4 w-4 mr-2" />
                      Sign In to Create Shop
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ListShop;
