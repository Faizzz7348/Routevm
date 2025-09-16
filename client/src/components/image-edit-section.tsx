import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ImageIcon, Plus, X, Edit, Trash, RotateCcw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ImageWithCaption } from "@shared/schema";
import { UseMutationResult } from "@tanstack/react-query";

interface ImageEditSectionProps {
  rowId: string;
  images: ImageWithCaption[];
  location?: string;
  onClose: () => void;
  onAddImage: UseMutationResult<any, Error, { rowId: string; imageUrl: string; caption?: string }, unknown>;
  onUpdateImage: UseMutationResult<any, Error, { rowId: string; imageIndex: number; imageUrl?: string; caption?: string }, unknown>;
  onDeleteImage: UseMutationResult<any, Error, { rowId: string; imageIndex?: number }, unknown>;
}

export function ImageEditSection({ 
  rowId, 
  images, 
  location,
  onClose, 
  onAddImage, 
  onUpdateImage, 
  onDeleteImage 
}: ImageEditSectionProps) {
  const [mode, setMode] = useState<'add' | 'edit' | 'replace'>('add');
  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(0);
  const [imageUrl, setImageUrl] = useState("");
  const [caption, setCaption] = useState("");
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteMode, setDeleteMode] = useState<'single' | 'all'>('single');
  const { toast } = useToast();

  const isValidImageUrl = (url: string) => {
    return /\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i.test(url) || 
           url.includes('unsplash.com') || 
           url.includes('images.unsplash.com');
  };

  const handleModeChange = (newMode: 'add' | 'edit' | 'replace') => {
    setMode(newMode);
    if (newMode === 'edit' && images.length > 0) {
      setCaption(images[selectedImageIndex]?.caption || "");
      setImageUrl("");
    } else if (newMode === 'replace' && images.length > 0) {
      setImageUrl(images[selectedImageIndex]?.url || "");
      setCaption(images[selectedImageIndex]?.caption || "");
    } else {
      setImageUrl("");
      setCaption("");
    }
  };

  const handleImageIndexChange = (index: string) => {
    const newIndex = parseInt(index);
    setSelectedImageIndex(newIndex);
    if (mode === 'edit') {
      setCaption(images[newIndex]?.caption || "");
      setImageUrl("");
    } else if (mode === 'replace') {
      setImageUrl(images[newIndex]?.url || "");
      setCaption(images[newIndex]?.caption || "");
    }
  };

  const handleSubmit = async () => {
    if (mode === 'add') {
      if (!imageUrl.trim()) {
        toast({
          title: "Error",
          description: "Please enter an image URL.",
          variant: "destructive",
        });
        return;
      }

      if (!isValidImageUrl(imageUrl)) {
        toast({
          title: "Error",
          description: "Please enter a valid image URL.",
          variant: "destructive",
        });
        return;
      }

      try {
        await onAddImage.mutateAsync({ rowId, imageUrl, caption: caption.trim() });
        toast({
          title: "Image Added",
          description: "Image has been added successfully.",
        });
        setImageUrl("");
        setCaption("");
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to add image.",
          variant: "destructive",
        });
      }
    } else if (mode === 'edit') {
      try {
        await onUpdateImage.mutateAsync({ 
          rowId, 
          imageIndex: selectedImageIndex, 
          caption: caption.trim() 
        });
        toast({
          title: "Caption Updated",
          description: "Image caption has been updated successfully.",
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to update caption.",
          variant: "destructive",
        });
      }
    } else if (mode === 'replace') {
      if (!imageUrl.trim()) {
        toast({
          title: "Error",
          description: "Please enter an image URL.",
          variant: "destructive",
        });
        return;
      }

      if (!isValidImageUrl(imageUrl)) {
        toast({
          title: "Error",
          description: "Please enter a valid image URL.",
          variant: "destructive",
        });
        return;
      }

      try {
        await onUpdateImage.mutateAsync({ 
          rowId, 
          imageIndex: selectedImageIndex, 
          imageUrl, 
          caption: caption.trim() 
        });
        toast({
          title: "Image Replaced",
          description: "Image has been replaced successfully.",
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to replace image.",
          variant: "destructive",
        });
      }
    }
  };

  const handleDeleteClick = (mode: 'single' | 'all') => {
    setDeleteMode(mode);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      if (deleteMode === 'all') {
        await onDeleteImage.mutateAsync({ rowId });
        toast({
          title: "All Images Deleted",
          description: "All images have been deleted successfully.",
        });
        onClose();
      } else {
        await onDeleteImage.mutateAsync({ rowId, imageIndex: selectedImageIndex });
        toast({
          title: "Image Deleted",
          description: "Image has been deleted successfully.",
        });
        if (images.length <= 1) {
          onClose();
        }
      }
      setDeleteConfirmOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete image(s).",
        variant: "destructive",
      });
    }
  };

  const isPending = onAddImage.isPending || onUpdateImage.isPending || onDeleteImage.isPending;

  return (
    <>
      <Card className="glass-card border-none rounded-xl mb-6" data-testid="image-edit-section">
        <CardContent className="p-6">
          <h3 className="font-semibold mb-4 flex items-center text-white" style={{fontSize: '10px'}}>
            <ImageIcon className="w-3 h-3 mr-2 text-primary" />
            Manage Images for {location || 'Row'}
          </h3>
          
          <div className="flex flex-col gap-4">
            {/* Mode Selection */}
            <div className="space-y-2">
              <label className="text-white" style={{fontSize: '10px'}}>Action:</label>
              <Select value={mode} onValueChange={handleModeChange}>
                <SelectTrigger className="glass-input border-none" style={{fontSize: '10px'}}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="add">Add New Image</SelectItem>
                  {images.length > 0 && <SelectItem value="edit">Edit Caption</SelectItem>}
                  {images.length > 0 && <SelectItem value="replace">Replace Image</SelectItem>}
                </SelectContent>
              </Select>
            </div>

            {/* Image Selection (for edit/replace modes) */}
            {(mode === 'edit' || mode === 'replace') && images.length > 1 && (
              <div className="space-y-2">
                <label className="text-white" style={{fontSize: '10px'}}>Select Image:</label>
                <Select value={selectedImageIndex.toString()} onValueChange={handleImageIndexChange}>
                  <SelectTrigger className="glass-input border-none" style={{fontSize: '10px'}}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {images.map((image, index) => (
                      <SelectItem key={index} value={index.toString()}>
                        Image {index + 1} {image.caption ? `- ${image.caption}` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Current Image Preview (for edit/replace modes) */}
            {(mode === 'edit' || mode === 'replace') && images[selectedImageIndex] && (
              <div className="space-y-2">
                <label className="text-white" style={{fontSize: '10px'}}>Current Image:</label>
                <img
                  src={images[selectedImageIndex].url}
                  alt={images[selectedImageIndex].caption || "Current image"}
                  className="w-20 h-16 object-cover border border-border rounded"
                />
              </div>
            )}

            {/* Image URL Input (for add/replace modes) */}
            {(mode === 'add' || mode === 'replace') && (
              <div className="space-y-2">
                <label className="text-white" style={{fontSize: '10px'}}>
                  {mode === 'add' ? 'Image URL:' : 'New Image URL:'}
                </label>
                <Input
                  type="url"
                  placeholder="Enter image URL..."
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="glass-input border-none w-full"
                  style={{fontSize: '10px'}}
                  data-testid="input-image-url"
                />
              </div>
            )}

            {/* Caption Input */}
            <div className="space-y-2">
              <label className="text-white" style={{fontSize: '10px'}}>Caption:</label>
              <Input
                type="text"
                placeholder="Add caption (optional)..."
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                className="glass-input border-none w-full"
                style={{fontSize: '10px'}}
                data-testid="input-image-caption"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 justify-between">
              <div className="flex gap-2">
                {images.length > 0 && (
                  <>
                    <Button
                      variant="destructive"
                      onClick={() => handleDeleteClick('single')}
                      size="sm"
                      className="btn-glass"
                      style={{fontSize: '10px'}}
                      data-testid="button-delete-single"
                      disabled={isPending}
                    >
                      <Trash className="w-3 h-3 mr-1" />
                      Delete This
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => handleDeleteClick('all')}
                      size="sm"
                      className="btn-glass"
                      style={{fontSize: '10px'}}
                      data-testid="button-delete-all"
                      disabled={isPending}
                    >
                      <Trash className="w-3 h-3 mr-1" />
                      Delete All
                    </Button>
                  </>
                )}
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  onClick={onClose}
                  size="sm"
                  className="btn-glass"
                  style={{fontSize: '10px'}}
                  data-testid="button-cancel"
                  disabled={isPending}
                >
                  <X className="w-3 h-3 mr-1" />
                  Cancel
                </Button>
                <Button 
                  onClick={handleSubmit}
                  disabled={isPending}
                  size="sm"
                  className="btn-glass-primary"
                  style={{fontSize: '10px'}}
                  data-testid="button-submit"
                >
                  {mode === 'add' && <Plus className="w-3 h-3 mr-1" />}
                  {mode === 'edit' && <Edit className="w-3 h-3 mr-1" />}
                  {mode === 'replace' && <RotateCcw className="w-3 h-3 mr-1" />}
                  {mode === 'add' ? 'Add Image' : mode === 'edit' ? 'Update Caption' : 'Replace Image'}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              {deleteMode === 'all' 
                ? "Are you sure you want to delete ALL images? This action cannot be undone."
                : "Are you sure you want to delete this image? This action cannot be undone."
              }
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteConfirmOpen(false)}
              data-testid="button-cancel-delete"
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              data-testid="button-confirm-delete"
              disabled={isPending}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}