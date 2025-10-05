import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info, ListChecks, QrCode, ExternalLink, CheckCircle } from "lucide-react";
import { SiGooglemaps, SiWaze } from "react-icons/si";
import { MiniMap } from "@/components/mini-map";
import { SlidingDescription } from "@/components/sliding-description";
import QrScanner from "qr-scanner";

interface InfoModalProps {
  info: string;
  rowId: string;
  code?: string;
  location?: string;
  latitude?: string;
  longitude?: string;
  qrCode?: string;
  no?: number;
  onUpdateRow?: (updates: any) => void;
  editMode?: boolean;
  allRows?: any[];
}

export function InfoModal({ info, rowId, code, location, latitude, longitude, qrCode, no, onUpdateRow, editMode = false, allRows = [] }: InfoModalProps) {
  const [open, setOpen] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [scannedResult, setScannedResult] = useState<string>("");
  const [isScanning, setIsScanning] = useState(false);
  const [showChecklistConfirm, setShowChecklistConfirm] = useState(false);
  const [showNavigationConfirm, setShowNavigationConfirm] = useState(false);
  const [navigationType, setNavigationType] = useState<'google' | 'waze'>('google');

  // Format code to 4 digits with leading zeros
  const formatCode = (codeValue?: string) => {
    if (!codeValue) return '0000';
    const numericCode = parseInt(codeValue.replace(/\D/g, ''), 10) || 0;
    return numericCode.toString().padStart(4, '0');
  };

  const handleEditClick = () => {
    setShowChecklistConfirm(true);
  };

  const handleConfirmEditClick = () => {
    const formattedCode = formatCode(code);
    const editUrl = `https://fmvending.web.app/refill-service/M${formattedCode}`;
    window.open(editUrl, '_blank');
    setShowChecklistConfirm(false);
  };

  const handleDirectionClick = () => {
    setNavigationType('google');
    setShowNavigationConfirm(true);
  };

  const handleConfirmDirectionClick = () => {
    if (latitude && longitude && !isNaN(parseFloat(latitude)) && !isNaN(parseFloat(longitude))) {
      const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
      window.open(directionsUrl, '_blank');
    }
    setShowNavigationConfirm(false);
  };

  const handleWazeClick = () => {
    setNavigationType('waze');
    setShowNavigationConfirm(true);
  };

  const handleConfirmWazeClick = () => {
    if (latitude && longitude && !isNaN(parseFloat(latitude)) && !isNaN(parseFloat(longitude))) {
      const wazeUrl = `https://waze.com/ul?ll=${latitude},${longitude}&navigate=yes`;
      window.open(wazeUrl, '_blank');
    }
    setShowNavigationConfirm(false);
  };

  const handleQrCodeClick = async () => {
    if (!qrCode) return;

    setIsScanning(true);
    try {
      let imageSource: string | Blob = qrCode;

      // If it's a remote URL, use our proxy to avoid CORS issues
      if (qrCode.startsWith('http')) {
        const proxyUrl = `/api/proxy-image?url=${encodeURIComponent(qrCode)}`;
        const response = await fetch(proxyUrl);
        if (!response.ok) {
          throw new Error(`Failed to load image: ${response.statusText}`);
        }
        imageSource = await response.blob();
      }

      // Try to decode QR code from the image
      const result = await QrScanner.scanImage(imageSource, { returnDetailedScanResult: true });
      setScannedResult(result.data);
      setShowConfirmDialog(true);
    } catch (error) {
      console.error("QR scanning error:", error);
      // Show error toast instead of incorrect navigation
      alert("Could not read QR code from the image. Please check if the image contains a valid QR code.");
    } finally {
      setIsScanning(false);
    }
  };

  const handleConfirmNavigation = () => {
    if (scannedResult) {
      // Check if it's a valid URL, if not, treat it as a search query
      let targetUrl = scannedResult;
      
      // If it doesn't start with http/https, assume it's a search or add https
      if (!scannedResult.match(/^https?:\/\//)) {
        // If it looks like a URL without protocol, add https
        if (scannedResult.includes('.') && !scannedResult.includes(' ')) {
          targetUrl = `https://${scannedResult}`;
        } else {
          // Otherwise, search on Google
          targetUrl = `https://www.google.com/search?q=${encodeURIComponent(scannedResult)}`;
        }
      }
      
      window.open(targetUrl, '_blank');
    }
    setShowConfirmDialog(false);
    setScannedResult("");
  };

  const handleCancelNavigation = () => {
    setShowConfirmDialog(false);
    setScannedResult("");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-auto p-1 text-blue-400 hover:text-blue-300"
          data-testid={`button-info-${rowId}`}
        >
          <Info className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-hidden flex flex-col bg-white/95 dark:bg-black/80 backdrop-blur-xl border border-blue-200 dark:border-white/20 shadow-2xl rounded-2xl transition-smooth data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-top-[48%] duration-250 ease-out">
        <DialogHeader className="pb-6 border-b border-blue-200 dark:border-white/10 flex-shrink-0">
          <DialogTitle className="font-bold text-lg text-center bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
            {location || 'Location'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="py-6 space-y-6 overflow-y-auto flex-1">
          {/* Mini Map Section */}
          {latitude && longitude && !isNaN(parseFloat(latitude)) && !isNaN(parseFloat(longitude)) && (
            <div className="bg-transparent backdrop-blur-sm rounded-xl p-4 space-y-3 shadow-sm">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 dark:bg-green-400 rounded-full animate-pulse"></div>
                <h4 className="text-sm font-semibold text-green-600 dark:text-green-400">🗺️ Location Map</h4>
              </div>
              <MiniMap 
                locations={(() => {
                  const currentLocation = {
                    latitude: parseFloat(latitude),
                    longitude: parseFloat(longitude),
                    label: location || 'Location',
                    code: code,
                    isCurrent: true
                  };
                  
                  // For fullscreen: collect all locations from allRows with valid coordinates
                  const allLocations = allRows
                    .filter(row => 
                      row.latitude && 
                      row.longitude && 
                      !isNaN(parseFloat(String(row.latitude))) && 
                      !isNaN(parseFloat(String(row.longitude)))
                    )
                    .map(row => ({
                      latitude: parseFloat(String(row.latitude)),
                      longitude: parseFloat(String(row.longitude)),
                      label: row.location || 'Location',
                      code: row.code,
                      isCurrent: row.id === rowId
                    }));
                  
                  // For mini view, show only current location
                  // For fullscreen, it will show all locations
                  return allLocations.length > 1 ? allLocations : [currentLocation];
                })()}
                height="160px"
                showFullscreenButton={true}
              />
            </div>
          )}

          {/* Full Address Section */}
          <div className="bg-transparent backdrop-blur-sm rounded-xl p-4 space-y-3 shadow-sm">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 dark:bg-blue-400 rounded-full"></div>
              <h4 className="text-sm font-semibold text-blue-600 dark:text-blue-400">📍 Full Address</h4>
            </div>
            <SlidingDescription
              value={(() => {
                if (!info) return "";
                if (info.includes("|||DESCRIPTION|||")) {
                  return info.split("|||DESCRIPTION|||")[0] || "";
                }
                return info;
              })()}
              onSave={(value) => {
                const currentInfo = info || "";
                let newInfo = value;
                
                // Preserve description if it exists
                if (currentInfo.includes("|||DESCRIPTION|||")) {
                  const description = currentInfo.split("|||DESCRIPTION|||")[1] || "";
                  if (description.trim()) {
                    newInfo = `${value}|||DESCRIPTION|||${description}`;
                  }
                }
                
                onUpdateRow?.({ info: newInfo });
              }}
              isEditable={editMode}
            />
          </div>

          {/* Description Section */}
          <div className="bg-transparent backdrop-blur-sm rounded-xl p-4 space-y-3 shadow-sm">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-purple-500 dark:bg-purple-400 rounded-full"></div>
              <h4 className="text-sm font-semibold text-purple-600 dark:text-purple-400">📝 Description</h4>
            </div>
            <SlidingDescription
              value={(() => {
                if (!info) return "";
                if (info.includes("|||DESCRIPTION|||")) {
                  const withDescription = info.split("|||DESCRIPTION|||")[1] || "";
                  if (withDescription.includes("|||URL|||")) {
                    return withDescription.split("|||URL|||")[0] || "";
                  }
                  return withDescription;
                }
                return "";
              })()}
              onSave={(value) => {
                const currentInfo = info || "";
                let address = "";
                let url = "";
                
                // Parse current info
                if (currentInfo.includes("|||DESCRIPTION|||")) {
                  address = currentInfo.split("|||DESCRIPTION|||")[0] || "";
                  const descriptionPart = currentInfo.split("|||DESCRIPTION|||")[1] || "";
                  if (descriptionPart.includes("|||URL|||")) {
                    url = descriptionPart.split("|||URL|||")[1] || "";
                  }
                } else {
                  address = currentInfo;
                }
                
                // Combine with new description
                let newInfo = address;
                if (value.trim() || url.trim()) {
                  newInfo += `|||DESCRIPTION|||${value}`;
                  if (url.trim()) {
                    newInfo += `|||URL|||${url}`;
                  }
                }
                
                onUpdateRow?.({ info: newInfo });
              }}
              isEditable={editMode}
            />
          </div>

          {/* URL Section */}
          <div className="bg-transparent backdrop-blur-sm rounded-xl p-4 space-y-3 shadow-sm">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-cyan-500 dark:bg-cyan-400 rounded-full"></div>
              <h4 className="text-sm font-semibold text-cyan-600 dark:text-cyan-400">🌐 Website URL</h4>
              {(() => {
                const url = (() => {
                  if (!info) return "";
                  if (info.includes("|||URL|||")) {
                    return info.split("|||URL|||").pop() || "";
                  }
                  return "";
                })();
                
                return url.trim() ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-1 text-blue-400 hover:text-blue-300"
                    onClick={() => {
                      let targetUrl = url.trim();
                      if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
                        targetUrl = 'https://' + targetUrl;
                      }
                      window.open(targetUrl, '_blank');
                    }}
                    title="Open URL in new tab"
                    data-testid={`button-open-url-${rowId}`}
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                ) : null;
              })()}
            </div>
            <SlidingDescription
              value={(() => {
                if (!info) return "";
                if (info.includes("|||URL|||")) {
                  return info.split("|||URL|||").pop() || "";
                }
                return "";
              })()}
              onSave={(value) => {
                const currentInfo = info || "";
                let address = "";
                let description = "";
                
                // Parse current info
                if (currentInfo.includes("|||DESCRIPTION|||")) {
                  address = currentInfo.split("|||DESCRIPTION|||")[0] || "";
                  const descriptionPart = currentInfo.split("|||DESCRIPTION|||")[1] || "";
                  if (descriptionPart.includes("|||URL|||")) {
                    description = descriptionPart.split("|||URL|||")[0] || "";
                  } else {
                    description = descriptionPart;
                  }
                } else {
                  address = currentInfo;
                }
                
                // Combine with new URL
                let newInfo = address;
                if (description.trim() || value.trim()) {
                  newInfo += `|||DESCRIPTION|||${description}`;
                  if (value.trim()) {
                    newInfo += `|||URL|||${value}`;
                  }
                }
                
                onUpdateRow?.({ info: newInfo });
              }}
              isEditable={editMode}
            />
          </div>

        </div>
        <DialogFooter className="pt-6 mt-2 border-t border-blue-200 dark:border-white/10 bg-blue-50/50 dark:bg-black/30 backdrop-blur-sm rounded-b-2xl -mx-6 -mb-6 px-6 py-4">
          <div className="flex justify-between items-center w-full">
            <div className="flex gap-2 flex-wrap">
              {location !== "QL kitchen" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleEditClick}
                  className="pagination-button"
                  data-testid={`button-edit-${rowId}`}
                >
                  <ListChecks className="w-4 h-4 text-green-600" />
                </Button>
              )}
              {qrCode && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleQrCodeClick}
                  disabled={isScanning}
                  className="pagination-button"
                  data-testid={`button-qrcode-${rowId}`}
                >
                  <QrCode className="w-4 h-4 text-purple-600" />
                  {isScanning && <span className="ml-1 text-xs">Scanning...</span>}
                </Button>
              )}
              {latitude && longitude && !isNaN(parseFloat(latitude)) && !isNaN(parseFloat(longitude)) && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDirectionClick}
                    className="pagination-button"
                    data-testid={`button-direction-${rowId}`}
                  >
                    <SiGooglemaps className="w-4 h-4 text-red-500" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleWazeClick}
                    className="pagination-button"
                    data-testid={`button-waze-${rowId}`}
                  >
                    <SiWaze className="w-4 h-4 text-blue-500" />
                  </Button>
                </>
              )}
            </div>
            <div className="text-sm text-muted-foreground">
              #{no || 0} - {code || ''}
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
      
      {/* QR Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={handleCancelNavigation}>
        <DialogContent className="max-w-md animate-in zoom-in-95 duration-200">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              QR Code Detected
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <Alert>
              <ExternalLink className="w-4 h-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <p><strong>Detected content:</strong></p>
                  <div className="bg-muted p-2 rounded text-sm font-mono break-all">
                    {scannedResult}
                  </div>
                </div>
              </AlertDescription>
            </Alert>

            <p className="text-sm text-muted-foreground">
              Do you want to navigate to this link? It will open in a new tab.
            </p>
          </div>

          <DialogFooter className="flex-col-reverse sm:flex-row gap-2">
            <Button 
              variant="outline" 
              onClick={handleCancelNavigation}
              data-testid="button-cancel-qr-navigation"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleConfirmNavigation}
              className="bg-green-600 hover:bg-green-700"
              data-testid="button-confirm-qr-navigation"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Open Link
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Checklist Confirmation Dialog */}
      <Dialog open={showChecklistConfirm} onOpenChange={setShowChecklistConfirm}>
        <DialogContent className="max-w-md animate-in zoom-in-95 duration-200">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ListChecks className="w-5 h-5 text-green-600" />
              Open Checklist
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <Alert>
              <ExternalLink className="w-4 h-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <p><strong>External Link:</strong></p>
                  <div className="bg-muted p-2 rounded text-sm font-mono break-all">
                    https://fmvending.web.app/refill-service/M{formatCode(code)}
                  </div>
                </div>
              </AlertDescription>
            </Alert>

            <p className="text-sm text-muted-foreground">
              Do you want to open the refill service checklist? It will open in a new tab.
            </p>
          </div>

          <DialogFooter className="flex-col-reverse sm:flex-row gap-2">
            <Button 
              variant="outline" 
              onClick={() => setShowChecklistConfirm(false)}
              data-testid="button-cancel-checklist"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleConfirmEditClick}
              className="bg-green-600 hover:bg-green-700"
              data-testid="button-confirm-checklist"
            >
              <ListChecks className="w-4 h-4 mr-2" />
              Open Checklist
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Navigation Confirmation Dialog */}
      <Dialog open={showNavigationConfirm} onOpenChange={setShowNavigationConfirm}>
        <DialogContent className="max-w-md animate-in zoom-in-95 duration-200">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {navigationType === 'google' ? (
                <SiGooglemaps className="w-5 h-5 text-red-500" />
              ) : (
                <SiWaze className="w-5 h-5 text-blue-500" />
              )}
              Open Navigation
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <Alert>
              <ExternalLink className="w-4 h-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <p><strong>Navigation to:</strong></p>
                  <div className="bg-muted p-2 rounded text-sm">
                    {location || 'Location'} ({latitude}, {longitude})
                  </div>
                  <p className="text-sm">Using {navigationType === 'google' ? 'Google Maps' : 'Waze'}</p>
                </div>
              </AlertDescription>
            </Alert>

            <p className="text-sm text-muted-foreground">
              Do you want to open navigation to this location? It will open in a new tab.
            </p>
          </div>

          <DialogFooter className="flex-col-reverse sm:flex-row gap-2">
            <Button 
              variant="outline" 
              onClick={() => setShowNavigationConfirm(false)}
              data-testid="button-cancel-navigation"
            >
              Cancel
            </Button>
            <Button 
              onClick={navigationType === 'google' ? handleConfirmDirectionClick : handleConfirmWazeClick}
              className={navigationType === 'google' ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'}
              data-testid="button-confirm-navigation"
            >
              {navigationType === 'google' ? (
                <SiGooglemaps className="w-4 h-4 mr-2" />
              ) : (
                <SiWaze className="w-4 h-4 mr-2" />
              )}
              Open {navigationType === 'google' ? 'Google Maps' : 'Waze'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}