import { GripVertical, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TableColumn } from "@shared/schema";

interface ColumnHeaderProps {
  column: TableColumn;
  dragHandleProps: any;
  onDelete: () => void;
  isAuthenticated?: boolean;
  editMode?: boolean;
}

export function ColumnHeader({ column, dragHandleProps, onDelete, isAuthenticated = false, editMode = false }: ColumnHeaderProps) {
  // Core columns that cannot be deleted (based on dataKey)
  const coreColumnDataKeys = ['id', 'no', 'route', 'code', 'location', 'trip', 'tngRoute', 'info', 'images', 'kilometer', 'tollPrice'];
  const isCoreColumn = coreColumnDataKeys.includes(column.dataKey);
  
  return (
    <div className="flex items-center justify-center w-full relative">
      <div className="text-center">
        <span className="block bg-gradient-to-r from-blue-600 to-cyan-600 dark:from-blue-400 dark:to-cyan-400 bg-clip-text text-transparent font-medium" style={{fontSize: '11px'}}>{column.name}</span>
        {editMode && (
          <span className="block text-sm text-blue-500 dark:text-blue-400 opacity-70">
            #{column.sortOrder}
          </span>
        )}
      </div>
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
