import { useState, useEffect } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { GripVertical, RotateCcw, X, CheckCheck } from "lucide-react";
import { TableColumn } from "@shared/schema";

interface ColumnCustomizationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  columns: TableColumn[];
  visibleColumns: string[];
  onApplyChanges: (visibleColumns: string[], columnOrder: string[]) => void;
}

interface ColumnItem {
  id: string;
  name: string;
  dataKey: string;
  visible: boolean;
  isCore: boolean;
}

export function ColumnCustomizationModal({
  open,
  onOpenChange,
  columns,
  visibleColumns,
  onApplyChanges,
}: ColumnCustomizationModalProps) {
  const [localColumns, setLocalColumns] = useState<ColumnItem[]>([]);
  const [originalColumns, setOriginalColumns] = useState<ColumnItem[]>([]);

  // Core columns that cannot be hidden (using column names since Action is UI-only)
  const coreColumnNames = ['ID', 'No', 'Route', 'Code', 'Location', 'Trip', 'Destination'];

  useEffect(() => {
    if (columns.length > 0) {
      const columnItems: ColumnItem[] = columns
        .filter(column => !['longitude', 'latitude'].includes(column.dataKey)) // Hide longitude and latitude columns
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map(column => ({
          id: column.id,
          name: column.name,
          dataKey: column.dataKey,
          visible: visibleColumns.includes(column.id),
          isCore: coreColumnNames.includes(column.name),
        }));
      setLocalColumns(columnItems);
      setOriginalColumns(columnItems);
    }
  }, [columns, visibleColumns]);

  const handleToggleVisibility = (columnId: string) => {
    setLocalColumns(prev =>
      prev.map(col =>
        col.id === columnId ? { ...col, visible: !col.visible } : col
      )
    );
  };

  const handleDragEnd = (result: any) => {
    if (!result.destination) return;

    const reorderedColumns = Array.from(localColumns);
    const [reorderedItem] = reorderedColumns.splice(result.source.index, 1);
    reorderedColumns.splice(result.destination.index, 0, reorderedItem);

    setLocalColumns(reorderedColumns);
  };

  const handleApply = () => {
    const visibleIds = localColumns.filter(col => col.visible).map(col => col.id);
    const columnOrder = localColumns.map(col => col.id);
    onApplyChanges(visibleIds, columnOrder);
    onOpenChange(false);
  };

  const handleReset = () => {
    const resetColumns = columns
      .filter(column => !['longitude', 'latitude'].includes(column.dataKey)) // Hide longitude and latitude columns
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map(column => ({
        id: column.id,
        name: column.name,
        dataKey: column.dataKey,
        visible: true, // Show all columns by default
        isCore: coreColumnNames.includes(column.name),
      }));
    setLocalColumns(resetColumns);
  };

  const visibleCount = localColumns.filter(col => col.visible).length;

  // Check if there are changes compared to original state
  const hasChanges = () => {
    if (localColumns.length !== originalColumns.length) return true;
    if (originalColumns.length === 0) return false; // No changes if no original data
    
    // Check visibility changes - compare by ID to handle order changes
    for (const currentCol of localColumns) {
      const originalCol = originalColumns.find(col => col.id === currentCol.id);
      if (!originalCol || originalCol.visible !== currentCol.visible) {
        return true;
      }
    }
    
    // Check order changes
    const originalOrder = originalColumns.map(col => col.id);
    const currentOrder = localColumns.map(col => col.id);
    
    if (originalOrder.length !== currentOrder.length) return true;
    
    for (let i = 0; i < originalOrder.length; i++) {
      if (originalOrder[i] !== currentOrder[i]) {
        return true;
      }
    }
    
    return false;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-white dark:bg-gray-900 backdrop-blur-lg border-2 border-gray-300 dark:border-gray-700 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
            Customize Columns
            <span className="text-sm text-gray-600 dark:text-gray-400 font-normal">
              ({visibleCount} of {localColumns.length} visible)
            </span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Toggle column visibility and drag to reorder them in your table.
          </p>

          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="column-customization">
              {(provided) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className="space-y-2 max-h-80 overflow-y-auto"
                >
                  {localColumns.map((column, index) => (
                    <Draggable
                      key={column.id}
                      draggableId={column.id}
                      index={index}
                    >
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className={`flex items-center justify-between p-3 rounded-lg border-2 bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-600 ${
                            snapshot.isDragging ? 'shadow-lg border-blue-500 dark:border-blue-400' : ''
                          } ${!column.visible ? 'opacity-60' : ''}`}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              {...provided.dragHandleProps}
                              className="cursor-grab active:cursor-grabbing text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                            >
                              <GripVertical className="w-4 h-4" />
                            </div>
                            <Label
                              htmlFor={`column-${column.id}`}
                              className="text-sm font-medium cursor-pointer text-gray-900 dark:text-gray-100"
                            >
                              {column.name}
                            </Label>
                          </div>
                          <Switch
                            id={`column-${column.id}`}
                            checked={column.visible}
                            onCheckedChange={() => handleToggleVisibility(column.id)}
                            disabled={column.isCore && column.visible && visibleCount <= 1}
                            data-testid={`switch-column-${column.dataKey}`}
                          />
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>

          <div className="text-sm text-gray-700 dark:text-gray-300 bg-blue-50 dark:bg-blue-900/20 p-2 rounded border border-blue-200 dark:border-blue-800">
            <strong className="text-gray-900 dark:text-gray-100">Tip:</strong> At least one column must remain visible. Core columns are recommended to stay visible for the best experience.
          </div>
        </div>

        <DialogFooter className="flex justify-center">
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleReset}
              size="sm"
              className="w-8 h-8 p-0"
              data-testid="button-reset-columns"
              title="Reset columns"
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              size="sm"
              className="w-8 h-8 p-0"
              data-testid="button-cancel-customize"
              title="Cancel"
            >
              <X className="w-4 h-4" />
            </Button>
            <Button 
              onClick={handleApply} 
              size="sm" 
              className={`w-8 h-8 p-0 transition-all duration-200 ${hasChanges() ? 'bg-transparent border border-border/50 text-green-500 hover:text-green-400 hover:bg-green-500/10' : 'bg-transparent border border-border/50 text-muted-foreground hover:text-foreground hover:bg-background/50'}`} 
              data-testid="button-apply-customize" 
              title="Apply changes"
            >
              <CheckCheck className="w-4 h-4" />
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}