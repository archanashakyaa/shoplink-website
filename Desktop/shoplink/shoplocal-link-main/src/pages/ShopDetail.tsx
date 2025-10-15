import React, { useState, useCallback, useEffect, useMemo } from "react";
import { MapPin, Star, Heart, Share2, Phone, Mail, Clock, Users, ShoppingBag, Plus, Loader2, AlertCircle, RefreshCw, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Navbar from "@/components/Navbar";
import ProductCard from "@/components/ProductCard";
import PhotoUpload from "@/components/PhotoUpload";
import { shopApi, productApi, photoApi, authApi, handleApiError, type Shop as ApiShop, type Product as ApiProduct, type ProductPhoto } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useParams, useNavigate } from "react-router-dom";

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

const ShopDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Core state
  const [shopData, setShopData] = useState<ApiShop | null>(null);
  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [productPhotos, setProductPhotos] = useState<{[productId: number]: ProductPhoto[]}>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [isLoadingPhotos, setIsLoadingPhotos] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Product list state for managing added products
  const [productList, setProductList] = useState<ApiProduct[]>([]);
  const [showProductList, setShowProductList] = useState(false);

  // Combined products state for display (API products + user-added products)
  const [displayProducts, setDisplayProducts] = useState<ApiProduct[]>([]);

  // Shop editing state
  const [isEditingShop, setIsEditingShop] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: '',
    category: '',
    description: '',
    location: '',
    phone: '',
    email: '',
    business_hours: '',
    image_url: '',
    is_online: true,
  });

  // Transform API Shop data to ShopDisplay format
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
  }, [shopData, products]);

  // Load shop data from API
  const loadShopData = useCallback(async (shopId: number) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await shopApi.getById(shopId);
      if (response.data) {
        setShopData(response.data);
      } else {
        setError(handleApiError(response.error || 'Failed to load shop'));
      }
    } catch (error) {
      setError('Failed to load shop data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load products for shop
  const loadProducts = useCallback(async (shopId: number) => {
    setIsLoadingProducts(true);
    console.log('🔄 Loading products for shop:', shopId);
    try {
      const response = await productApi.getByShopId(shopId);
      console.log('📦 Products API response:', response);
      console.log('📦 Response data type:', typeof response.data);
      console.log('📦 Response data is array:', Array.isArray(response.data));

      if (response.data && Array.isArray(response.data)) {
        console.log('✅ Products loaded:', response.data.length, 'products');
        if (response.data.length > 0) {
          console.log('📦 First product sample:', response.data[0]);
          console.log('📦 Product keys:', Object.keys(response.data[0]));
        }
        setProducts(response.data);

        // Clear any previous errors if products loaded successfully
        if (error && error.includes('products')) {
          setError(null);
        }
      } else {
        console.warn('⚠️ No products data in response or not an array:', response.data);
        console.warn('⚠️ Response data:', response.data);
        setProducts([]); // Set empty array instead of leaving undefined state
        setError(prev => prev || 'Failed to load products');
      }
    } catch (error) {
      console.error('❌ Error loading products:', error);
      setProducts([]); // Set empty array on error
      setError(prev => prev || 'Failed to load products');
    } finally {
      setIsLoadingProducts(false);
    }
  }, [error]);

  // Load product photos for all products
  const loadProductPhotos = useCallback(async (shopId: number) => {
    setIsLoadingPhotos(true);
    try {
      // For now, we'll use shop photos as product photos
      // In a real implementation, you'd fetch photos for each product
      const response = await photoApi.getByShopId(shopId);
      if (response.data) {
        // Group photos by product_id if available, otherwise associate with shop
        const photosByProduct: {[productId: number]: ProductPhoto[]} = {};

        response.data.forEach(photo => {
          const productId = photo.product_id || 0; // Use 0 for shop-level photos
          if (!photosByProduct[productId]) {
            photosByProduct[productId] = [];
          }
          photosByProduct[productId].push(photo);
        });

        setProductPhotos(photosByProduct);
      }
    } catch (error) {
      console.error('Failed to load product photos:', error);
    } finally {
      setIsLoadingPhotos(false);
    }
  }, []);

  // Initialize component
  useEffect(() => {
    if (id) {
      const shopId = parseInt(id);
      loadShopData(shopId);
      loadProducts(shopId);
      loadProductPhotos(shopId);
    }
  }, [id, loadShopData, loadProducts, loadProductPhotos]);

  // Combine API products with user-added products for display
  useEffect(() => {
    console.log('🔄 Combining products for display:', {
      apiProducts: products.length,
      listProducts: productList.length,
      isLoadingProducts,
      productsArray: products.slice(0, 2).map(p => ({ id: p.id, name: p.name })),
      listArray: productList.slice(0, 2).map(p => ({ id: p.id, name: p.name }))
    });

    if (isLoadingProducts) {
      console.log('⏳ Still loading products, skipping combine');
      return;
    }

    const combinedProducts = [...products];
    console.log('📦 Starting with API products count:', combinedProducts.length);

    // Add products from productList that aren't already in the API products
    productList.forEach(listProduct => {
      const existsInApi = products.some(apiProduct => apiProduct.id === listProduct.id);
      if (!existsInApi) {
        console.log('➕ Adding product to display:', listProduct.name, 'ID:', listProduct.id);
        combinedProducts.push(listProduct);
      } else {
        console.log('⏭️ Skipping duplicate product:', listProduct.name, 'ID:', listProduct.id);
      }
    });

    console.log('✅ Final display products count:', combinedProducts.length);
    console.log('📦 Final products:', combinedProducts.map(p => ({ id: p.id, name: p.name })));

    setDisplayProducts(combinedProducts);

    // If no products at all and not loading, show appropriate message
    if (combinedProducts.length === 0 && !isLoadingProducts) {
      console.log('⚠️ No products available to display');
    }
  }, [products, productList, isLoadingProducts]);

  // Debug logging to track state changes
  useEffect(() => {
    console.log('🔍 ShopDetail Debug:', {
      productsCount: products.length,
      productListCount: productList.length,
      displayProductsCount: displayProducts.length,
      shopData: shopData ? { id: shopData.id, name: shopData.name } : null,
      isLoadingProducts,
      error
    });
  }, [products, productList, displayProducts, shopData, isLoadingProducts, error]);

  // Handle adding product to list
  const handleAddToList = useCallback(async (product: ApiProduct) => {
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

      // Don't directly modify displayProducts - let the useEffect handle it
      return [...prev, product];
    });
    setShowProductList(true);
  }, [toast]);

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

        // Don't directly modify displayProducts - let the useEffect handle it
      }

      return newList;
    });
  }, [toast]);

  // Handle clearing entire product list
  const handleClearList = useCallback(() => {
    setProductList([]);
    toast({
      title: "List cleared",
      description: "All products have been removed from your list.",
    });
  }, [toast]);

  // Handle add new product
  const handleAddNewProduct = useCallback(async () => {
    if (!shopData) {
      toast({
        title: "Error",
        description: "Shop data not available. Please try again.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Check if we have a valid token
      const token = localStorage.getItem('access_token');
      console.log('🔑 Current token:', token ? `${token.substring(0, 20)}...` : 'No token');

      if (!token) {
        toast({
          title: "Authentication required",
          description: "Please log in to add products. Click here to go to login.",
          variant: "destructive",
        });

        // Optionally redirect to login page
        setTimeout(() => {
          navigate('/auth');
        }, 2000);

        return;
      }

      // Test token validity by making a quick API call
      try {
        console.log('🔑 Testing token validity...');
        const userResponse = await authApi.getCurrentUser();
        if (userResponse.error) {
          console.error('❌ Invalid token:', userResponse.error);
          toast({
            title: "Session expired",
            description: "Please log in again to continue.",
            variant: "destructive",
          });
          navigate('/auth');
          return;
        }
        console.log('✅ Token is valid');
      } catch (error) {
        console.error('❌ Token validation failed:', error);
        toast({
          title: "Authentication error",
          description: "Please log in again.",
          variant: "destructive",
        });
        navigate('/auth');
        return;
      }

      // For demo purposes, we'll create a sample product
      // In a real app, this would open a form or navigate to a product creation page
      const newProduct = {
        name: `New Product ${Date.now()}`,
        description: "A new product added to the shop",
        price: 999,
        original_price: 1299,
        discount_percentage: 23,
        image_url: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&q=80",
        stock_quantity: 10,
        is_available: true,
        is_in_stock: true,
      };

      console.log('🆕 Creating new product for shop:', shopData.id);
      console.log('🆕 Product data:', newProduct);

      const response = await productApi.create(shopData.id, newProduct);
      console.log('🆕 Create product response:', response);

      if (response.data && response.data.product_id) {
        toast({
          title: "Product added!",
          description: `New product has been successfully added to the shop. Product ID: ${response.data.product_id}`,
        });

        // Refresh products to show the new product
        console.log('🔄 Refreshing products after adding new product');
        await loadProducts(shopData.id);

        // Also refresh shop data to update product count
        try {
          console.log('🔄 Refreshing shop data to update product count');
          const shopResponse = await shopApi.getById(shopData.id);
          if (shopResponse.data) {
            setShopData(shopResponse.data);
            console.log('✅ Shop data refreshed. New product count:', shopResponse.data.product_count);
          }
        } catch (shopError) {
          console.warn('Failed to refresh shop data:', shopError);
        }
      } else {
        console.error('❌ Failed to create product:', response.error);
        console.error('❌ Response object:', response);
        toast({
          title: "Failed to add product",
          description: handleApiError(response.error || 'Unknown error'),
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('❌ Error creating product:', error);
      toast({
        title: "Error",
        description: "Failed to add new product. Please try again.",
        variant: "destructive",
      });
    }
  }, [shopData, toast, loadProducts]);

  // Initialize edit form data when shop data loads
  useEffect(() => {
    if (shopData && isEditingShop) {
      setEditFormData({
        name: shopData.name,
        category: shopData.category,
        description: shopData.description,
        location: shopData.location,
        phone: shopData.phone,
        email: shopData.email || '',
        business_hours: shopData.business_hours || '',
        image_url: shopData.image_url || '',
        is_online: Boolean(shopData.is_online),
      });
    }
  }, [shopData, isEditingShop]);

  // Handle shop edit toggle
  const handleEditShop = useCallback(() => {
    setIsEditingShop(!isEditingShop);
  }, [isEditingShop]);

  // Handle shop update
  const handleUpdateShop = useCallback(async () => {
    if (!shopData) return;

    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        toast({
          title: "Authentication required",
          description: "Please log in to edit shop details.",
          variant: "destructive",
        });
        navigate('/auth');
        return;
      }

      // Test token validity
      try {
        console.log('🔑 Testing token validity for shop update...');
        const userResponse = await authApi.getCurrentUser();
        if (userResponse.error) {
          console.error('❌ Invalid token for shop update:', userResponse.error);
          toast({
            title: "Session expired",
            description: "Please log in again to continue.",
            variant: "destructive",
          });
          navigate('/auth');
          return;
        }
        console.log('✅ Token is valid for shop update');
      } catch (error) {
        console.error('❌ Token validation failed for shop update:', error);
        toast({
          title: "Authentication error",
          description: "Please log in again.",
          variant: "destructive",
        });
        navigate('/auth');
        return;
      }

      console.log('� Updating shop:', shopData.id);
      console.log('📝 Update data:', editFormData);

      const response = await shopApi.update(shopData.id, editFormData);
      console.log('📝 Update response:', response);

      if (response.data) {
        toast({
          title: "Shop updated!",
          description: "Shop details have been successfully updated.",
        });

        setIsEditingShop(false);
        // Refresh shop data
        await loadShopData(shopData.id);
      } else {
        console.error('❌ Failed to update shop:', response.error);
        toast({
          title: "Failed to update shop",
          description: handleApiError(response.error || 'Unknown error'),
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('❌ Error updating shop:', error);
      toast({
        title: "Error",
        description: "Failed to update shop. Please try again.",
        variant: "destructive",
      });
    }
  }, [shopData, editFormData, toast, loadShopData]);

  // Handle edit form input changes
  const handleEditFormChange = useCallback((field: string, value: string | boolean) => {
    setEditFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  }, []);

  // Manual refresh function for testing
  const handleRefreshProducts = useCallback(() => {
    if (shopData) {
      console.log('🔄 Manual refresh triggered');
      loadProducts(shopData.id);
      loadProductPhotos(shopData.id);
    }
  }, [shopData, loadProducts, loadProductPhotos]);

  // Test function to manually add a product for debugging
  const handleTestAddProduct = useCallback(() => {
    const testProduct: ApiProduct = {
      id: Date.now(), // Use timestamp as ID for test products
      shop_id: shopData?.id || 0,
      name: `Test Product ${Date.now()}`,
      description: 'Test product for debugging',
      price: 599,
      original_price: 799,
      discount_percentage: 25,
      image_url: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&q=80',
      stock_quantity: 10,
      is_available: true,
      is_in_stock: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    console.log('🧪 Adding test product:', testProduct);
    setProducts(prev => [...prev, testProduct]);
  }, [shopData]);

  // Handle add to cart
  const handleAddToCart = useCallback((productId: string) => {
    const product = displayProducts.find(p => p.id.toString() === productId);
    if (product) {
      toast({
        title: "Added to cart",
        description: `${product.name} has been added to your cart.`,
      });
    } else {
      console.warn('Product not found for cart:', productId);
    }
  }, [displayProducts, toast]);

  // Handle share functionality
  const handleShare = useCallback(async () => {
    try {
      if (navigator.share && shopData) {
        await navigator.share({
          title: shopData.name,
          text: shopData.description,
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast({
          title: "Link copied!",
          description: "Shop link has been copied to clipboard.",
        });
      }
    } catch (error) {
      toast({
        title: "Share failed",
        description: "Unable to share the shop. Link copied to clipboard instead.",
        variant: "destructive",
      });
    }
  }, [shopData, toast]);

  // Handle call functionality
  const handleCall = useCallback(() => {
    if (!shopData?.phone) {
      toast({
        title: "Phone not available",
        description: "Contact information is not available for this shop.",
        variant: "destructive",
      });
      return;
    }

    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    const cleanPhone = shopData.phone.replace(/[\s\-\(\)]/g, '');

    if (!phoneRegex.test(cleanPhone)) {
      toast({
        title: "Invalid phone number",
        description: "The provided phone number format is not valid.",
        variant: "destructive",
      });
      return;
    }

    window.location.href = `tel:${cleanPhone}`;
  }, [shopData?.phone, toast]);

  // Handle directions
  const handleDirections = useCallback(() => {
    if (!shopData?.location) {
      toast({
        title: "Location not available",
        description: "Location information is not available for this shop.",
        variant: "destructive",
      });
      return;
    }

    const encodedLocation = encodeURIComponent(shopData.location);
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodedLocation}`, '_blank');
  }, [shopData?.location, toast]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-6xl mx-auto">
            <div className="text-center py-12">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Loading shop details...</h3>
              <p className="text-muted-foreground">Please wait while we fetch the shop information.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error || !shopData) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-6xl mx-auto">
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="flex items-center justify-between">
                <span>{error || 'Shop not found'}</span>
                <Button variant="outline" size="sm" onClick={() => navigate('/')}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Go Back
                </Button>
              </AlertDescription>
            </Alert>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Floating Product List Button */}
      {productList.length > 0 && (
        <div className="fixed bottom-6 right-6 z-50">
          <Button
            onClick={() => setShowProductList(!showProductList)}
            className="rounded-full h-14 w-14 shadow-lg hover:shadow-xl transition-all"
            size="icon"
          >
            <ShoppingBag className="h-6 w-6" />
            {productList.length > 0 && (
              <Badge className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 flex items-center justify-center text-xs">
                {productList.length}
              </Badge>
            )}
          </Button>
        </div>
      )}

      {/* Product List Panel */}
      {showProductList && productList.length > 0 && (
        <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setShowProductList(false)}>
          <div className="fixed bottom-0 left-0 right-0 bg-background rounded-t-3xl shadow-2xl z-50 max-h-[70vh] overflow-hidden">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Product List ({productList.length})</h3>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleClearList}>
                    Clear All
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setShowProductList(false)}>
                    ✕
                  </Button>
                </div>
              </div>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(70vh-120px)]">
              <div className="space-y-3">
                {productList.map((product) => (
                  <div key={product.id} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                    <img
                      src={product.image_url || '/placeholder.svg'}
                      alt={product.name}
                      className="w-12 h-12 object-cover rounded-lg flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium truncate">{product.name}</h4>
                      <p className="text-sm text-muted-foreground">₹{product.price}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveFromList(product.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-4 mb-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
              ← Back to Shops
            </Button>
            <Button variant="outline" size="sm" onClick={handleRefreshProducts}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={handleTestAddProduct}>
              🧪 Add Test Product
            </Button>
            <Button variant="outline" size="sm" onClick={handleEditShop}>
              {isEditingShop ? '✕ Cancel Edit' : '✏️ Edit Shop'}
            </Button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">{shopData.name}</h1>
              <p className="text-muted-foreground">{shopData.category}</p>
            </div>
            <div className="flex items-center gap-2">
              {Boolean(shopData.is_online) && (
                <Badge className="bg-accent text-accent-foreground">
                  Online Orders Available
                </Badge>
              )}
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-12">
          <div className="md:col-span-2">
            <div className="relative overflow-hidden rounded-2xl aspect-[16/9] shadow-xl mb-6">
              {shopData.image_url ? (
                <img
                  src={shopData.image_url}
                  alt={shopData.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-muted flex items-center justify-center">
                  <div className="text-center">
                    <ShoppingBag className="h-16 w-16 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Shop image not available</p>
                  </div>
                </div>
              )}
              <div className="absolute top-6 right-6 flex gap-3">
                <Button size="icon" variant="secondary" className="rounded-full shadow-lg" onClick={handleShare}>
                  <Share2 className="h-5 w-5" />
                </Button>
                <Button size="icon" variant="secondary" className="rounded-full shadow-lg">
                  <Heart className="h-5 w-5" />
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              {isEditingShop ? (
                // Edit mode
                <div className="space-y-4 p-6 border rounded-lg bg-muted/50">
                  <h2 className="text-2xl font-semibold mb-4">Edit Shop Details</h2>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Shop Name</label>
                      <input
                        type="text"
                        value={editFormData.name}
                        onChange={(e) => handleEditFormChange('name', e.target.value)}
                        className="w-full p-2 border rounded-md"
                        placeholder="Enter shop name"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Category</label>
                      <input
                        type="text"
                        value={editFormData.category}
                        onChange={(e) => handleEditFormChange('category', e.target.value)}
                        className="w-full p-2 border rounded-md"
                        placeholder="Enter category"
                      />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <label className="text-sm font-medium">Description</label>
                      <textarea
                        value={editFormData.description}
                        onChange={(e) => handleEditFormChange('description', e.target.value)}
                        className="w-full p-2 border rounded-md h-24"
                        placeholder="Enter shop description"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Location</label>
                      <input
                        type="text"
                        value={editFormData.location}
                        onChange={(e) => handleEditFormChange('location', e.target.value)}
                        className="w-full p-2 border rounded-md"
                        placeholder="Enter location"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Phone</label>
                      <input
                        type="text"
                        value={editFormData.phone}
                        onChange={(e) => handleEditFormChange('phone', e.target.value)}
                        className="w-full p-2 border rounded-md"
                        placeholder="Enter phone number"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Email</label>
                      <input
                        type="email"
                        value={editFormData.email}
                        onChange={(e) => handleEditFormChange('email', e.target.value)}
                        className="w-full p-2 border rounded-md"
                        placeholder="Enter email"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Business Hours</label>
                      <input
                        type="text"
                        value={editFormData.business_hours}
                        onChange={(e) => handleEditFormChange('business_hours', e.target.value)}
                        className="w-full p-2 border rounded-md"
                        placeholder="Enter business hours"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Image URL</label>
                      <input
                        type="url"
                        value={editFormData.image_url}
                        onChange={(e) => handleEditFormChange('image_url', e.target.value)}
                        className="w-full p-2 border rounded-md"
                        placeholder="Enter image URL"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={editFormData.is_online}
                          onChange={(e) => handleEditFormChange('is_online', e.target.checked)}
                          className="rounded"
                        />
                        <span className="text-sm font-medium">Online Orders Available</span>
                      </label>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button onClick={handleUpdateShop} className="flex-1">
                      Save Changes
                    </Button>
                    <Button variant="outline" onClick={handleEditShop} className="flex-1">
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                // View mode
                <>
                  <div className="flex items-start justify-between">
                    <div>
                      <h1 className="text-4xl font-bold mb-2">{shopData.name}</h1>
                      <p className="text-lg text-muted-foreground">{shopData.category}</p>
                    </div>
                    {Boolean(shopData.is_online) && (
                      <Badge className="bg-accent text-accent-foreground text-sm px-4 py-2">
                        Online Orders Available
                      </Badge>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-6">
                    <div className="flex items-center gap-2">
                      <Star className="h-5 w-5 fill-primary text-primary" />
                      <span className="text-xl font-semibold">{shopData.rating?.toFixed(1) || '0.0'}</span>
                      <span className="text-muted-foreground">({shopData.reviews_count || 0} reviews)</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Users className="h-5 w-5" />
                      <span>{shopData.followers_count || 0} followers</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <ShoppingBag className="h-5 w-5" />
                      <span>{shopData.product_count || 0} products</span>
                    </div>
                  </div>

                  <p className="text-base leading-relaxed">{shopData.description}</p>
                </>
              )}
            </div>
          </div>

          <div>
            <Card className="sticky top-24 shadow-lg">
              <CardContent className="p-6 space-y-4">
                <h3 className="font-semibold text-lg mb-4">Shop Information</h3>
                
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium">Location</p>
                      <p className="text-sm text-muted-foreground">{shopData.location}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Phone className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium">Phone</p>
                      <p className="text-sm text-muted-foreground">{shopData.phone}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Mail className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium">Email</p>
                      <p className="text-sm text-muted-foreground">{shopData.email}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Clock className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium">Business Hours</p>
                      <p className="text-sm text-muted-foreground">{shopData.business_hours || 'Not specified'}</p>
                    </div>
                  </div>
                </div>

                <div className="pt-4 space-y-2">
                  <Button className="w-full" size="lg" onClick={handleCall}>
                    <Phone className="h-4 w-4 mr-2" />
                    Call Now
                  </Button>
                  <Button className="w-full" size="lg" variant="outline" onClick={handleDirections}>
                    <MapPin className="h-4 w-4 mr-2" />
                    Get Directions
                  </Button>
                  <Button className="w-full" size="lg" variant="secondary">
                    <Heart className="h-4 w-4 mr-2" />
                    Follow Shop
                  </Button>
                  <Button className="w-full" size="lg" variant="outline" onClick={handleAddNewProduct}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add New Product
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <Tabs defaultValue="products" className="w-full">
          <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent">
            <TabsTrigger
              value="products"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
            >
              Products ({displayProducts.length})
            </TabsTrigger>
            <TabsTrigger
              value="photos"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
            >
              Photos
            </TabsTrigger>
            <TabsTrigger
              value="about"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
            >
              About
            </TabsTrigger>
            <TabsTrigger
              value="reviews"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
            >
              Reviews
            </TabsTrigger>
          </TabsList>

          <TabsContent value="products" className="mt-8">
            {(() => {
              console.log('🎯 Rendering products tab:', {
                isLoadingProducts,
                displayProductsLength: displayProducts.length,
                productsLength: products.length,
                productListLength: productList.length
              });

              return null; // This is just for debugging
            })()}

            {isLoadingProducts ? (
              <div className="flex items-center justify-center py-12" role="status" aria-live="polite">
                <Loader2 className="h-8 w-8 animate-spin mr-3" aria-hidden="true" />
                <span className="text-lg">Loading products...</span>
              </div>
            ) : displayProducts.length > 0 ? (
              <>
                {/* Debug info */}
                <div className="mb-4 p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    🔍 Debug: Displaying {displayProducts.length} products
                    {products.length > 0 && ` (${products.length} from API)`}
                    {productList.length > 0 && ` + ${productList.length} from list`}
                  </p>
                  <div className="mt-2 flex gap-2">
                    <Button variant="outline" size="sm" onClick={handleRefreshProducts}>
                      <RefreshCw className="h-3 w-3 mr-1" />
                      Refresh
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleTestAddProduct}>
                      🧪 Add Test
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 sm:gap-4 lg:gap-6">
                  {displayProducts.map((product, index) => {
                    console.log(`🖼️ Rendering product ${index + 1}:`, {
                      id: product.id,
                      name: product.name,
                      price: product.price,
                      image: product.image_url
                    });

                    return (
                      <div key={product.id} className="relative">
                        <ProductCard
                          id={product.id.toString()}
                          name={product.name}
                          price={product.price}
                          originalPrice={product.original_price}
                          image={product.image_url || '/placeholder.svg'}
                          inStock={product.is_in_stock}
                          discount={product.discount_percentage}
                          description={product.description}
                          category={shopData.category}
                          onAddToCart={handleAddToCart}
                          onAddToList={(productId) => {
                            const productToAdd = displayProducts.find(p => p.id.toString() === productId);
                            if (productToAdd) {
                              handleAddToList(productToAdd);
                            } else {
                              console.warn('Product not found for list:', productId);
                            }
                          }}
                          className="h-full"
                        />
                        {/* Debug label */}
                        <div className="absolute top-2 left-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded">
                          #{product.id}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="text-center py-12">
                <ShoppingBag className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No products available</h3>
                <p className="text-muted-foreground mb-4">
                  This shop hasn't added any products yet.
                </p>
                <div className="flex flex-col sm:flex-row gap-2 justify-center">
                  <Button variant="outline" onClick={handleRefreshProducts}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Try Again
                  </Button>
                  <Button variant="outline" onClick={handleTestAddProduct}>
                    🧪 Add Test Product
                  </Button>
                  <Button onClick={handleAddNewProduct}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add New Product
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="photos" className="mt-8">
            {/* Photo Upload Section */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Upload New Photos</h3>
              </div>
              <PhotoUpload
                onFilesChange={(files) => {
                  console.log('Files selected:', files);
                }}
                onUploadComplete={(uploadedFiles) => {
                  console.log('Upload completed:', uploadedFiles);
                  toast({
                    title: "Photos uploaded",
                    description: `${uploadedFiles.length} photo(s) uploaded successfully.`,
                  });
                  // Refresh photos after upload
                  if (shopData) {
                    loadProductPhotos(shopData.id);
                  }
                }}
                shopId={shopData?.id}
                maxFiles={5}
              />
            </div>

            {/* Existing Photos Display */}
            <div className="border-t pt-8">
              <h3 className="text-lg font-semibold mb-4">Existing Photos</h3>
              {isLoadingPhotos ? (
                <div className="flex items-center justify-center py-12" role="status" aria-live="polite">
                  <Loader2 className="h-8 w-8 animate-spin mr-3" aria-hidden="true" />
                  <span className="text-lg">Loading photos...</span>
                </div>
              ) : Object.keys(productPhotos).length > 0 ? (
                <div className="space-y-8">
                  {/* Shop-level photos */}
                  {productPhotos[0] && productPhotos[0].length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Shop Photos</h3>
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                        {productPhotos[0].map((photo) => (
                          <div key={photo.id} className="relative group">
                            <img
                              src={photo.photo_url}
                              alt={photo.caption || `${shopData.name} photo`}
                              className="w-full h-32 object-cover rounded-lg"
                              loading="lazy"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = '/placeholder.svg';
                              }}
                            />
                            {photo.caption && (
                              <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-2 rounded-b-lg">
                                {photo.caption}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Product-specific photos */}
                  {Object.entries(productPhotos)
                    .filter(([productId]) => parseInt(productId) > 0)
                    .map(([productId, photos]) => {
                      const product = displayProducts.find(p => p.id === parseInt(productId));
                      if (!product) {
                        console.warn('Product not found for photos:', productId);
                        return null;
                      }
                      return (
                        <div key={productId}>
                          <h3 className="text-lg font-semibold mb-4">
                            {product.name} Photos
                          </h3>
                          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                            {photos.map((photo) => (
                              <div key={photo.id} className="relative group">
                                <img
                                  src={photo.photo_url}
                                  alt={photo.caption || `${product.name} photo`}
                                  className="w-full h-32 object-cover rounded-lg"
                                  loading="lazy"
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.src = '/placeholder.svg';
                                  }}
                                />
                                {photo.caption && (
                                  <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-2 rounded-b-lg">
                                    {photo.caption}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <ImageIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No photos available</h3>
                  <p className="text-muted-foreground mb-4">
                    No photos have been uploaded for this shop yet.
                  </p>
                  <Button variant="outline" onClick={handleAddNewProduct}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Photos
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="about" className="mt-8">
            <Card>
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold mb-4">About {shopData.name}</h3>
                <p className="text-muted-foreground leading-relaxed mb-6">
                  {shopData.description} We pride ourselves on providing quality products and exceptional customer service. 
                  Visit us today and discover why we're the preferred choice for fashion enthusiasts in the area.
                </p>
                <h4 className="font-semibold mb-3">Why Choose Us?</h4>
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">✓</span>
                    <span>Wide range of products from trusted brands</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">✓</span>
                    <span>Competitive pricing and regular discounts</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">✓</span>
                    <span>Friendly and knowledgeable staff</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">✓</span>
                    <span>Easy returns and exchange policy</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reviews" className="mt-8">
            <Card>
              <CardContent className="p-6">
                <div className="text-center py-12">
                  <Star className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Customer reviews coming soon</h3>
                  <p className="text-muted-foreground">
                    Shop owners will be able to showcase customer reviews and ratings here.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ShopDetail;
