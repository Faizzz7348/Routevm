import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { PlusCircle, Images, Edit, ImageOff, Video } from "lucide-react";
import { MediaWithCaption } from "@shared/schema";

interface ImagePreviewProps {
  images: MediaWithCaption[];
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
          await new Promise(resolve => setTimeout(resolve, 150));
          
          const galleryElement = document.getElementById(`lightgallery-preview-${rowId}`);
          if (!galleryElement) {
            console.warn('Gallery element not found:', `lightgallery-preview-${rowId}`);
            return;
          }
          
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
          const lgAutoplay = await import('lightgallery/plugins/autoplay');
          const lgFullscreen = await import('lightgallery/plugins/fullscreen');
          const lgVideo = await import('lightgallery/plugins/video');
          
          // Import CSS
          await import('lightgallery/css/lightgallery.css');
          await import('lightgallery/css/lg-thumbnail.css');
          await import('lightgallery/css/lg-zoom.css');
          await import('lightgallery/css/lg-autoplay.css');
          await import('lightgallery/css/lg-fullscreen.css');
          await import('lightgallery/css/lg-video.css');

          gallery = lightGallery(galleryElement, {
            plugins: [lgThumbnail.default, lgZoom.default, lgAutoplay.default, lgFullscreen.default, lgVideo.default],
            speed: 800,
            mode: 'lg-slide',
            download: false,
            selector: 'a[data-src]',
            animateThumb: true,
            startClass: 'lg-start-zoom',
            backdropDuration: 300,
            hideBarsDelay: 2000,
            mousewheel: true,
            enableSwipe: true,
            enableDrag: true,
            // Video plugin settings
            autoplayFirstVideo: false,
            youTubePlayerParams: {
              modestbranding: 1,
              showinfo: 0,
              rel: 0,
              controls: 1
            },
            vimeoPlayerParams: {
              byline: 0,
              portrait: 0,
              color: 'A90707'
            }
          });
          setLightGallery(gallery);
          console.log('LightGallery initialized successfully for:', rowId);
        } catch (error) {
          console.error('Failed to load LightGallery:', error);
          // Fallback: just open image in new tab
          const fallbackHandler = (e: Event) => {
            e.preventDefault();
            const target = e.target as HTMLElement;
            const link = target.closest('a[data-src]') as HTMLAnchorElement;
            if (link) {
              window.open(link.dataset.src, '_blank');
            }
          };
          
          const galleryElement = document.getElementById(`lightgallery-preview-${rowId}`);
          if (galleryElement) {
            galleryElement.addEventListener('click', fallbackHandler);
          }
        }
      }
    };

    // Add a small delay to ensure DOM is ready
    const timeoutId = setTimeout(loadLightGallery, 100);

    return () => {
      clearTimeout(timeoutId);
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
        <ImageOff className="w-4 h-4 text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center gap-2" data-testid={`image-preview-${rowId}`}>
      <div id={`lightgallery-preview-${rowId}`} className="flex items-center gap-1">
        {/* Show only the first media item as preview */}
        <div className="flex flex-col items-center gap-1">
          <a
            href={images[0].url}
            data-src={images[0].url}
            data-sub-html={images[0].caption}
            data-video={images[0].type === 'video' ? JSON.stringify({ source: [{ src: images[0].url, type: 'video/mp4' }], attributes: { preload: false, controls: true } }) : undefined}
            data-poster={images[0].type === 'video' ? images[0].thumbnail : undefined}
            className="relative inline-block rounded overflow-hidden hover:scale-105 transition-transform cursor-pointer"
            data-testid={`media-preview-${rowId}-0`}
            title={images[0].caption || (images[0].type === 'video' ? "Video" : "Image")}
            onClick={(e) => {
              // Fallback handler if LightGallery isn't working
              if (!lightGallery) {
                e.preventDefault();
                window.open(images[0].url, '_blank');
              }
            }}
          >
            {images[0].type === 'video' ? (
              <div className="w-10 h-8 bg-gray-800 border border-border rounded flex items-center justify-center">
                <Video className="w-4 h-4 text-white" />
                {images[0].thumbnail && (
                  <img
                    src={images[0].thumbnail}
                    alt={images[0].caption || "Video thumbnail"}
                    className="absolute inset-0 w-full h-full object-cover rounded"
                  />
                )}
              </div>
            ) : (
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
            )}
            {/* Show count indicator if there are multiple media items */}
            {images.length > 1 && (
              <div className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-sm rounded-full w-5 h-5 flex items-center justify-center">
                {images.length}
              </div>
            )}
          </a>
        </div>
        
        {/* Hidden media items for lightbox gallery */}
        {images.slice(1).map((media, index) => (
          <a
            key={index + 1}
            href={media.url}
            data-src={media.url}
            data-sub-html={media.caption}
            data-video={media.type === 'video' ? JSON.stringify({ source: [{ src: media.url, type: 'video/mp4' }], attributes: { preload: false, controls: true } }) : undefined}
            data-poster={media.type === 'video' ? media.thumbnail : undefined}
            style={{ display: 'none' }}
            data-testid={`image-hidden-${rowId}-${index + 1}`}
          >
            <img src={media.url} alt={media.caption || `Hidden media ${index + 2}`} />
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