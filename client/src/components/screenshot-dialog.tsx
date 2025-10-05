import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Camera, Download, Share2, X } from "lucide-react";
import { toPng } from "html-to-image";
import { useToast } from "@/hooks/use-toast";

interface ScreenshotDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetRef: React.RefObject<HTMLElement>;
}

export function ScreenshotDialog({ open, onOpenChange, targetRef }: ScreenshotDialogProps) {
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const { toast } = useToast();

  const handleCapture = async () => {
    if (!targetRef.current) return;
    
    setIsCapturing(true);
    try {
      const dataUrl = await toPng(targetRef.current, {
        quality: 0.95,
        pixelRatio: 2,
        skipFonts: true,
        cacheBust: true,
      });
      setScreenshot(dataUrl);
      toast({
        title: "Screenshot captured!",
        description: "Preview your screenshot below.",
      });
    } catch (error) {
      console.error("Screenshot capture failed:", error);
      toast({
        title: "Capture failed",
        description: "Failed to capture screenshot. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCapturing(false);
    }
  };

  const handleDownload = () => {
    if (!screenshot) return;
    
    const link = document.createElement('a');
    link.download = `table-screenshot-${new Date().getTime()}.png`;
    link.href = screenshot;
    link.click();
    
    toast({
      title: "Downloaded!",
      description: "Screenshot saved to your device.",
    });
  };

  const handleShare = async () => {
    if (!screenshot) return;

    try {
      const blob = await (await fetch(screenshot)).blob();
      const file = new File([blob], `table-screenshot-${new Date().getTime()}.png`, { type: 'image/png' });
      
      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'Table Screenshot',
        });
        toast({
          title: "Shared!",
          description: "Screenshot shared successfully.",
        });
      } else {
        handleDownload();
        toast({
          title: "Share not available",
          description: "Downloaded instead. Use your device's share feature.",
        });
      }
    } catch (error) {
      console.error("Share failed:", error);
      toast({
        title: "Share failed",
        description: "Downloaded instead.",
      });
      handleDownload();
    }
  };

  const handleClose = () => {
    setScreenshot(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-3xl animate-in zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:zoom-out-95 duration-300">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            Table Screenshot
          </DialogTitle>
          <DialogDescription>
            {screenshot 
              ? "Preview and save your screenshot below." 
              : "Click 'Capture Screenshot' to take a snapshot of the table."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!screenshot ? (
            <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900/50">
              <Camera className="w-16 h-16 text-gray-400 dark:text-gray-500 mb-4" />
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                Ready to capture the table
              </p>
              <Button
                onClick={handleCapture}
                disabled={isCapturing}
                className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
                data-testid="button-capture-screenshot"
              >
                {isCapturing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                    Capturing...
                  </>
                ) : (
                  <>
                    <Camera className="w-4 h-4 mr-2" />
                    Capture Screenshot
                  </>
                )}
              </Button>
            </div>
          ) : (
            <div className="relative border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-gray-900">
              <img 
                src={screenshot} 
                alt="Screenshot preview" 
                className="w-full h-auto"
                data-testid="screenshot-preview"
              />
              <button
                onClick={() => setScreenshot(null)}
                className="absolute top-2 right-2 p-2 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors"
                data-testid="button-clear-screenshot"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {screenshot && (
          <DialogFooter className="flex-row justify-center gap-3 sm:justify-center">
            <Button
              variant="outline"
              onClick={handleDownload}
              className="min-w-[120px]"
              data-testid="button-download-screenshot"
            >
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
            <Button
              onClick={handleShare}
              className="min-w-[120px] bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
              data-testid="button-share-screenshot"
            >
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
