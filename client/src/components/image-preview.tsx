import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { PlusCircle, Images, Edit } from "lucide-react";
import { ImageWithCaption } from "@shared/schema";

interface ImagePreviewProps {
  images: ImageWithCaption[];
  rowId: string;
  onAddImage: () => void;
  editMode: boolean;
  onAccessDenied: () => void;
}

export function ImagePreview({ images, rowId, onAddImage, editMode, onAccessDenied }: ImagePreviewProps) {
  const [lightGallery, setLightGallery] = useState<any>(null);

  useEffect(() => {
    let gallery: any = null;
    
    const loadLightGallery = async () => {
      if (typeof window !== 'undefined' && images.length > 0) {
        try {
          // Wait a bit for DOM to be ready
          await new Promise(resolve => setTimeout(resolve, 100));
          
          const galleryElement = document.getElementById(`lightgallery-preview-${rowId}`);
          if (!galleryElement) return;
          
          // Check if there are actual image links in the element
          const imageLinks = galleryElement.querySelectorAll('a[data-src]');
          if (imageLinks.length === 0) {
            console.warn('No image links found for lightGallery');
            return;
          }

          // Dynamically import lightgallery
          const { default: lightGallery } = await import('lightgallery');
          const lgThumbnail = await import('lightgallery/plugins/thumbnail');
          const lgZoom = await import('lightgallery/plugins/zoom');
          
          // Import CSS
          await import('lightgallery/css/lightgallery.css');
          await import('lightgallery/css/lg-thumbnail.css');
          await import('lightgallery/css/lg-zoom.css');

          gallery = lightGallery(galleryElement, {
            plugins: [lgThumbnail.default, lgZoom.default],
            speed: 500,
            download: false,
            selector: 'a[data-src]',
          });
          setLightGallery(gallery);
        } catch (error) {
          console.error('Failed to load LightGallery:', error);
        }
      }
    };

    loadLightGallery();

    return () => {
      if (gallery) {
        try {
          gallery.destroy();
        } catch (e) {
          console.warn('Error destroying lightGallery:', e);
        }
      }
    };
  }, [images, rowId]);

  if (images.length === 0) {
    return (
      <div className="flex items-center justify-center gap-2" data-testid={`image-preview-${rowId}`}>
        <span className="text-xs text-muted-foreground">No images</span>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center gap-2" data-testid={`image-preview-${rowId}`}>
      <div id={`lightgallery-preview-${rowId}`} className="flex items-center gap-1">
        {/* Show only the first image as preview */}
        <div className="flex flex-col items-center gap-1">
          <a
            href={images[0].url}
            data-src={images[0].url}
            data-sub-html={images[0].caption}
            className="relative inline-block rounded overflow-hidden hover:scale-105 transition-transform cursor-pointer"
            data-testid={`image-preview-${rowId}-0`}
            title={images[0].caption || "Image"}
          >
            <img
              src={images[0].url}
              alt={images[0].caption || "Image preview"}
              className="w-10 h-8 object-cover border border-border"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                console.warn('Failed to load image:', images[0].url);
              }}
            />
            {/* Show count indicator if there are multiple images */}
            {images.length > 1 && (
              <div className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-sm rounded-full w-5 h-5 flex items-center justify-center">
                {images.length}
              </div>
            )}
          </a>
          {/* Show caption if available */}
          {images[0].caption && (
            <span className="text-sm text-muted-foreground text-center max-w-[80px] truncate" title={images[0].caption}>
              {images[0].caption}
            </span>
          )}
        </div>
        
        {/* Hidden images for lightbox gallery */}
        {images.slice(1).map((image, index) => (
          <a
            key={index + 1}
            href={image.url}
            data-src={image.url}
            data-sub-html={image.caption}
            style={{ display: 'none' }}
            data-testid={`image-hidden-${rowId}-${index + 1}`}
          >
            <img src={image.url} alt={image.caption || `Hidden image ${index + 2}`} />
          </a>
        ))}
      </div>
      
      {/* Edit Image Button - Only show in edit mode */}
      {editMode && (
        <Button
          size="sm"
          variant="ghost"
          className="text-xs text-primary hover:text-primary/80"
          onClick={() => onAddImage()}
          data-testid={`button-edit-images-${rowId}`}
          title="Edit images"
        >
          <Edit className="w-4 h-4" />
        </Button>
      )}
      
    </div>
  );
}