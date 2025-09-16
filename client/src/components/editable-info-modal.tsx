import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Save, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface EditableInfoModalProps {
  info: string;
  rowId: string;
  code: string;
  location: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (rowId: string, newInfo: string) => void;
}

export function EditableInfoModal({ 
  info, 
  rowId, 
  code, 
  location, 
  open, 
  onOpenChange,
  onSave 
}: EditableInfoModalProps) {
  const [editedInfo, setEditedInfo] = useState(info || "");
  const { toast } = useToast();

  const handleSave = () => {
    onSave(rowId, editedInfo);
    onOpenChange(false);
    toast({
      title: "Info Updated",
      description: "Row information has been saved successfully.",
    });
  };

  const handleCancel = () => {
    setEditedInfo(info || "");
    onOpenChange(false);
  };

  // Reset edited info when modal opens
  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      setEditedInfo(info || "");
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle style={{fontSize: '12px'}}>
            Edit Info - {code || ''} - {location || ''}
          </DialogTitle>
        </DialogHeader>
        
        <div className="mt-4 space-y-4">
          <div>
            <label className="text-sm font-medium text-muted-foreground" style={{fontSize: '10px'}}>
              Information:
            </label>
            <Textarea
              value={editedInfo}
              onChange={(e) => setEditedInfo(e.target.value)}
              placeholder="Enter row information..."
              className="mt-1 min-h-[120px] text-sm"
              style={{fontSize: '10px'}}
              data-testid={`textarea-info-${rowId}`}
            />
          </div>
        </div>

        <DialogFooter className="space-x-2">
          <Button 
            variant="outline" 
            onClick={handleCancel}
            style={{fontSize: '10px'}}
            data-testid={`button-cancel-info-${rowId}`}
          >
            <X className="w-3 h-3 mr-1" />
            Cancel
          </Button>
          <Button 
            onClick={handleSave}
            style={{fontSize: '10px'}}
            data-testid={`button-save-info-${rowId}`}
          >
            <Save className="w-3 h-3 mr-1" />
            Save Info
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}