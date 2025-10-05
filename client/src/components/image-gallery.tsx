import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { PlusCircle, Video } from "lucide-react";
import { MediaWithCaption } from "@shared/schema";

interface ImageGalleryProps {
  images: MediaWithCaption[];
  rowId: string;
  onAddImage: () => void;
  editMode: boolean;
  onAccessDenied: () => void;
}

export function ImageGallery({
  images,
  rowId,
  onAddImage,
  editMode,
  onAccessDenied,
}: ImageGalleryProps) {
  useEffect(() => {
    let gallery: any = null;

    const loadLightGallery = async () => {
      if (typeof window !== "undefined" && images.length > 0) {
        try {
          // Wait a bit for DOM to be ready
          await new Promise((resolve) => setTimeout(resolve, 150));

          const galleryElement = document.getElementById(
            `lightgallery-${rowId}`,
          );
          if (!galleryElement) return;

          // Check if there are actual image links in the element
          const imageLinks = galleryElement.querySelectorAll("a[data-src]");
          if (imageLinks.length === 0) return;

          // Dynamically import lightgallery
          const { default: lightGallery } = await import("lightgallery");
          const lgThumbnail = await import("lightgallery/plugins/thumbnail");
          const lgZoom = await import("lightgallery/plugins/zoom");
          const lgAutoplay = await import("lightgallery/plugins/autoplay");
          const lgFullscreen = await import("lightgallery/plugins/fullscreen");
          const lgVideo = await import("lightgallery/plugins/video");

          // Import CSS
          await import("lightgallery/css/lightgallery.css");
          await import("lightgallery/css/lg-thumbnail.css");
          await import("lightgallery/css/lg-zoom.css");
          await import("lightgallery/css/lg-autoplay.css");
          await import("lightgallery/css/lg-fullscreen.css");
          await import("lightgallery/css/lg-video.css");

          gallery = lightGallery(galleryElement, {
            plugins: [
              lgThumbnail.default,
              lgZoom.default,
              lgAutoplay.default,
              lgFullscreen.default,
              lgVideo.default,
            ],
            speed: 800,
            mode: "lg-slide",
            download: false,
            selector: "a[data-src]",
            animateThumb: true,
            startClass: "lg-start-zoom",
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
        } catch (error) {
          console.error("Failed to load LightGallery:", error);
        }
      }
    };

    loadLightGallery();

    return () => {
      if (gallery) {
        try {
          gallery.destroy();
        } catch (e) {
          console.warn("Error destroying lightGallery:", e);
        }
      }
    };
  }, [images, rowId]);

  if (images.length === 0) {
    return (
      <div
        className="flex items-center gap-2"
        data-testid={`image-gallery-${rowId}`}
      >
        <span className="text-xs text-muted-foreground">No media</span>
        <Button
          size="sm"
          variant="ghost"
          className="text-xs text-primary hover:text-primary/80"
          onClick={() => (editMode ? onAddImage() : onAccessDenied())}
          data-testid={`button-add-image-${rowId}`}
        >
          <PlusCircle className="w-4 h-4" />
        </Button>
      </div>
    );
  }

  return (
    <div
      className="flex items-center gap-2"
      id={`lightgallery-${rowId}`}
      data-testid={`image-gallery-${rowId}`}
    >
      {images.map((media, index) => (
        <a
          key={index}
          href={media.url}
          data-src={media.url}
          data-sub-html={media.caption}
          data-video={media.type === 'video' ? JSON.stringify({ source: [{ src: media.url, type: 'video/mp4' }], attributes: { preload: false, controls: true } }) : undefined}
          data-poster={media.type === 'video' ? media.thumbnail : undefined}
          className="inline-block rounded overflow-hidden hover:scale-105 transition-transform"
          data-testid={`media-${rowId}-${index}`}
        >
          {media.type === 'video' ? (
            <div className="w-10 h-8 bg-gray-800 border border-border rounded flex items-center justify-center relative">
              <Video className="w-4 h-4 text-white" />
              {media.thumbnail && (
                <img
                  src={media.thumbnail}
                  alt={media.caption || `Video ${index + 1}`}
                  className="absolute inset-0 w-full h-full object-cover rounded"
                />
              )}
            </div>
          ) : (
            <img
              src={`${media.url}?w=60&h=40&fit=crop`}
              alt={media.caption || `Image ${index + 1}`}
              className="w-10 h-8 object-cover border border-border"
            />
          )}
        </a>
      ))}
      <Button
        size="sm"
        variant="ghost"
        className="text-xs text-primary hover:text-primary/80 ml-1"
        onClick={() => (editMode ? onAddImage() : onAccessDenied())}
        data-testid={`button-add-image-${rowId}`}
      >
        <PlusCircle className="w-4 h-4" />
      </Button>
    </div>
  );
}
