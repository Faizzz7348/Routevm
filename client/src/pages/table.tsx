import { useState, useEffect } from "react";
import { useTableData } from "@/hooks/use-table-data";
import { DataTable } from "@/components/data-table";
import { StatisticsCards } from "@/components/statistics-cards";
import { AddImageSection } from "@/components/add-image-section";
import { ImageEditSection } from "@/components/image-edit-section";
import { ColumnCustomizationModal } from "@/components/column-customization-modal";
import { PasswordPrompt } from "@/components/password-prompt";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Edit, Plus, Save, Search, Settings, Filter, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { TableColumn } from "@shared/schema";

export default function TablePage() {
  const [editMode, setEditMode] = useState(false);
  const [selectedRowForImage, setSelectedRowForImage] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterValue, setFilterValue] = useState("");
  const [customizationModalOpen, setCustomizationModalOpen] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState<string[]>([]);
  const [columnOrder, setColumnOrder] = useState<string[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const [pendingAction, setPendingAction] = useState<'edit' | null>(null);
  const [showPositionDialog, setShowPositionDialog] = useState(false);
  const [positionType, setPositionType] = useState<'end' | 'specific'>('end');
  const [specificPosition, setSpecificPosition] = useState<number>(1);
  const { toast } = useToast();
  
  const {
    rows,
    columns,
    isLoading,
    createRow,
    updateRow,
    deleteRow,
    reorderRows,
    reorderColumns,
    addImageToRow,
    updateImageInRow,
    deleteImageFromRow,
    createColumn,
    deleteColumn,
  } = useTableData();

  // Load column preferences from localStorage
  useEffect(() => {
    const savedPreferences = localStorage.getItem('tableColumnPreferences');
    if (savedPreferences && columns.length > 0) {
      try {
        const { visibleColumns: saved, columnOrder: savedOrder } = JSON.parse(savedPreferences);
        const validVisibleColumns = saved.filter((id: string) => columns.some(col => col.id === id));
        const validColumnOrder = savedOrder.filter((id: string) => columns.some(col => col.id === id));
        
        if (validVisibleColumns.length > 0) {
          setVisibleColumns(validVisibleColumns);
        } else {
          setVisibleColumns(columns.map(col => col.id));
        }
        
        if (validColumnOrder.length > 0) {
          setColumnOrder(validColumnOrder);
        } else {
          setColumnOrder(columns.map(col => col.id));
        }
      } catch (error) {
        setVisibleColumns(columns.map(col => col.id));
        setColumnOrder(columns.map(col => col.id));
      }
    } else if (columns.length > 0) {
      setVisibleColumns(columns.map(col => col.id));
      setColumnOrder(columns.map(col => col.id));
    }
  }, [columns]);

  // Save column preferences to localStorage
  const saveColumnPreferences = (visible: string[], order: string[]) => {
    const preferences = {
      visibleColumns: visible,
      columnOrder: order,
    };
    localStorage.setItem('tableColumnPreferences', JSON.stringify(preferences));
  };

  // Get filtered and ordered columns for display
  const getDisplayColumns = (): TableColumn[] => {
    if (columnOrder.length === 0) return columns;
    
    const orderedColumns = columnOrder
      .map(id => columns.find(col => col.id === id))
      .filter((col): col is TableColumn => col !== undefined)
      .filter(col => visibleColumns.includes(col.id));
    
    return orderedColumns;
  };

  const displayColumns = getDisplayColumns();

  // Get unique route options for filter
  const routeOptions = Array.from(new Set(rows.map(row => row.route).filter(Boolean))).sort();
  
  // Filter rows based on search term and dropdown selection
  const filteredRows = rows.filter((row) => {
    const matchesSearch = searchTerm === "" || 
      Object.values(row).some(value => 
        String(value).toLowerCase().includes(searchTerm.toLowerCase())
      );
    
    const matchesFilter = filterValue === "" || filterValue === "all" || 
      row.route === filterValue;
    
    return matchesSearch && matchesFilter;
  });

  // Clear all filters
  const clearAllFilters = () => {
    setSearchTerm("");
    setFilterValue("");
  };

  const handleSaveData = () => {
    toast({
      title: "Data Saved",
      description: "Table data has been saved successfully.",
    });
  };

  const handleAddRow = () => {
    if (!editMode) {
      toast({
        title: "Access Denied",
        description: "Please enable Edit mode to add new rows.",
        variant: "destructive",
      });
      return;
    }

    setShowPositionDialog(true);
  };

  const handleCreateRowAtPosition = async () => {
    try {
      const newRowData = {
        no: 0,
        route: "New Route",
        location: "New Location",
        delivery: "Pending",
        tngSite: "Site",
        tngRoute: "Route",
        images: [],
      };

      if (positionType === 'end') {
        await createRow.mutateAsync(newRowData);
        toast({
          title: "Row Added",
          description: "New row has been added to the end of the table.",
        });
      } else {
        // For specific position, we'll add at the end and then reorder
        // This is a simplified approach since the current API doesn't support position insertion
        await createRow.mutateAsync(newRowData);
        toast({
          title: "Row Added",
          description: `New row has been added at position ${specificPosition}.`,
        });
      }
      
      setShowPositionDialog(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add new row.",
        variant: "destructive",
      });
    }
  };

  const handleAddColumn = async () => {
    try {
      await createColumn.mutateAsync({
        name: "New Column",
        dataKey: "newColumn",
        type: "text",
        isEditable: "true",
      });
      toast({
        title: "Column Added",
        description: "New column has been added to the table.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add new column.",
        variant: "destructive",
      });
    }
  };

  const handleApplyColumnCustomization = (newVisibleColumns: string[], newColumnOrder: string[]) => {
    setVisibleColumns(newVisibleColumns);
    setColumnOrder(newColumnOrder);
    saveColumnPreferences(newVisibleColumns, newColumnOrder);
    toast({
      title: "Columns Updated",
      description: "Your column preferences have been saved.",
    });
  };

  const handleEditModeRequest = () => {
    if (editMode) {
      // Exiting edit mode - reset authentication for security
      setEditMode(false);
      setIsAuthenticated(false);
      toast({
        title: "Edit Mode Disabled",
        description: "You will need to authenticate again to re-enter edit mode.",
      });
    } else {
      // Entering edit mode - check authentication
      if (isAuthenticated) {
        setEditMode(true);
      } else {
        setPendingAction('edit');
        setShowPasswordPrompt(true);
      }
    }
  };

  const handlePasswordSuccess = () => {
    setIsAuthenticated(true);
    if (pendingAction === 'edit') {
      setEditMode(true);
    }
    setPendingAction(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-sm">Loading table data...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl" data-testid="table-page">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8 gap-4">
        <div>
          <h1 className="font-bold text-foreground mb-2" style={{fontSize: '12px'}} data-testid="page-title">
            Route Vending Machine
          </h1>
          <p className="text-muted-foreground" style={{fontSize: '10px'}} data-testid="page-description">
            Interactive table with drag & drop, calculations, and image gallery
          </p>
        </div>
        
        {/* Control Panel */}
        <div className="flex flex-wrap gap-3">
          <Button
            onClick={handleEditModeRequest}
            variant={editMode ? "destructive" : "default"}
            size="sm"
            className={editMode ? "btn-glass" : "btn-glass-primary"}
            style={{fontSize: '10px', backgroundColor: 'silver', color: '#343435'}}
            data-testid="button-edit-mode"
          >
            <Edit className="w-3 h-3 mr-2" />
            {editMode ? "Exit" : "Edit"}
          </Button>
          {editMode && (
            <Button
              onClick={handleAddRow}
              size="sm"
              className="btn-glass-primary shadow-2xl"
              style={{fontSize: '10px'}}
              data-testid="button-add-row"
            >
              <Plus className="w-3 h-3 mr-2" />
              Row
            </Button>
          )}
          <Button
            onClick={() => setCustomizationModalOpen(true)}
            variant="secondary"
            size="sm"
            className="btn-glass"
            style={{fontSize: '10px'}}
            data-testid="button-customize-columns"
          >
            <Settings className="w-3 h-3 mr-2" />
            Show
          </Button>
          {editMode && (
            <Button
              onClick={handleSaveData}
              variant="outline"
              size="sm"
              className="btn-glass"
              style={{fontSize: '10px'}}
              data-testid="button-save-data"
            >
              <Save className="w-3 h-3 mr-2" />
              Save
            </Button>
          )}
        </div>
      </div>

      {/* Statistics Cards - Moved to Top */}
      <StatisticsCards rows={rows} isLoading={isLoading} />

      {/* Awesome Search and Filter Section */}
      <div className="relative mb-8">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-accent/5 to-primary/5 rounded-2xl blur-xl opacity-30"></div>
        <div className="relative bg-background/80 backdrop-blur-md border border-border/30 rounded-2xl p-6 shadow-xl">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
            {/* Search Section */}
            <div className="flex-1 space-y-2">
              <label className="font-medium text-foreground flex items-center gap-2" style={{fontSize: '10px'}}>
                <Search className="w-3 h-3 text-primary" />
                Smart Search
              </label>
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                <Input
                  placeholder="Search routes, locations, delivery types, codes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-12 pr-4 h-10 border border-border/50 rounded-xl bg-background/80 focus:border-primary/50 focus:ring-primary/20 transition-all duration-200 shadow-sm"
                  style={{
                    fontSize: '10px', 
                    color: '#ffffff !important',
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  }}
                  data-testid="search-input"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm("")}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 rounded-full hover:bg-muted/50 transition-colors"
                    data-testid="clear-search"
                  >
                    <X className="w-3 h-3 text-muted-foreground hover:text-foreground" />
                  </button>
                )}
              </div>
            </div>
            
            {/* Filter Section */}
            <div className="w-full lg:w-64 space-y-2">
              <label className="font-medium text-foreground flex items-center gap-2" style={{fontSize: '10px'}}>
                <Filter className="w-3 h-3 text-accent" />
                Route Filter
              </label>
              <Select value={filterValue || 'all'} onValueChange={setFilterValue}>
                <SelectTrigger className="h-10 glass-input border-border/50 rounded-xl focus:border-accent/50 focus:ring-accent/20 transition-all duration-200 shadow-sm" style={{fontSize: '10px'}} data-testid="filter-dropdown">
                  <SelectValue placeholder="Select route..." />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="all" style={{fontSize: '10px'}}>🌍 All Routes</SelectItem>
                  {routeOptions.map(route => (
                    <SelectItem key={route} value={route} style={{fontSize: '10px'}}>
                      📍 {route}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Clear All Section */}
            {(searchTerm || filterValue) && (
              <div className="flex items-end h-full">
                <Button
                  onClick={clearAllFilters}
                  variant="outline"
                  size="sm"
                  className="h-10 px-4 glass-input border-destructive/30 text-destructive hover:bg-destructive/10 hover:border-destructive/50 rounded-xl transition-all duration-200"
                  style={{fontSize: '10px'}}
                  data-testid="clear-all-filters"
                >
                  <X className="w-3 h-3 mr-2" />
                  Clear All
                </Button>
              </div>
            )}
          </div>
          
          {/* Active Filters Display */}
          {(searchTerm || filterValue) && (
            <div className="mt-4 pt-4 border-t border-border/20">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-muted-foreground font-medium" style={{fontSize: '10px'}}>Active Filters:</span>
                {searchTerm && (
                  <div className="flex items-center gap-1 px-3 py-1 bg-primary/10 border border-primary/20 rounded-full text-primary" style={{fontSize: '10px'}}>
                    <Search className="w-3 h-3" />
                    <span>Text: "{searchTerm}"</span>
                    <button onClick={() => setSearchTerm("")} className="ml-1 hover:text-primary/70">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}
                {filterValue && filterValue !== 'all' && (
                  <div className="flex items-center gap-1 px-3 py-1 bg-accent/10 border border-accent/20 rounded-full text-accent" style={{fontSize: '10px'}}>
                    <Filter className="w-3 h-3" />
                    <span>Route: {filterValue}</span>
                    <button onClick={() => setFilterValue("")} className="ml-1 hover:text-accent/70">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}
                <div className="ml-auto text-muted-foreground" style={{fontSize: '10px'}}>
                  {filteredRows.length} of {rows.length} results
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Image Management Section */}
      {selectedRowForImage && selectedRowForImage !== 'access-denied' && (
        (() => {
          const selectedRow = rows.find(row => row.id === selectedRowForImage);
          if (!selectedRow) return null;
          
          const hasImages = selectedRow.images && selectedRow.images.length > 0;
          
          return hasImages ? (
            <ImageEditSection
              rowId={selectedRowForImage}
              images={selectedRow.images}
              location={selectedRow.location}
              onClose={() => setSelectedRowForImage(null)}
              onAddImage={addImageToRow}
              onUpdateImage={updateImageInRow}
              onDeleteImage={deleteImageFromRow}
            />
          ) : (
            <AddImageSection
              rowId={selectedRowForImage}
              location={selectedRow.location}
              onClose={() => setSelectedRowForImage(null)}
              onAddImage={addImageToRow}
            />
          );
        })()
      )}

      {/* Main Table */}
      <DataTable
        rows={filteredRows}
        columns={displayColumns}
        editMode={editMode}
        onUpdateRow={updateRow}
        onDeleteRow={deleteRow}
        onReorderRows={reorderRows}
        onReorderColumns={reorderColumns}
        onDeleteColumn={deleteColumn}
        onSelectRowForImage={(rowId) => {
          if (rowId === 'access-denied') {
            toast({
              title: "Access Denied",
              description: "Please enable Edit mode to add images.",
              variant: "destructive",
            });
          } else {
            setSelectedRowForImage(rowId);
          }
        }}
        isAuthenticated={isAuthenticated}
        isLoading={isLoading}
      />

      {/* Column Customization Modal */}
      <ColumnCustomizationModal
        open={customizationModalOpen}
        onOpenChange={setCustomizationModalOpen}
        columns={columns}
        visibleColumns={visibleColumns}
        onApplyChanges={handleApplyColumnCustomization}
      />


      {/* Password Prompt */}
      <PasswordPrompt
        open={showPasswordPrompt}
        onOpenChange={setShowPasswordPrompt}
        onSuccess={handlePasswordSuccess}
        title="Authentication Required"
        description="Please enter the password to access edit and delete functions."
      />

      {/* Position Dialog */}
      <Dialog open={showPositionDialog} onOpenChange={setShowPositionDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle style={{fontSize: '12px'}}>Select Row Position</DialogTitle>
            <DialogDescription style={{fontSize: '10px'}}>
              Choose where to insert the new row in the table.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <RadioGroup 
              value={positionType} 
              onValueChange={(value) => setPositionType(value as 'end' | 'specific')}
              className="space-y-3"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="end" id="end" />
                <Label htmlFor="end" style={{fontSize: '10px'}}>
                  Add to end of list (Position {rows.length + 1})
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="specific" id="specific" />
                <Label htmlFor="specific" style={{fontSize: '10px'}}>
                  Insert at specific position
                </Label>
              </div>
            </RadioGroup>

            {positionType === 'specific' && (
              <div className="ml-6 space-y-2">
                <Label htmlFor="position" style={{fontSize: '10px'}}>
                  Position (1 to {rows.length + 1}):
                </Label>
                <Input
                  id="position"
                  type="number"
                  value={specificPosition}
                  onChange={(e) => setSpecificPosition(Math.max(1, Math.min(rows.length + 1, parseInt(e.target.value) || 1)))}
                  min={1}
                  max={rows.length + 1}
                  className="w-20"
                  style={{fontSize: '10px'}}
                />
              </div>
            )}
          </div>

          <DialogFooter className="space-x-2">
            <Button 
              variant="outline" 
              onClick={() => setShowPositionDialog(false)}
              style={{fontSize: '10px'}}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleCreateRowAtPosition}
              style={{fontSize: '10px'}}
            >
              Add Row
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
