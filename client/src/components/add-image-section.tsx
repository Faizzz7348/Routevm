import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ImageIcon, Plus, X } from "lucide-react";
import { UseMutationResult } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

interface AddImageSectionProps {
  rowId: string;
  location?: string;
  onClose: () => void;
  onAddImage: UseMutationResult<any, Error, { rowId: string; imageUrl: string; caption?: string }, unknown>;
}

interface ImageEntry {
  url: string;
  caption: string;
}

export function AddImageSection({ rowId, location, onClose, onAddImage }: AddImageSectionProps) {
  const [imageEntries, setImageEntries] = useState<ImageEntry[]>([{ url: "", caption: "" }]);
  const { toast } = useToast();

  const isValidImageUrl = (url: string) => {
    return /\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i.test(url) || 
           url.includes('unsplash.com') || 
           url.includes('images.unsplash.com');
  };

  const addImageEntry = () => {
    setImageEntries([...imageEntries, { url: "", caption: "" }]);
  };

  const removeImageEntry = (index: number) => {
    if (imageEntries.length > 1) {
      setImageEntries(imageEntries.filter((_, i) => i !== index));
    }
  };

  const updateImageEntry = (index: number, field: 'url' | 'caption', value: string) => {
    const updated = [...imageEntries];
    updated[index] = { ...updated[index], [field]: value };
    setImageEntries(updated);
  };

  const handleAddImages = async () => {
    // Filter out empty URLs
    const validEntries = imageEntries.filter(entry => entry.url.trim());
    
    if (validEntries.length === 0) {
      toast({
        title: "Error",
        description: "Please enter at least one image URL.",
        variant: "destructive",
      });
      return;
    }

    // Validate all URLs
    const invalidUrls = validEntries.filter(entry => !isValidImageUrl(entry.url.trim()));
    if (invalidUrls.length > 0) {
      toast({
        title: "Error",
        description: `Please enter valid image URLs for all entries.`,
        variant: "destructive",
      });
      return;
    }

    try {
      // Add images one by one
      for (const entry of validEntries) {
        await onAddImage.mutateAsync({ 
          rowId, 
          imageUrl: entry.url.trim(), 
          caption: entry.caption.trim() 
        });
      }
      
      toast({
        title: "Images Added",
        description: `${validEntries.length} image(s) have been added successfully.`,
      });
      
      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add one or more images.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="glass-card border-none rounded-xl mb-6" data-testid="add-image-section">
      <CardContent className="p-6">
        <h3 className="font-semibold mb-4 flex items-center text-white" style={{fontSize: '10px'}}>
          <ImageIcon className="w-3 h-3 mr-2 text-primary" />
          Add Images to {location || 'Row'} ({imageEntries.length})
        </h3>
        <div className="flex flex-col gap-4">
          <div className="space-y-4">
            {imageEntries.map((entry, index) => (
              <div key={index} className="space-y-3 p-3 border border-border/20 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-white" style={{fontSize: '10px'}}>Image {index + 1}</span>
                  {imageEntries.length > 1 && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeImageEntry(index)}
                      className="h-6 w-6 p-0 text-destructive hover:text-destructive/80"
                      data-testid={`button-remove-image-${index}`}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  )}
                </div>
                <div>
                  <Input
                    type="url"
                    placeholder="Enter image URL..."
                    value={entry.url}
                    onChange={(e) => updateImageEntry(index, 'url', e.target.value)}
                    className="glass-input border-none w-full"
                    style={{fontSize: '10px'}}
                    data-testid={`input-image-url-${index}`}
                  />
                </div>
                <div>
                  <Input
                    type="text"
                    placeholder="Add caption (optional)..."
                    value={entry.caption}
                    onChange={(e) => updateImageEntry(index, 'caption', e.target.value)}
                    className="glass-input border-none w-full"
                    style={{fontSize: '10px'}}
                    data-testid={`input-image-caption-${index}`}
                  />
                </div>
              </div>
            ))}
            
            <Button
              size="sm"
              variant="outline"
              onClick={addImageEntry}
              className="btn-glass w-full"
              style={{fontSize: '10px'}}
              data-testid="button-add-another-image"
            >
              <Plus className="w-3 h-3 mr-1" />
              Add Another Image
            </Button>
          </div>
          <div className="flex gap-2 justify-end">
            <Button
              variant="secondary"
              onClick={onClose}
              size="sm"
              className="btn-glass"
              style={{fontSize: '10px'}}
              data-testid="button-cancel-image"
            >
              <X className="w-3 h-3 mr-1" />
              Cancel
            </Button>
            <Button 
              onClick={handleAddImages}
              disabled={onAddImage.isPending}
              size="sm"
              className="btn-glass-primary"
              style={{fontSize: '10px'}}
              data-testid="button-add-images"
            >
              <Plus className="w-3 h-3 mr-1" />
              Add {imageEntries.filter(entry => entry.url.trim()).length} Image{imageEntries.filter(entry => entry.url.trim()).length !== 1 ? 's' : ''}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
