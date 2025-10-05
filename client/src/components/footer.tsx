import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Pencil } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { getUserId } from "@/lib/utils";
import type { LayoutPreferences } from "@shared/schema";

interface FooterProps {
  editMode?: boolean;
}

export function Footer({ editMode = false }: FooterProps) {
  const currentYear = new Date().getFullYear();
  const [isVisible, setIsVisible] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [creatorName, setCreatorName] = useState("Somebody");
  const [creatorUrl, setCreatorUrl] = useState("");
  const { toast } = useToast();

  // Fetch layout preferences to get creator info
  const userId = getUserId();
  const { data: layout } = useQuery<LayoutPreferences>({
    queryKey: ['/api/layout', userId],
    queryFn: async () => {
      const res = await fetch(`/api/layout?userId=${encodeURIComponent(userId)}`);
      if (res.status === 404) {
        return null;
      }
      if (!res.ok) {
        throw new Error('Failed to fetch layout preferences');
      }
      return res.json();
    },
  });

  // Update mutation
  const updateLayoutMutation = useMutation({
    mutationFn: async (data: { creatorName: string; creatorUrl: string }) => {
      const res = await apiRequest('POST', '/api/layout', {
        userId,
        ...data,
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/layout', userId] });
      setEditDialogOpen(false);
      toast({
        title: "Success",
        description: "Footer updated successfully!",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update footer",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (layout) {
      setCreatorName(layout.creatorName || "Somebody");
      setCreatorUrl(layout.creatorUrl || "");
    }
  }, [layout]);

  useEffect(() => {
    // Trigger entrance animation
    const timer1 = setTimeout(() => setIsVisible(true), 100);
    const timer2 = setTimeout(() => setIsLoaded(true), 300);
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  const handleSave = () => {
    updateLayoutMutation.mutate({ creatorName, creatorUrl });
  };

  const CreatorContent = () => {
    const displayName = layout?.creatorName || "Somebody";
    const url = layout?.creatorUrl || "";

    if (url && url.trim()) {
      return (
        <a 
          href={url} 
          target="_blank" 
          rel="noopener noreferrer"
          className="font-bold bg-gradient-to-r from-blue-600 via-blue-400 to-blue-600 dark:from-blue-300 dark:via-blue-100 dark:to-blue-300 bg-clip-text text-transparent hover:from-blue-500 hover:via-blue-300 hover:to-blue-500 transition-all cursor-pointer"
        >
          {displayName}
        </a>
      );
    }

    return (
      <span className="font-bold bg-gradient-to-r from-gray-600 via-gray-400 to-gray-600 dark:from-gray-300 dark:via-gray-100 dark:to-gray-300 bg-clip-text text-transparent">
        {displayName}
      </span>
    );
  };

  return (
    <>
      <footer 
        className={`fixed bottom-0 left-0 right-0 bg-gradient-to-r from-blue-500/10 via-blue-600/10 to-blue-700/10 dark:from-blue-500/20 dark:via-blue-600/20 dark:to-blue-700/20 backdrop-blur-lg border-t-2 border-blue-500/50 dark:border-blue-400/50 px-4 py-3 text-sm transition-all duration-500 ease-out shadow-lg shadow-blue-500/20 ${
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'
        }`}
      >
        <div className="container mx-auto">
          <div className={`flex items-center justify-center gap-2 transition-all duration-700 ease-out text-[11px] ${
            isLoaded ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
          }`}>
            <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400 font-semibold">
              <span className="text-xs">©</span>
              <span className="font-bold">{currentYear}</span>
              <span>All Rights Reserved</span>
            </div>
            <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
            <div className="flex items-center gap-1">
              <span className="text-gray-500 dark:text-gray-400 font-semibold">Create By</span>
              <CreatorContent />
              {editMode && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setEditDialogOpen(true)}
                  className="h-5 w-5 p-0 ml-1 opacity-60 hover:opacity-100"
                  data-testid="button-edit-footer"
                >
                  <Pencil className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </footer>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Footer</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="creator-name">Creator Name</Label>
              <Input
                id="creator-name"
                value={creatorName}
                onChange={(e) => setCreatorName(e.target.value)}
                placeholder="Enter creator name"
                data-testid="input-creator-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="creator-url">Creator URL (optional)</Label>
              <Input
                id="creator-url"
                type="url"
                value={creatorUrl}
                onChange={(e) => setCreatorUrl(e.target.value)}
                placeholder="https://example.com"
                data-testid="input-creator-url"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={updateLayoutMutation.isPending}>
              {updateLayoutMutation.isPending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}