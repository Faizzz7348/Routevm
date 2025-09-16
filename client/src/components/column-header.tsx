import { GripVertical, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TableColumn } from "@shared/schema";

interface ColumnHeaderProps {
  column: TableColumn;
  dragHandleProps: any;
  onDelete: () => void;
  isAuthenticated?: boolean;
}

export function ColumnHeader({ column, dragHandleProps, onDelete, isAuthenticated = false }: ColumnHeaderProps) {
  // Core columns that cannot be deleted
  const coreColumnIds = ['col-1', 'col-2', 'col-3', 'col-4', 'col-5', 'col-6', 'col-7', 'col-8', 'col-9'];
  const isCoreColumn = coreColumnIds.includes(column.id);
  
  return (
    <div className="flex items-center justify-center w-full relative">
      <span className="text-center">{column.name}</span>
      <div className="absolute right-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <div {...dragHandleProps} className="cursor-grab active:cursor-grabbing">
          <GripVertical className="w-3 h-3 text-muted-foreground" data-testid={`drag-handle-${column.dataKey}`} />
        </div>
        {!isCoreColumn && (
          <Button
            size="sm"
            variant="ghost"
            className={`h-auto p-0 text-sm ${!isAuthenticated ? 'opacity-50 cursor-not-allowed text-muted-foreground' : 'text-muted-foreground hover:text-destructive'}`}
            onClick={() => isAuthenticated && onDelete()}
            disabled={!isAuthenticated}
            title={!isAuthenticated ? "Authentication required to delete columns" : "Delete column"}
            data-testid={`button-delete-column-${column.dataKey}`}
          >
            <X className="w-3 h-3" />
          </Button>
        )}
      </div>
    </div>
  );
}
