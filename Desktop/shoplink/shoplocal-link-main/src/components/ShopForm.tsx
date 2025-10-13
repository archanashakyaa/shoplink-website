import React, { useState, useCallback } from 'react';
import { MapPin, Upload, X, Save, Loader2, AlertCircle, Plus, Trash2, Image as ImageIcon } from 'lucide-react';
import PlacesAutocomplete from 'react-places-autocomplete';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { uploadApi, handleApiError } from "@/lib/api";

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

interface ShopFormProps {
  formData: ShopFormData;
  setFormData: React.Dispatch<React.SetStateAction<ShopFormData>>;
  errors: { [key: string]: string };
  setErrors: React.Dispatch<React.SetStateAction<{ [key: string]: string }>>;
  onSubmit: () => void;
  onCancel: () => void;
  isLoading: boolean;
  isAuthenticated: boolean;
}

const ShopForm: React.FC<ShopFormProps> = ({
  formData,
  setFormData,
  errors,
  setErrors,
  onSubmit,
  onCancel,
  isLoading,
  isAuthenticated
}) => {
  const [shopPhotoPreview, setShopPhotoPreview] = useState<string | null>(null);
  const [productPhotoPreviews, setProductPhotoPreviews] = useState<string[]>([]);

  // Form validation
  const validateForm = useCallback(() => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Shop name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Shop name must be at least 2 characters';
    }

    if (!formData.category.trim()) {
      newErrors.category = 'Shop category is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Shop description is required';
    } else if (formData.description.trim().length < 10) {
      newErrors.description = 'Description must be at least 10 characters';
    }

    if (!formData.location.trim()) {
      newErrors.location = 'Location is required';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.hours.trim()) {
      newErrors.hours = 'Business hours are required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, setErrors]);

  // Handle shop photo upload
  const handleShopPhotoUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setErrors(prev => ({ ...prev, shopPhoto: 'File size must be less than 5MB' }));
        return;
      }

      if (!file.type.startsWith('image/')) {
        setErrors(prev => ({ ...prev, shopPhoto: 'Please select a valid image file' }));
        return;
      }

      setFormData(prev => ({ ...prev, shopPhoto: file }));
      setErrors(prev => ({ ...prev, shopPhoto: '' }));

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setShopPhotoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  }, [setFormData, setErrors]);

  // Handle product photos upload
  const handleProductPhotosUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const validFiles: File[] = [];
    const newErrors: string[] = [];

    files.forEach((file, index) => {
      if (file.size > 5 * 1024 * 1024) {
        newErrors.push(`File ${index + 1}: Size must be less than 5MB`);
        return;
      }

      if (!file.type.startsWith('image/')) {
        newErrors.push(`File ${index + 1}: Please select a valid image file`);
        return;
      }

      validFiles.push(file);
    });

    if (newErrors.length > 0) {
      setErrors(prev => ({ ...prev, productPhotos: newErrors.join(', ') }));
      return;
    }

    setFormData(prev => ({
      ...prev,
      productPhotos: [...prev.productPhotos, ...validFiles]
    }));
    setErrors(prev => ({ ...prev, productPhotos: '' }));

    // Create previews for new files
    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setProductPhotoPreviews(prev => [...prev, e.target?.result as string]);
      };
      reader.readAsDataURL(file);
    });
  }, [setFormData, setErrors]);

  // Remove shop photo
  const removeShopPhoto = useCallback(() => {
    setFormData(prev => ({ ...prev, shopPhoto: null }));
    setShopPhotoPreview(null);
    setErrors(prev => ({ ...prev, shopPhoto: '' }));
  }, [setFormData, setErrors]);

  // Remove product photo
  const removeProductPhoto = useCallback((index: number) => {
    setFormData(prev => ({
      ...prev,
      productPhotos: prev.productPhotos.filter((_, i) => i !== index)
    }));
    setProductPhotoPreviews(prev => prev.filter((_, i) => i !== index));
  }, [setFormData]);

  // Handle form submission
  const handleSubmit = useCallback(() => {
    if (validateForm()) {
      onSubmit();
    }
  }, [validateForm, onSubmit]);

  return (
    <div className="space-y-6">
      {/* Shop Name */}
      <div className="space-y-2">
        <Label htmlFor="shop-name">Shop Name *</Label>
        <Input
          id="shop-name"
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          placeholder="Enter your shop name"
          className={errors.name ? 'border-destructive' : ''}
        />
        {errors.name && (
          <p className="text-sm text-destructive">{errors.name}</p>
        )}
      </div>

      {/* Shop Category */}
      <div className="space-y-2">
        <Label htmlFor="shop-category">Category *</Label>
        <Input
          id="shop-category"
          value={formData.category}
          onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
          placeholder="e.g., Fashion, Electronics, Grocery"
        />
      </div>

      {/* Shop Description */}
      <div className="space-y-2">
        <Label htmlFor="shop-description">Description *</Label>
        <Textarea
          id="shop-description"
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          placeholder="Describe your shop, products, and services"
          rows={4}
          className={errors.description ? 'border-destructive' : ''}
        />
        {errors.description && (
          <p className="text-sm text-destructive">{errors.description}</p>
        )}
      </div>

      {/* Contact Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="shop-location">Location *</Label>
          {import.meta.env.VITE_GOOGLE_PLACES_API_KEY && import.meta.env.VITE_GOOGLE_PLACES_API_KEY !== 'your_google_places_api_key_here' ? (
            <PlacesAutocomplete
              value={formData.location}
              onChange={(location) => setFormData(prev => ({ ...prev, location }))}
              onSelect={(location) => setFormData(prev => ({ ...prev, location }))}
              searchOptions={{
                types: ['establishment'],
                componentRestrictions: { country: 'in' } // Restrict to India
              }}
              googleCallbackName="initGooglePlaces"
            >
              {({ getInputProps, suggestions, getSuggestionItemProps, loading }) => (
                <div className="relative">
                  <Input
                    id="shop-location"
                    {...getInputProps({
                      placeholder: "e.g., MG Road, Bangalore",
                      className: `${errors.location ? 'border-destructive' : ''}`
                    })}
                  />
                  {loading && (
                    <div className="absolute right-3 top-3">
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    </div>
                  )}
                  {suggestions.length > 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-background border border-border rounded-md shadow-lg max-h-60 overflow-auto">
                      {suggestions.map((suggestion, index) => (
                        <div
                          key={index}
                          {...getSuggestionItemProps(suggestion)}
                          className={`px-3 py-2 cursor-pointer hover:bg-muted ${
                            suggestion.active ? 'bg-muted' : ''
                          }`}
                        >
                          <span className="font-medium">{suggestion.formattedSuggestion.mainText}</span>
                          <br />
                          <span className="text-sm text-muted-foreground">
                            {suggestion.formattedSuggestion.secondaryText}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </PlacesAutocomplete>
          ) : (
            <Input
              id="shop-location"
              value={formData.location}
              onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
              placeholder="e.g., MG Road, Bangalore"
              className={errors.location ? 'border-destructive' : ''}
            />
          )}
          {errors.location && (
            <p className="text-sm text-destructive">{errors.location}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="shop-phone">Phone *</Label>
          <Input
            id="shop-phone"
            value={formData.phone}
            onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
            placeholder="+91 98765 43210"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="shop-email">Email *</Label>
          <Input
            id="shop-email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
            placeholder="contact@yourshop.com"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="shop-hours">Business Hours *</Label>
          <Input
            id="shop-hours"
            value={formData.hours}
            onChange={(e) => setFormData(prev => ({ ...prev, hours: e.target.value }))}
            placeholder="10:00 AM - 9:00 PM"
          />
        </div>
      </div>

      {/* Online Orders Toggle */}
      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="shop-online"
          checked={formData.isOnline}
          onChange={(e) => setFormData(prev => ({ ...prev, isOnline: e.target.checked }))}
          className="rounded border-gray-300"
        />
        <Label htmlFor="shop-online">Accept online orders</Label>
      </div>

      {/* Shop Photo Upload */}
      <div className="space-y-4">
        <Label>Shop Photo</Label>
        <div className="flex items-start gap-4">
          <div className="flex-1">
            <Input
              type="file"
              accept="image/*"
              onChange={handleShopPhotoUpload}
              className="hidden"
              id="shop-photo-upload"
            />
            <Label
              htmlFor="shop-photo-upload"
              className="flex items-center justify-center w-full h-32 border-2 border-dashed border-muted-foreground/25 rounded-lg cursor-pointer hover:border-primary/50 transition-colors"
            >
              <div className="text-center">
                <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Click to upload shop photo
                </p>
                <p className="text-xs text-muted-foreground">
                  Max 5MB, JPG/PNG only
                </p>
              </div>
            </Label>
            {errors.shopPhoto && (
              <p className="text-sm text-destructive mt-1">{errors.shopPhoto}</p>
            )}
          </div>
        </div>
      </div>

      {/* Products Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label>Products</Label>
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

        {formData.products.length > 0 && (
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
        )}

        {/* Product Photos Upload */}
        <div className="space-y-4">
          <Label>Product Photos</Label>
          <div className="flex items-start gap-4">
            <div className="flex-1">
              <Input
                type="file"
                accept="image/*"
                multiple
                onChange={handleProductPhotosUpload}
                className="hidden"
                id="product-photos-upload"
              />
              <Label
                htmlFor="product-photos-upload"
                className="flex items-center justify-center w-full h-32 border-2 border-dashed border-muted-foreground/25 rounded-lg cursor-pointer hover:border-primary/50 transition-colors"
              >
                <div className="text-center">
                  <ImageIcon className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Click to upload product photos
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Max 5MB each, multiple files allowed
                  </p>
                </div>
              </Label>
              {errors.productPhotos && (
                <p className="text-sm text-destructive mt-1">{errors.productPhotos}</p>
              )}
            </div>
          </div>

          {/* Product Photos Preview Grid */}
          {productPhotoPreviews.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {productPhotoPreviews.map((preview, index) => (
                <div key={index} className="relative group">
                  <img
                    src={preview}
                    alt={`Product ${index + 1}`}
                    className="w-full h-24 object-cover rounded-lg"
                  />
                  <Button
                    variant="destructive"
                    size="sm"
                    className="absolute -top-2 -right-2 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => removeProductPhoto(index)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex gap-2 pt-4">
        <Button
          onClick={handleSubmit}
          disabled={isLoading || !isAuthenticated || !formData.name.trim() || !formData.category.trim() || !formData.description.trim() || !formData.location.trim() || !formData.phone.trim() || !formData.email.trim() || !formData.hours.trim()}
          className="flex-1"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Shop
            </>
          )}
        </Button>
        <Button
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
};

export default ShopForm;