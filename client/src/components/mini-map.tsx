import { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Maximize2 } from "lucide-react";
import L from "leaflet";

// Fix for default markers in Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

// Custom black marker for current location
const blackIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-black.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Custom blue marker for other locations
const blueIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

interface MapLocation {
  latitude: number;
  longitude: number;
  label: string;
  code?: string;
  isCurrent?: boolean;
}

interface MiniMapProps {
  locations: MapLocation[];
  height?: string;
  showFullscreenButton?: boolean;
}

function MapResizer({
  center,
  zoom,
}: {
  center: [number, number];
  zoom: number;
}) {
  const map = useMap();

  useEffect(() => {
    if (!map || !map.getContainer()) return;
    
    try {
      map.setView(center, zoom);
      
      // Small delay to ensure proper rendering with better error handling
      const timeout = setTimeout(() => {
        try {
          if (map && map.getContainer() && map.getContainer().parentNode) {
            // Check if the map container is still in the DOM
            const container = map.getContainer();
            if (container && (container as any)._leaflet_pos !== undefined) {
              map.invalidateSize();
            }
          }
        } catch (sizeError: any) {
          // Silently handle sizing errors that occur during cleanup
          console.debug('Map invalidateSize skipped:', sizeError?.message || 'Unknown error');
        }
      }, 150);

      return () => {
        clearTimeout(timeout);
      };
    } catch (error) {
      console.warn('Map error:', error);
    }
  }, [map, center, zoom]);

  return null;
}

export function MiniMap({
  locations,
  height = "500px",
  showFullscreenButton = true,
}: MiniMapProps) {
  const [fullscreenOpen, setFullscreenOpen] = useState(false);

  const MapContent = ({ isFullscreen = false }: { isFullscreen?: boolean }) => {
    // For mini view: show only current location; for fullscreen: show all
    const renderedLocations = isFullscreen 
      ? locations 
      : locations.filter(l => l.isCurrent).length 
        ? locations.filter(l => l.isCurrent) 
        : [locations[0]];

    // Calculate center and zoom from rendered locations
    const calcCenter = (): [number, number] => {
      if (renderedLocations.length === 0) return [3.139003, 101.686855];
      const avgLat = renderedLocations.reduce((sum, loc) => sum + loc.latitude, 0) / renderedLocations.length;
      const avgLng = renderedLocations.reduce((sum, loc) => sum + loc.longitude, 0) / renderedLocations.length;
      return [avgLat, avgLng];
    };

    const calcZoom = (): number => {
      if (renderedLocations.length <= 1) return 15;
      const lats = renderedLocations.map((loc) => loc.latitude);
      const lngs = renderedLocations.map((loc) => loc.longitude);
      const latRange = Math.max(...lats) - Math.min(...lats);
      const lngRange = Math.max(...lngs) - Math.min(...lngs);
      const maxRange = Math.max(latRange, lngRange);
      if (maxRange > 5) return 8;
      if (maxRange > 2) return 10;
      if (maxRange > 1) return 12;
      if (maxRange > 0.5) return 13;
      if (maxRange > 0.1) return 14;
      return 15;
    };

    const center = calcCenter();
    const zoom = calcZoom();

    return (
    <MapContainer
      center={center}
      zoom={zoom}
      style={{ height: isFullscreen ? "70vh" : height, width: "100%" }}
      className="rounded-lg border border-border"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapResizer center={center} zoom={zoom} />
      {renderedLocations.map((location, index) => (
        <Marker 
          key={index} 
          position={[location.latitude, location.longitude]}
          icon={isFullscreen ? (location.isCurrent ? blackIcon : blueIcon) : blackIcon}
        >
          <Popup>
            <div className="text-center">
              <div className="font-semibold">{location.label}</div>
              {location.code && (
                <div className="text-sm text-muted-foreground">
                  {location.code}
                </div>
              )}
              <div className="text-xs text-muted-foreground mt-1">
                {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
              </div>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
    );
  };

  if (locations.length === 0) {
    return (
      <div
        style={{ height }}
        className="flex items-center justify-center bg-muted rounded-lg border border-border"
      >
        <p className="text-sm text-muted-foreground">
          No location data available
        </p>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="pointer-events-auto">
        <MapContent />
      </div>
      
      {showFullscreenButton && (
        <div className="absolute top-2 right-2 z-[1001] pointer-events-auto">
          <Dialog open={fullscreenOpen} onOpenChange={setFullscreenOpen}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="bg-white/95 hover:bg-white shadow-lg border-2 border-gray-400 backdrop-blur-sm pointer-events-auto"
                data-testid="button-fullscreen-map"
              >
                <Maximize2 className="w-4 h-4 text-black" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl w-full">
              <DialogHeader>
                <DialogTitle>
                  Map View - {locations.length === 1 
                    ? locations[0].label 
                    : `${locations.length} Locations`}
                </DialogTitle>
              </DialogHeader>
              <div className="mt-4">
                <MapContent isFullscreen />
              </div>
            </DialogContent>
          </Dialog>
        </div>
      )}
    </div>
  );
}
