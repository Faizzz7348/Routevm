import { useState, useEffect } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { GripVertical, RotateCcw } from "lucide-react";
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

  // Core columns that cannot be hidden
  const coreColumnIds = ['col-1', 'col-2', 'col-3', 'col-4', 'col-5', 'col-6', 'col-7', 'col-8', 'col-9'];

  useEffect(() => {
    if (columns.length > 0) {
      const columnItems: ColumnItem[] = columns
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map(column => ({
          id: column.id,
          name: column.name,
          dataKey: column.dataKey,
          visible: visibleColumns.includes(column.id),
          isCore: coreColumnIds.includes(column.id),
        }));
      setLocalColumns(columnItems);
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
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map(column => ({
        id: column.id,
        name: column.name,
        dataKey: column.dataKey,
        visible: true, // Show all columns by default
        isCore: coreColumnIds.includes(column.id),
      }));
    setLocalColumns(resetColumns);
  };

  const visibleCount = localColumns.filter(col => col.visible).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Customize Columns
            <span className="text-sm text-muted-foreground font-normal">
              ({visibleCount} of {localColumns.length} visible)
            </span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
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
                          className={`flex items-center justify-between p-3 rounded-lg border bg-background/50 ${
                            snapshot.isDragging ? 'shadow-lg' : ''
                          } ${!column.visible ? 'opacity-60' : ''}`}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              {...provided.dragHandleProps}
                              className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
                            >
                              <GripVertical className="w-4 h-4" />
                            </div>
                            <Label
                              htmlFor={`column-${column.id}`}
                              className="text-sm font-medium cursor-pointer"
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

          <div className="text-sm text-muted-foreground bg-muted/50 p-2 rounded">
            <strong>Tip:</strong> At least one column must remain visible. Core columns are recommended to stay visible for the best experience.
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleReset}
            className="flex items-center gap-2"
            data-testid="button-reset-columns"
          >
            <RotateCcw className="w-4 h-4" />
            Reset
          </Button>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              data-testid="button-cancel-customize"
            >
              Cancel
            </Button>
            <Button
              onClick={handleApply}
              data-testid="button-apply-customize"
            >
              Apply Changes
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}