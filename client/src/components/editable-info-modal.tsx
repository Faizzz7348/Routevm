import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Save, X, MapPin, QrCode, Upload, ExternalLink, Globe } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { MiniMap } from "@/components/mini-map";

interface EditableInfoModalProps {
  info: string;
  rowId: string;
  code: string;
  location: string;
  latitude?: string;
  longitude?: string;
  qrCode?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (rowId: string, updates: { info?: string; latitude?: string; longitude?: string; qrCode?: string }) => void;
}

export function EditableInfoModal({ 
  info, 
  rowId, 
  code, 
  location, 
  latitude,
  longitude,
  qrCode,
  open, 
  onOpenChange,
  onSave 
}: EditableInfoModalProps) {
  // Parse existing info to separate address and description
  const parseInfo = (infoText: string) => {
    if (!infoText) return { address: "", description: "", url: "" };
    
    // Check if it contains the delimiter
    if (infoText.includes("|||DESCRIPTION|||")) {
      const parts = infoText.split("|||DESCRIPTION|||");
      const address = parts[0] || "";
      const descriptionPart = parts[1] || "";
      
      // Check if description part contains URL
      if (descriptionPart.includes("|||URL|||")) {
        const descParts = descriptionPart.split("|||URL|||");
        return {
          address: address,
          description: descParts[0] || "",
          url: descParts[1] || ""
        };
      } else {
        return {
          address: address,
          description: descriptionPart,
          url: ""
        };
      }
    } else {
      // If no delimiter, existing content should be treated as address
      return {
        address: infoText,
        description: "",
        url: ""
      };
    }
  };

  const parsed = parseInfo(info || "");
  const [editedAddress, setEditedAddress] = useState(parsed.address);
  const [editedDescription, setEditedDescription] = useState(parsed.description);
  const [editedUrl, setEditedUrl] = useState(parsed.url);
  const [editedLatitude, setEditedLatitude] = useState(latitude || "");
  const [editedLongitude, setEditedLongitude] = useState(longitude || "");
  const [editedQrCode, setEditedQrCode] = useState(qrCode || "");
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  // Helper to extract short location name from full address
  const getShortLocationName = (fullLocation: string): string => {
    if (!fullLocation) return 'Location';
    
    // If it contains comma, take the first part
    if (fullLocation.includes(',')) {
      return fullLocation.split(',')[0].trim();
    }
    
    // If it's very long (likely full address), take first 20 chars
    if (fullLocation.length > 25) {
      return fullLocation.substring(0, 20).trim() + '...';
    }
    
    return fullLocation;
  };

  const handleSave = () => {
    const updates: { info?: string; latitude?: string; longitude?: string; qrCode?: string } = {};
    
    // Combine address, description, and URL with delimiters  
    // This only saves to the 'info' field, NOT the 'location' field
    let combinedInfo = editedAddress;
    if (editedDescription.trim() || editedUrl.trim()) {
      combinedInfo += `|||DESCRIPTION|||${editedDescription}`;
      if (editedUrl.trim()) {
        combinedInfo += `|||URL|||${editedUrl}`;
      }
    }
      
    console.log("DEBUG: Saving updates - location field NOT included:", { combinedInfo, info, willUpdate: combinedInfo !== info });
      
    if (combinedInfo !== info) {
      updates.info = combinedInfo;
    }
    
    if (editedLatitude !== latitude) {
      updates.latitude = editedLatitude || undefined;
    }
    
    if (editedLongitude !== longitude) {
      updates.longitude = editedLongitude || undefined;
    }
    
    if (editedQrCode !== qrCode) {
      updates.qrCode = editedQrCode || undefined;
    }
    
    onSave(rowId, updates);
    
    // Clear fields after saving
    setEditedAddress("");
    setEditedDescription("");
    setEditedUrl("");
    setEditedLatitude("");
    setEditedLongitude("");
    setEditedQrCode("");
    
    onOpenChange(false);
    toast({
      title: "Information Updated",
      description: "Row information, coordinates and QR code have been saved successfully.",
    });
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check if it's an image file
    if (!file.type.startsWith('image/')) {
      toast({
        variant: "destructive",
        title: "Invalid File",
        description: "Please select an image file for the QR code.",
      });
      return;
    }

    setIsUploading(true);

    try {
      // Convert file to data URL
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        setEditedQrCode(dataUrl);
        setIsUploading(false);
        toast({
          title: "QR Code Uploaded",
          description: "QR code image has been uploaded successfully.",
        });
      };
      reader.onerror = () => {
        setIsUploading(false);
        toast({
          variant: "destructive",
          title: "Upload Failed",
          description: "Failed to upload the QR code image.",
        });
      };
      reader.readAsDataURL(file);
    } catch (error) {
      setIsUploading(false);
      toast({
        variant: "destructive",
        title: "Upload Error",
        description: "An error occurred while uploading the image.",
      });
    }

    // Clear the input
    event.target.value = '';
  };

  const handleCancel = () => {
    // Clear fields when canceling for consistent behavior
    setEditedAddress("");
    setEditedDescription("");
    setEditedUrl("");
    setEditedLatitude("");
    setEditedLongitude("");
    setEditedQrCode("");
    onOpenChange(false);
  };

  // Reset fields to original values when modal opens
  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      const parsed = parseInfo(info);
      setEditedAddress(parsed.address);
      setEditedDescription(parsed.description);
      setEditedUrl(parsed.url);
      setEditedLatitude(latitude || "");
      setEditedLongitude(longitude || "");
      setEditedQrCode(qrCode || "");
    }
    onOpenChange(newOpen);
  };

  // Check if coordinates are valid for mini map
  const hasValidCoordinates = () => {
    const lat = parseFloat(editedLatitude);
    const lng = parseFloat(editedLongitude);
    return !isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col bg-white/95 dark:bg-black/70 backdrop-blur-xl border border-blue-200 dark:border-white/20 shadow-2xl rounded-xl">
        <DialogHeader className="flex-shrink-0 text-center pb-4">
          <DialogTitle className="text-center text-sm font-semibold bg-gradient-to-r from-blue-600 to-cyan-600 dark:from-blue-400 dark:to-cyan-400 bg-clip-text text-transparent">
            Edit Info - {code || ''} - {getShortLocationName(location)}
          </DialogTitle>
          <DialogDescription className="text-center text-muted-foreground text-xs mt-2">
            Update location details, coordinates, and media information
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 overflow-y-auto flex-1 pr-2 px-2 -mx-6 px-6">
          <div className="bg-blue-50/80 dark:bg-black/50 backdrop-blur-sm border border-blue-200 dark:border-white/15 rounded-lg p-4 shadow-sm">
            <label className="text-sm font-medium text-blue-700 dark:text-foreground/80 mb-2 block">
              📍 Full Address (Optional):
            </label>
            <Textarea
              value={editedAddress}
              onChange={(e) => setEditedAddress(e.target.value)}
              placeholder="Enter full address details..."
              className="mt-2 min-h-[80px] text-sm bg-white/80 dark:bg-black/60 border-blue-200 dark:border-white/20 backdrop-blur-sm"
              data-testid={`textarea-address-${rowId}`}
            />
          </div>

          <div className="bg-purple-50/80 dark:bg-black/50 backdrop-blur-sm border border-purple-200 dark:border-white/15 rounded-lg p-4 shadow-sm">
            <label className="text-sm font-medium text-purple-700 dark:text-foreground/80 mb-2 block">
              📝 Description (Optional):
            </label>
            <Textarea
              value={editedDescription}
              onChange={(e) => setEditedDescription(e.target.value)}
              placeholder="Enter additional notes or description..."
              className="mt-2 min-h-[80px] text-sm bg-white/80 dark:bg-black/60 border-purple-200 dark:border-white/20 backdrop-blur-sm"
              data-testid={`textarea-description-${rowId}`}
            />
          </div>

          {/* URL Section */}
          <div className="bg-cyan-50/80 dark:bg-black/50 backdrop-blur-sm border border-cyan-200 dark:border-white/15 rounded-lg p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <label className="text-sm font-medium text-cyan-700 dark:text-foreground/80">
                <Globe className="w-4 h-4 inline mr-2" />
                🌐 Website URL (Optional):
              </label>
              {editedUrl.trim() && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-auto p-1 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 bg-white/80 dark:bg-black/40 hover:bg-white dark:hover:bg-black/50 backdrop-blur-sm border border-blue-200 dark:border-white/30"
                  onClick={() => {
                    let targetUrl = editedUrl.trim();
                    if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
                      targetUrl = 'https://' + targetUrl;
                    }
                    window.open(targetUrl, '_blank');
                  }}
                  title="Open URL in new tab"
                  data-testid={`button-test-url-${rowId}`}
                >
                  <ExternalLink className="w-3 h-3" />
                </Button>
              )}
            </div>
            <Input
              type="text"
              value={editedUrl}
              onChange={(e) => setEditedUrl(e.target.value)}
              placeholder="Enter website URL (e.g., https://example.com)..."
              className="mt-2 text-sm bg-white/80 dark:bg-black/60 border-cyan-200 dark:border-white/20 backdrop-blur-sm"
              data-testid={`input-url-${rowId}`}
            />
            <p className="text-xs text-muted-foreground mt-2">
              Add a website URL for quick access to relevant information.
            </p>
          </div>

          {/* Coordinate Section */}
          <div className="bg-green-50/80 dark:bg-black/50 backdrop-blur-sm border border-green-200 dark:border-white/15 rounded-lg p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <MapPin className="w-4 h-4 text-green-600 dark:text-blue-400" />
              <h4 className="text-sm font-medium text-green-700 dark:text-foreground/80">📍 Location Coordinates</h4>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-green-700 dark:text-foreground/70 mb-2 block">
                  Latitude:
                </label>
                <Input
                  type="text"
                  value={editedLatitude}
                  onChange={(e) => setEditedLatitude(e.target.value)}
                  placeholder="e.g. 3.139003"
                  className="mt-1 text-sm bg-white/80 dark:bg-black/60 border-green-200 dark:border-white/20 backdrop-blur-sm"
                  data-testid={`input-latitude-${rowId}`}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-green-700 dark:text-foreground/70 mb-2 block">
                  Longitude:
                </label>
                <Input
                  type="text"
                  value={editedLongitude}
                  onChange={(e) => setEditedLongitude(e.target.value)}
                  placeholder="e.g. 101.686855"
                  className="mt-1 text-sm bg-white/80 dark:bg-black/60 border-green-200 dark:border-white/20 backdrop-blur-sm"
                  data-testid={`input-longitude-${rowId}`}
                />
              </div>
            </div>

            <p className="text-xs text-muted-foreground mt-3">
              🗺️ Enter coordinates in decimal degrees format for accurate location mapping.
            </p>
          </div>

          {/* QR Code Section */}
          <div className="bg-indigo-50/80 dark:bg-black/50 backdrop-blur-sm border border-indigo-200 dark:border-white/15 rounded-lg p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <QrCode className="w-4 h-4 text-indigo-600 dark:text-purple-400" />
              <h4 className="text-sm font-medium text-indigo-700 dark:text-foreground/80">📱 QR Code Photo</h4>
            </div>
            
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-indigo-700 dark:text-muted-foreground">
                  Upload QR Code Image:
                </label>
                <div className="flex gap-2 mt-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                    id={`qr-upload-${rowId}`}
                    disabled={isUploading}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => document.getElementById(`qr-upload-${rowId}`)?.click()}
                    disabled={isUploading}
                    className="flex-1 bg-white/80 dark:bg-black/40 hover:bg-white dark:hover:bg-black/50 backdrop-blur-sm border border-indigo-200 dark:border-white/30"
                    data-testid={`button-upload-qr-${rowId}`}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    {isUploading ? 'Uploading...' : 'Upload Image'}
                  </Button>
                </div>
              </div>

              <div className="text-xs text-center text-muted-foreground">OR</div>

              <div>
                <label className="text-xs font-medium text-indigo-700 dark:text-muted-foreground">
                  Enter QR Code URL:
                </label>
                <Input
                  type="text"
                  value={editedQrCode}
                  onChange={(e) => setEditedQrCode(e.target.value)}
                  placeholder="Enter QR code photo URL..."
                  className="mt-2 text-sm bg-white/10 dark:bg-black/10 border-white/20 dark:border-white/10 backdrop-blur-sm"
                  style={{fontSize: '11px'}}
                  data-testid={`input-qrcode-${rowId}`}
                />
              </div>
            </div>

            {editedQrCode && (
              <div className="mt-2">
                <label className="text-xs font-medium text-muted-foreground">Preview:</label>
                <div className="mt-1 border rounded-md overflow-hidden">
                  <img 
                    src={editedQrCode} 
                    alt="QR Code Preview" 
                    className="w-full h-32 object-contain bg-white"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
              </div>
            )}

            <p className="text-xs text-muted-foreground">
              Add a QR code photo URL for quick access and scanning.
            </p>
          </div>

          {/* Mini Map Preview */}
          {hasValidCoordinates() && (
            <div className="space-y-2 pt-2 border-t">
              <h4 className="text-sm font-medium">Location Preview</h4>
              <MiniMap 
                locations={[{
                  latitude: parseFloat(editedLatitude),
                  longitude: parseFloat(editedLongitude),
                  label: location || 'Location',
                  code: code
                }]}
                height="120px"
                showFullscreenButton={false}
              />
              <p className="text-xs text-muted-foreground">
                Live preview of the location based on entered coordinates.
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="space-x-3 flex-shrink-0 mt-6 border-t border-white/20 dark:border-white/15 pt-4 bg-black/30 dark:bg-black/50 backdrop-blur-sm rounded-b-xl -mx-6 -mb-6 px-6 py-4">
          <Button 
            variant="outline" 
            onClick={handleCancel}
            className="border-red-600 text-red-600 hover:bg-red-50 dark:border-red-500 dark:text-red-500 dark:hover:bg-red-950/30 backdrop-blur-sm text-sm"
            data-testid={`button-cancel-info-${rowId}`}
          >
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
          <Button 
            onClick={handleSave}
            className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white border-0 shadow-lg shadow-blue-500/30 text-sm"
            data-testid={`button-save-info-${rowId}`}
          >
            <Save className="w-4 h-4 mr-2" />
            Save Info
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}