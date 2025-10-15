import React, { useState, useCallback } from 'react';
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { uploadApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface PhotoUploadProps {
  onFilesChange: (files: File[]) => void;
  onUploadComplete?: (uploadedFiles: { filename: string; url: string }[]) => void;
  maxFiles?: number;
  maxSizeMB?: number;
  acceptedTypes?: string[];
  shopId?: number;
}

const PhotoUpload: React.FC<PhotoUploadProps> = ({
  onFilesChange,
  onUploadComplete,
  maxFiles = 10,
  maxSizeMB = 5,
  acceptedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  shopId
}) => {
  const { toast } = useToast();
  const [previews, setPreviews] = useState<string[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const validFiles: File[] = [];
    const newErrors: string[] = [];
    const newPreviews: string[] = [];

    files.forEach((file, index) => {
      // Check file size
      if (file.size > maxSizeMB * 1024 * 1024) {
        newErrors.push(`File ${index + 1}: Size must be less than ${maxSizeMB}MB`);
        return;
      }

      // Check file type
      if (!acceptedTypes.includes(file.type)) {
        newErrors.push(`File ${index + 1}: Please select a valid image file`);
        return;
      }

      validFiles.push(file);

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        newPreviews.push(e.target?.result as string);
        if (newPreviews.length === validFiles.length) {
          setPreviews(prev => [...prev, ...newPreviews]);
        }
      };
      reader.readAsDataURL(file);
    });

    if (newErrors.length === 0) {
      onFilesChange(validFiles);
      setErrors([]);
    } else {
      setErrors(newErrors);
    }
  }, [maxSizeMB, acceptedTypes, onFilesChange]);

  const removeFile = useCallback((index: number) => {
    setPreviews(prev => prev.filter((_, i) => i !== index));
    // Note: This would need to be handled by parent component for actual file removal
  }, []);

  const handleUpload = useCallback(async () => {
    if (previews.length === 0) {
      toast({
        title: "No files selected",
        description: "Please select files to upload first.",
        variant: "destructive",
      });
      return;
    }

    if (!shopId) {
      toast({
        title: "Shop ID required",
        description: "Shop ID is required to upload photos.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    try {
      toast({
        title: "Upload started",
        description: "Uploading photos to server...",
      });

      // In a real implementation, you would need to:
      // 1. Store the actual File objects when they're selected
      // 2. Use uploadApi.uploadProductPhotos() to upload them
      // 3. Create database records for the uploaded photos

      // For now, we'll simulate the upload process
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Simulate successful upload
      const uploadedFiles = previews.map((preview, index) => ({
        filename: `product_${shopId}_${Date.now()}_${index}.jpg`,
        url: preview // In reality, this would be the URL returned from the server
      }));

      toast({
        title: "Upload complete",
        description: `${previews.length} photo(s) uploaded successfully.`,
      });

      // Call the completion callback if provided
      if (onUploadComplete) {
        onUploadComplete(uploadedFiles);
      }

      // Clear previews after successful upload
      setPreviews([]);

    } catch (error) {
      toast({
        title: "Upload failed",
        description: "Failed to upload photos. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  }, [previews, shopId, toast, onUploadComplete]);

  return (
    <div className="space-y-4">
      <Label>Product Photos</Label>
      <div className="flex items-start gap-4">
        <div className="flex-1">
          <Input
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileUpload}
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
                Max {maxSizeMB}MB each, multiple files allowed
              </p>
            </div>
          </Label>
          {errors.length > 0 && (
            <div className="mt-2 space-y-1">
              {errors.map((error, index) => (
                <p key={index} className="text-sm text-destructive">{error}</p>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Photo Previews */}
      {previews.length > 0 && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {previews.map((preview, index) => (
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
                  onClick={() => removeFile(index)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>

          {/* Upload Button */}
          <div className="flex justify-end">
            <Button
              onClick={handleUpload}
              disabled={isUploading || previews.length === 0}
              className="min-w-[120px]"
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Photos
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PhotoUpload;