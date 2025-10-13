import React, { useState, useCallback, useEffect } from "react";
import { Store, Plus, Edit, AlertCircle, Loader2, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Navbar from "@/components/Navbar";
import { shopApi, productApi, photoApi, authApi, handleApiError, type Shop as ApiShop, type Product as ApiProduct, type ProductPhoto as ApiProductPhoto } from "@/lib/api";
import { useNavigate } from "react-router-dom";

// Import new components
import ShopForm from "@/components/ShopForm";
import ShopDisplay from "@/components/ShopDisplay";

// Simplified TypeScript interfaces
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

  // Core state
  const [shopData, setShopData] = useState<ApiShop | null>(null);
  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [photos, setPhotos] = useState<ApiProductPhoto[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingShop, setIsLoadingShop] = useState(true);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [isLoadingPhotos, setIsLoadingPhotos] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [currentShopId, setCurrentShopId] = useState<number | null>(null);

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
        setIsEditing(false);
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

    setIsEditing(true);
    setFormData({
      name: shopData.name,
      category: shopData.category,
      description: shopData.description,
      shopPhoto: null,
      location: shopData.location,
      phone: shopData.phone,
      email: shopData.email || '',
      hours: shopData.business_hours || '',
      isOnline: shopData.is_online,
      productPhotos: [],
      products: []
    });
    setErrors({});
  }, [shopData]);

  // Handle cancel edit
  const handleCancelEdit = useCallback(() => {
    setIsEditing(false);
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
                    {isEditing ? 'Edit Shop Details' : (shopData ? shopData.name : 'Shop Details')}
                  </CardTitle>
                  <CardDescription>
                    {isEditing ? 'Update your shop information and photos' : 'Manage your shop listing'}
                  </CardDescription>
                </div>
                {!isEditing && shopData && (
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
                )}
              </div>
            </CardHeader>
            <CardContent>
              {isEditing ? (
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
              ) : shopData ? (
                <ShopDisplay
                  shopData={shopData}
                  isLoadingProducts={isLoadingProducts}
                  isLoadingPhotos={isLoadingPhotos}
                  onEdit={handleEditShop}
                  isAuthenticated={isAuthenticated}
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
                    <Button onClick={() => setIsEditing(true)}>
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
