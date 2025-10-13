import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";

interface Product {
  name: string;
  price: number;
  originalPrice?: number;
  discount?: number;
  image: string;
  inStock: boolean;
}

interface ProductFormProps {
  products: Product[];
  onProductsChange: (products: Product[]) => void;
}

const ProductForm: React.FC<ProductFormProps> = ({ products, onProductsChange }) => {
  const addProduct = () => {
    const newProduct: Product = {
      name: '',
      price: 0,
      originalPrice: 0,
      discount: 0,
      image: '',
      inStock: true
    };
    onProductsChange([...products, newProduct]);
  };

  const updateProduct = (index: number, field: keyof Product, value: any) => {
    const updatedProducts = [...products];
    updatedProducts[index] = { ...updatedProducts[index], [field]: value };
    onProductsChange(updatedProducts);
  };

  const removeProduct = (index: number) => {
    const updatedProducts = products.filter((_, i) => i !== index);
    onProductsChange(updatedProducts);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label>Products</Label>
        <Button type="button" variant="outline" size="sm" onClick={addProduct}>
          <Plus className="h-4 w-4 mr-2" />
          Add Product
        </Button>
      </div>

      {products.length > 0 && (
        <div className="space-y-4">
          {products.map((product, index) => (
            <Card key={index} className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>Product Name</Label>
                  <Input
                    value={product.name}
                    onChange={(e) => updateProduct(index, 'name', e.target.value)}
                    placeholder="Product name"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Price (₹)</Label>
                  <Input
                    type="number"
                    value={product.price}
                    onChange={(e) => updateProduct(index, 'price', Number(e.target.value))}
                    placeholder="0"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Original Price (₹)</Label>
                  <Input
                    type="number"
                    value={product.originalPrice || ''}
                    onChange={(e) => updateProduct(index, 'originalPrice', Number(e.target.value) || 0)}
                    placeholder="0"
                  />
                </div>

                <div className="flex items-end gap-2">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={`in-stock-${index}`}
                      checked={product.inStock}
                      onChange={(e) => updateProduct(index, 'inStock', e.target.checked)}
                    />
                    <Label htmlFor={`in-stock-${index}`}>In Stock</Label>
                  </div>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => removeProduct(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductForm;