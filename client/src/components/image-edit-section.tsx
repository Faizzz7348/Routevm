import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ImageIcon, Plus, X, Edit, Trash, RotateCcw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ImageWithCaption, MediaWithCaption } from "@shared/schema";
import { UseMutationResult } from "@tanstack/react-query";
import { InlineLoading } from "./skeleton-loader";
import { MediaUploadModal } from "./media-upload-modal";

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
  const [mediaUploadOpen, setMediaUploadOpen] = useState(false);
  const { toast } = useToast();

  const isValidImageUrl = (url: string) => {
    return /\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i.test(url) || 
           url.includes('unsplash.com') || 
           url.includes('images.unsplash.com');
  };

  const handleMediaSave = async (media: MediaWithCaption) => {
    try {
      await onAddImage.mutateAsync({ 
        rowId, 
        imageUrl: media.url, 
        caption: media.caption 
      });
      
      toast({
        title: "Media Added",
        description: "Media has been added successfully.",
      });
      
      setMediaUploadOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add media.",
        variant: "destructive",
      });
    }
  };

  const handleMediaSaveMultiple = async (mediaList: MediaWithCaption[]) => {
    try {
      for (const media of mediaList) {
        await onAddImage.mutateAsync({ 
          rowId, 
          imageUrl: media.url, 
          caption: media.caption 
        });
      }
      
      toast({
        title: "Album Added",
        description: `${mediaList.length} media items have been added successfully.`,
      });
      
      setMediaUploadOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add some media items.",
        variant: "destructive",
      });
    }
  };

  const handleModeChange = (newMode: 'add' | 'edit' | 'replace') => {
    if (newMode === 'add') {
      setMediaUploadOpen(true);
      return;
    }
    
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
      <Card className="bg-black/50 dark:bg-black/70 backdrop-blur-xl border border-white/30 dark:border-white/20 shadow-2xl rounded-xl mb-6" data-testid="image-edit-section">
        <CardContent className="p-6">
          <h3 className="font-semibold mb-6 flex items-center text-foreground/90 text-center justify-center text-sm">
            <ImageIcon className="w-4 h-4 mr-2 text-blue-400" />
            📷 Manage Media for {location || 'Row'}
          </h3>
          
          <div className="flex flex-col gap-6">
            {/* Mode Selection */}
            <div className="bg-black/30 dark:bg-black/50 backdrop-blur-sm border border-white/20 dark:border-white/15 rounded-lg p-4">
              <label className="text-sm font-medium text-foreground/80 mb-3 block">🎬 Action:</label>
              <Select value={mode} onValueChange={handleModeChange}>
                <SelectTrigger className="bg-black/40 dark:bg-black/60 border-white/30 dark:border-white/20 backdrop-blur-sm text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="add">📸 Add New Media</SelectItem>
                  {images.length > 0 && <SelectItem value="edit">✏️ Edit Caption</SelectItem>}
                  {images.length > 0 && <SelectItem value="replace">🔄 Replace Media</SelectItem>}
                </SelectContent>
              </Select>
            </div>

            {/* Media Selection (for edit/replace modes) */}
            {(mode === 'edit' || mode === 'replace') && images.length > 1 && (
              <div className="bg-black/30 dark:bg-black/50 backdrop-blur-sm border border-white/20 dark:border-white/15 rounded-lg p-4">
                <label className="text-sm font-medium text-foreground/80 mb-3 block">🎯 Select Media:</label>
                <Select value={selectedImageIndex.toString()} onValueChange={handleImageIndexChange}>
                  <SelectTrigger className="bg-black/40 dark:bg-black/60 border-white/30 dark:border-white/20 backdrop-blur-sm text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {images.map((image, index) => (
                      <SelectItem key={index} value={index.toString()}>
                        {image.type === 'video' ? '🎥' : '📷'} Item {index + 1} {image.caption ? `- ${image.caption}` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Current Media Preview (for edit/replace modes) */}
            {(mode === 'edit' || mode === 'replace') && images[selectedImageIndex] && (
              <div className="bg-black/30 dark:bg-black/50 backdrop-blur-sm border border-white/20 dark:border-white/15 rounded-lg p-4">
                <label className="text-sm font-medium text-foreground/80 mb-3 block">🖼️ Current {images[selectedImageIndex].type === 'video' ? 'Video' : 'Image'}:</label>
                {images[selectedImageIndex].type === 'video' ? (
                  <div className="relative">
                    <video
                      src={images[selectedImageIndex].url}
                      className="w-32 h-24 object-cover border border-white/20 rounded-lg"
                      controls={false}
                      poster={images[selectedImageIndex].thumbnail}
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-lg">
                      <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                        <div className="w-0 h-0 border-l-[6px] border-l-white border-y-[4px] border-y-transparent ml-1"></div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <img
                    src={images[selectedImageIndex].url}
                    alt={images[selectedImageIndex].caption || "Current image"}
                    className="w-32 h-24 object-cover border border-white/20 rounded-lg"
                  />
                )}
              </div>
            )}

            {/* Media URL Input (for add/replace modes) */}
            {(mode === 'add' || mode === 'replace') && (
              <div className="bg-black/30 dark:bg-black/50 backdrop-blur-sm border border-white/20 dark:border-white/15 rounded-lg p-4">
                <label className="text-sm font-medium text-foreground/80 mb-3 block">
                  🔗 {mode === 'add' ? 'Media URL:' : 'New Media URL:'}
                </label>
                <Input
                  type="url"
                  placeholder="Image, video, YouTube, or Vimeo URL..."
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="bg-black/40 dark:bg-black/60 border-white/30 dark:border-white/20 backdrop-blur-sm w-full text-sm"
                  data-testid="input-image-url"
                />
                {imageUrl && !isValidImageUrl(imageUrl) && (
                  <p className="text-amber-400 text-xs mt-2">⚠️ This looks like a video URL. For best compatibility, use direct image formats: jpg, png, gif, webp</p>
                )}
              </div>
            )}

            {/* Caption Input */}
            <div className="bg-black/30 dark:bg-black/50 backdrop-blur-sm border border-white/20 dark:border-white/15 rounded-lg p-4">
              <label className="text-sm font-medium text-foreground/80 mb-3 block">📝 Caption:</label>
              <Input
                type="text"
                placeholder="Add caption (optional)..."
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                className="bg-black/40 dark:bg-black/60 border-white/30 dark:border-white/20 backdrop-blur-sm w-full text-sm"
                data-testid="input-image-caption"
              />
            </div>

            {/* Delete Options */}
            {images.length > 0 && (
              <div className="bg-red-500/10 backdrop-blur-sm border border-red-400/20 rounded-lg p-4">
                <label className="text-sm font-medium text-red-400 mb-3 block">🗑️ Delete Options:</label>
                <div className="flex gap-3">
                  <Button
                    variant="destructive"
                    onClick={() => handleDeleteClick('single')}
                    disabled={isPending}
                    className="flex-1 bg-red-500/80 hover:bg-red-600/80 backdrop-blur-sm border border-red-400/50"
                    data-testid="button-delete-single"
                  >
                    <Trash className="w-4 h-4 mr-2" />
                    Delete This Item
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => handleDeleteClick('all')}
                    disabled={isPending}
                    className="flex-1 bg-red-600/80 hover:bg-red-700/80 backdrop-blur-sm border border-red-500/50"
                    data-testid="button-delete-all"
                  >
                    <Trash className="w-4 h-4 mr-2" />
                    Delete All Items
                  </Button>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-6 border-t border-white/10 dark:border-white/5">
              
              <Button
                variant="outline"
                onClick={onClose}
                className="bg-black/40 hover:bg-black/50 backdrop-blur-sm border border-white/30 text-foreground/80 hover:text-foreground"
                data-testid="button-cancel"
                disabled={isPending}
              >
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <Button 
                onClick={handleSubmit}
                disabled={isPending}
                className="flex-1 bg-green-500/80 hover:bg-green-600/80 backdrop-blur-sm border border-green-400/50 text-white"
                data-testid="button-submit"
              >
                {isPending ? (
                  <InlineLoading type="triple" />
                ) : (
                  <>
                    {mode === 'add' && <Plus className="w-4 h-4 mr-2" />}
                    {mode === 'edit' && <Edit className="w-4 h-4 mr-2" />}
                    {mode === 'replace' && <RotateCcw className="w-4 h-4 mr-2" />}
                    {mode === 'add' ? 'Add Media' : mode === 'edit' ? 'Update Caption' : 'Replace Media'}
                  </>
                )}
              </Button>
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

      {/* Media Upload Modal */}
      <MediaUploadModal
        open={mediaUploadOpen}
        onOpenChange={setMediaUploadOpen}
        onSave={handleMediaSave}
        onSaveMultiple={handleMediaSaveMultiple}
      />
    </>
  );
}