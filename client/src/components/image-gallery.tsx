import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";

interface ImageGalleryProps {
  images: string[];
  rowId: string;
  onAddImage: () => void;
  editMode: boolean;
  onAccessDenied: () => void;
}

export function ImageGallery({ images, rowId, onAddImage, editMode, onAccessDenied }: ImageGalleryProps) {
  const [lightGallery, setLightGallery] = useState<any>(null);

  useEffect(() => {
    let gallery: any = null;
    
    const loadLightGallery = async () => {
      if (typeof window !== 'undefined' && images.length > 0) {
        try {
          // Wait a bit for DOM to be ready
          await new Promise(resolve => setTimeout(resolve, 100));
          
          const galleryElement = document.getElementById(`lightgallery-${rowId}`);
          if (!galleryElement) return;
          
          // Check if there are actual image links in the element
          const imageLinks = galleryElement.querySelectorAll('a[data-src]');
          if (imageLinks.length === 0) return;

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
      <div className="flex items-center gap-2" data-testid={`image-gallery-${rowId}`}>
        <span className="text-xs text-muted-foreground">No images</span>
        <Button
          size="sm"
          variant="ghost"
          className="text-xs text-primary hover:text-primary/80"
          onClick={() => editMode ? onAddImage() : onAccessDenied()}
          data-testid={`button-add-image-${rowId}`}
        >
          <PlusCircle className="w-4 h-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2" id={`lightgallery-${rowId}`} data-testid={`image-gallery-${rowId}`}>
      {images.map((image, index) => (
        <a
          key={index}
          href={image}
          data-src={image}
          className="inline-block rounded overflow-hidden hover:scale-105 transition-transform"
          data-testid={`image-${rowId}-${index}`}
        >
          <img
            src={`${image}?w=60&h=40&fit=crop`}
            alt={`Product image ${index + 1}`}
            className="w-10 h-8 object-cover border border-border"
          />
        </a>
      ))}
      <Button
        size="sm"
        variant="ghost"
        className="text-xs text-primary hover:text-primary/80 ml-1"
        onClick={() => editMode ? onAddImage() : onAccessDenied()}
        data-testid={`button-add-image-${rowId}`}
      >
        <PlusCircle className="w-4 h-4" />
      </Button>
    </div>
  );
}
