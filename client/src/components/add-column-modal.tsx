import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Columns } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AddColumnModalProps {
  onCreateColumn: (columnData: {
    name: string;
    dataKey: string;
    type: string;
    options?: string[];
  }) => Promise<void>;
  disabled?: boolean;
}

export function AddColumnModal({ onCreateColumn, disabled }: AddColumnModalProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [dataKey, setDataKey] = useState("");
  const [type, setType] = useState("text");
  const [options, setOptions] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();

  const columnTypes = [
    { value: "text", label: "Text" },
    { value: "number", label: "Number" },
    { value: "currency", label: "Currency (MYR)" },
    { value: "select", label: "Select Options" },
    { value: "images", label: "Images" },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast({
        title: "Error",
        description: "Column name is required.",
        variant: "destructive",
      });
      return;
    }

    if (!dataKey.trim()) {
      toast({
        title: "Error", 
        description: "Data key is required.",
        variant: "destructive",
      });
      return;
    }

    setIsCreating(true);
    
    try {
      const columnData: any = {
        name: name.trim(),
        dataKey: dataKey.trim(),
        type,
      };

      // Add options for select type
      if (type === "select" && options.trim()) {
        columnData.options = options
          .split("\n")
          .map(option => option.trim())
          .filter(option => option.length > 0);
      }

      await onCreateColumn(columnData);
      
      // Reset form
      setName("");
      setDataKey("");
      setType("text");
      setOptions("");
      setOpen(false);
      
      toast({
        title: "Success",
        description: "Column created successfully!",
      });
    } catch (error) {
      console.error("Error creating column:", error);
      toast({
        title: "Error",
        description: "Failed to create column. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const generateDataKey = (columnName: string) => {
    return columnName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '_')
      .replace(/_{2,}/g, '_')
      .replace(/^_|_$/g, '');
  };

  const handleNameChange = (value: string) => {
    setName(value);
    if (value && !dataKey) {
      setDataKey(generateDataKey(value));
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="btn-glass w-8 h-8 p-0 pagination-button md:w-20 md:h-9 md:px-3"
          disabled={disabled}
          data-testid="button-add-column"
          title="Add new field"
        >
          <Columns className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Columns className="w-5 h-5" />
            Add New Field
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="column-name">Field Name</Label>
            <Input
              id="column-name"
              placeholder="Enter column name..."
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              data-testid="input-column-name"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="data-key">Data Key</Label>
            <Input
              id="data-key"
              placeholder="data_key"
              value={dataKey}
              onChange={(e) => setDataKey(e.target.value)}
              data-testid="input-data-key"
              required
            />
            <p className="text-xs text-muted-foreground">
              Unique identifier for this column (auto-generated from name)
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="column-type">Column Type</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger data-testid="select-column-type">
                <SelectValue placeholder="Select column type" />
              </SelectTrigger>
              <SelectContent>
                {columnTypes.map((columnType) => (
                  <SelectItem key={columnType.value} value={columnType.value}>
                    {columnType.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {type === "select" && (
            <div className="space-y-2">
              <Label htmlFor="options">Select Options</Label>
              <Textarea
                id="options"
                placeholder="Enter options (one per line)&#10;Option 1&#10;Option 2&#10;Option 3"
                value={options}
                onChange={(e) => setOptions(e.target.value)}
                data-testid="textarea-options"
                rows={4}
              />
              <p className="text-xs text-muted-foreground">
                Enter each option on a new line
              </p>
            </div>
          )}
          
          {type === "currency" && (
            <div className="p-3 bg-muted rounded-md">
              <p className="text-sm text-muted-foreground">
                ✨ Currency columns will display values in Malaysian Ringgit (MYR) format
              </p>
            </div>
          )}
          
          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isCreating}
              data-testid="button-cancel-column"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isCreating}
              data-testid="button-create-column"
            >
              {isCreating ? "Creating..." : "Create Column"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}