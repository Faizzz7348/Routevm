import { useState, useEffect, useMemo, useRef } from "react";
import { useTableData } from "@/hooks/use-table-data";
import { DataTable } from "@/components/data-table";
import { AddImageSection } from "@/components/add-image-section";
import { ImageEditSection } from "@/components/image-edit-section";
import { ColumnCustomizationModal } from "@/components/column-customization-modal";
import { PasswordPrompt } from "@/components/password-prompt";
import { Navigation } from "@/components/navigation";
import { LoadingOverlay } from "@/components/skeleton-loader";
import { RouteOptimizationModal } from "@/components/route-optimization-modal";
import { ScreenshotDialog } from "@/components/screenshot-dialog";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Search, Filter, X, ChevronDown, ChevronUp, Edit3, Plus, Trash2, Pencil, Sun, Moon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "@/components/theme-provider";
import { TableColumn, type Page, type InsertPage } from "@shared/schema";
import { generateTngValues } from "@/utils/tng-generator";
import { calculateDistance } from "@/utils/distance";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { getUserId } from "@/lib/utils";

export default function TablePage() {
  const [editMode, setEditMode] = useState(false);
  const [selectedRowForImage, setSelectedRowForImage] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterValue, setFilterValue] = useState<string[]>([]);
  const [tripFilterValue, setTripFilterValue] = useState<string[]>([]);
  const [customizationModalOpen, setCustomizationModalOpen] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState<string[]>([]);
  const [columnOrder, setColumnOrder] = useState<string[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const [pendingAction, setPendingAction] = useState<'edit' | null>(null);
  const [showPositionDialog, setShowPositionDialog] = useState(false);
  const [positionType, setPositionType] = useState<'end' | 'specific'>('end');
  const [specificPosition, setSpecificPosition] = useState<number>(1);
  const [showExitConfirmation, setShowExitConfirmation] = useState(false);
  const [exitingEditMode, setExitingEditMode] = useState(false);
  const [pageDescription, setPageDescription] = useState("- Interactive table with Drag & Drop , Calculations , and Image Gallery\n\n- This Routes for Driver Vending Mechine , FamilyMart only");
  const [pageTitle, setPageTitle] = useState("Content");
  const [isHeaderExpanded, setIsHeaderExpanded] = useState(true);
  const [optimizationModalOpen, setOptimizationModalOpen] = useState(false);
  const [showSaveConfirmation, setShowSaveConfirmation] = useState(false);
  const [showSaveLayoutConfirmation, setShowSaveLayoutConfirmation] = useState(false);
  const [screenshotDialogOpen, setScreenshotDialogOpen] = useState(false);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [showPageDialog, setShowPageDialog] = useState(false);
  const [editingPage, setEditingPage] = useState<Page | null>(null);
  const [newPageTitle, setNewPageTitle] = useState("");
  const [newPageDescription, setNewPageDescription] = useState("");
  const tableRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { theme, toggleTheme } = useTheme();
  
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

  // Fetch pages
  const { data: pages = [], isLoading: pagesLoading } = useQuery<Page[]>({
    queryKey: ['/api/pages'],
  });

  // Create initial page if none exist (migration)
  useEffect(() => {
    const createInitialPage = async () => {
      if (!pagesLoading && pages.length === 0) {
        await createPageMutation.mutateAsync({
          title: pageTitle,
          description: pageDescription,
          sortOrder: 0,
        });
      }
    };

    createInitialPage();
  }, [pages.length, pagesLoading]);

  // Create page mutation
  const createPageMutation = useMutation({
    mutationFn: async (page: InsertPage) => {
      const res = await apiRequest('POST', '/api/pages', page);
      return await res.json() as Page;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/pages'] });
      toast({
        title: "Success",
        description: "Page created successfully!",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create page",
        variant: "destructive",
      });
    },
  });

  // Update page mutation
  const updatePageMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<InsertPage> }) => {
      const res = await apiRequest('PATCH', `/api/pages/${id}`, updates);
      return await res.json() as Page;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/pages'] });
      toast({
        title: "Success",
        description: "Page updated successfully!",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update page",
        variant: "destructive",
      });
    },
  });

  // Delete page mutation
  const deletePageMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest('DELETE', `/api/pages/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/pages'] });
      toast({
        title: "Success",
        description: "Page deleted successfully!",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete page",
        variant: "destructive",
      });
    },
  });

  // Load column preferences from database (fallback to localStorage)
  useEffect(() => {
    const loadLayoutPreferences = async () => {
      if (columns.length === 0) return;

      try {
        // Try to load from database first
        const userId = getUserId();
        const res = await fetch(`/api/layout?userId=${encodeURIComponent(userId)}`);
        if (res.ok) {
          const layout = await res.json();
          const validVisibleColumnIds = Object.keys(layout.columnVisibility).filter(id => 
            layout.columnVisibility[id] && columns.some(col => col.id === id)
          );
          const validColumnOrder = layout.columnOrder.filter((id: string) => 
            columns.some(col => col.id === id)
          );
          
          // Always ensure Kilometer column is visible
          const kilometerColumn = columns.find(col => col.dataKey === 'kilometer');
          if (kilometerColumn && !validVisibleColumnIds.includes(kilometerColumn.id)) {
            validVisibleColumnIds.push(kilometerColumn.id);
          }
          
          if (validVisibleColumnIds.length > 0) {
            setVisibleColumns(validVisibleColumnIds);
          }
          if (validColumnOrder.length > 0) {
            setColumnOrder(validColumnOrder);
          }
          return; // Successfully loaded from database
        }
      } catch (error) {
        // Fall through to localStorage/defaults
      }

      // Fallback to localStorage if database load fails
      const savedPreferences = localStorage.getItem('tableColumnPreferences');
      if (savedPreferences) {
        try {
          const { visibleColumns: saved, columnOrder: savedOrder } = JSON.parse(savedPreferences);
          const validVisibleColumns = saved.filter((id: string) => columns.some(col => col.id === id));
          const validColumnOrder = savedOrder.filter((id: string) => columns.some(col => col.id === id));
          
          // Always ensure Kilometer column is visible
          const kilometerColumn = columns.find(col => col.dataKey === 'kilometer');
          if (kilometerColumn && !validVisibleColumns.includes(kilometerColumn.id)) {
            validVisibleColumns.push(kilometerColumn.id);
          }
          
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
          return;
        } catch (error) {
          // Fall through to defaults
        }
      }

      // Use defaults if nothing saved
      const defaultVisibleColumnNames = ['Route', 'Code', 'Location', 'Trip', 'Info', 'Kilometer', 'No'];
      const defaultVisibleColumns = columns
        .filter(col => defaultVisibleColumnNames.includes(col.name))
        .map(col => col.id);
      
      const latLngColumns = columns.filter(col => 
        col.dataKey === 'latitude' || col.dataKey === 'longitude'
      ).map(col => col.id);
      
      setVisibleColumns(defaultVisibleColumns.length > 0 ? defaultVisibleColumns : columns.map(col => col.id).filter(id => !latLngColumns.includes(id)));
      setColumnOrder(columns.map(col => col.id));
    };

    loadLayoutPreferences();
  }, [columns]);

  // Save column preferences to localStorage
  const saveColumnPreferences = (visible: string[], order: string[]) => {
    const preferences = {
      visibleColumns: visible,
      columnOrder: order,
    };
    localStorage.setItem('tableColumnPreferences', JSON.stringify(preferences));
  };

  // Page management functions
  const handleAddPage = () => {
    setEditingPage(null);
    setNewPageTitle("");
    setNewPageDescription("");
    setShowPageDialog(true);
  };

  const handleEditPage = (page: Page) => {
    setEditingPage(page);
    setNewPageTitle(page.title || "");
    setNewPageDescription(page.description || "");
    setShowPageDialog(true);
  };

  const handleSavePage = async () => {
    if (!newPageTitle.trim()) {
      toast({
        title: "Error",
        description: "Page title is required",
        variant: "destructive",
      });
      return;
    }

    try {
      if (editingPage) {
        await updatePageMutation.mutateAsync({
          id: editingPage.id,
          updates: {
            title: newPageTitle.trim(),
            description: newPageDescription.trim(),
          },
        });
      } else {
        await createPageMutation.mutateAsync({
          title: newPageTitle.trim(),
          description: newPageDescription.trim(),
          sortOrder: pages.length,
        });
      }

      setShowPageDialog(false);
      setEditingPage(null);
      setNewPageTitle("");
      setNewPageDescription("");
    } catch (error) {
      console.error("Error saving page:", error);
    }
  };

  const handleDeletePage = async (page: Page) => {
    if (pages.length <= 1) {
      toast({
        title: "Error",
        description: "Cannot delete the last page",
        variant: "destructive",
      });
      return;
    }

    const pageIndex = pages.findIndex(p => p.id === page.id);
    
    try {
      await deletePageMutation.mutateAsync(page.id);
      
      if (pageIndex !== -1 && currentPageIndex >= pageIndex && currentPageIndex > 0) {
        setCurrentPageIndex(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error("Error deleting page:", error);
    }
  };

  // Sort pages by sortOrder and ensure currentPageIndex is valid
  const sortedPages = useMemo(() => {
    return [...pages].sort((a, b) => a.sortOrder - b.sortOrder);
  }, [pages]);

  // Clamp currentPageIndex to valid range
  useEffect(() => {
    if (sortedPages.length > 0 && currentPageIndex >= sortedPages.length) {
      setCurrentPageIndex(Math.max(0, sortedPages.length - 1));
    }
  }, [sortedPages.length, currentPageIndex]);

  // Get current page
  const currentPage = sortedPages[currentPageIndex] || null;

  // Get filtered and ordered columns for display (memoized)
  const displayColumns = useMemo(() => {
    if (columnOrder.length === 0 || visibleColumns.length === 0) return columns;
    
    let filteredColumns = columnOrder
      .map(id => columns.find(col => col.id === id))
      .filter((col): col is TableColumn => col !== undefined)
      .filter(col => visibleColumns.includes(col.id));

    // Hide latitude and longitude columns unless in edit mode
    if (!editMode) {
      filteredColumns = filteredColumns.filter(col => 
        col.dataKey !== 'latitude' && col.dataKey !== 'longitude'
      );
    }

    return filteredColumns;
  }, [columns, columnOrder, visibleColumns, editMode]);

  // Get unique route options for filter
  const routeOptions = Array.from(new Set(rows.map(row => row.route).filter(Boolean))).sort();
  
  // Get unique trip options for filter
  const tripOptions = Array.from(new Set(rows.map(row => row.trip).filter(Boolean))).sort();
  
  // Helper functions for multi-select filters
  const toggleRouteFilter = (route: string) => {
    setFilterValue(prev => 
      prev.includes(route) 
        ? prev.filter(r => r !== route)
        : [...prev, route]
    );
  };

  const toggleTripFilter = (trip: string) => {
    setTripFilterValue(prev => 
      prev.includes(trip) 
        ? prev.filter(t => t !== trip)
        : [...prev, trip]
    );
  };

  // Filter rows based on search term and dropdown selection
  const filteredRows = (() => {
    const isFilterActive = filterValue.length > 0;
    
    // Get warehouse row (QL kitchen) 
    const warehouseRow = rows.find(row => row.location === "QL kitchen");
    
    // Apply normal filtering
    const normalFilteredRows = rows.filter((row) => {
      const matchesSearch = searchTerm === "" || 
        Object.values(row).some(value => 
          String(value).toLowerCase().includes(searchTerm.toLowerCase())
        );
      
      // Route filter: Show only selected routes (if any selected)
      const matchesFilter = filterValue.length === 0 || 
        filterValue.includes(row.route);
      
      // Trip filter: HIDE selected trip types (if any selected)
      const matchesTripFilter = tripFilterValue.length === 0 || 
        !tripFilterValue.includes(row.trip);
      
      return matchesSearch && matchesFilter && matchesTripFilter;
    });
    
    // If filter is active and warehouse row exists, ensure it's at position 1
    if (isFilterActive && warehouseRow) {
      // Remove warehouse row from normal filtered results if it exists
      const nonWarehouseRows = normalFilteredRows.filter(row => row.location !== "QL kitchen");
      
      // Check if warehouse row matches search criteria
      const warehouseMatchesSearch = searchTerm === "" || 
        Object.values(warehouseRow).some(value => 
          String(value).toLowerCase().includes(searchTerm.toLowerCase())
        );
      
      // Add warehouse row at the beginning if it matches search
      if (warehouseMatchesSearch) {
        return [warehouseRow, ...nonWarehouseRows];
      } else {
        return nonWarehouseRows;
      }
    }
    
    return normalFilteredRows;
  })();

  // Calculate distances based on filter state
  const rowsWithDistances = useMemo(() => {
    // Always find QL Kitchen coordinates from the full rows collection (not filteredRows)
    // This ensures QL Kitchen coordinates are available even when filtered out by search
    const qlKitchenRow = rows.find(row => row.location === "QL kitchen");
    
    if (!qlKitchenRow) {
      // If no QL Kitchen found, return rows with no distances calculated
      return filteredRows.map(row => ({ ...row, kilometer: "—", segmentDistance: 0 }));
    }

    // Check if QL Kitchen coordinates are missing before parsing
    if (!qlKitchenRow.latitude || !qlKitchenRow.longitude) {
      return filteredRows.map(row => ({ ...row, kilometer: "—", segmentDistance: 0 }));
    }

    const qlLat = parseFloat(qlKitchenRow.latitude);
    const qlLng = parseFloat(qlKitchenRow.longitude);

    // Use Number.isFinite to validate numeric coordinates
    if (!Number.isFinite(qlLat) || !Number.isFinite(qlLng)) {
      return filteredRows.map(row => ({ ...row, kilometer: "—", segmentDistance: 0 }));
    }

    // Check if any filters are active
    const hasActiveFilters = searchTerm !== "" || filterValue.length > 0 || tripFilterValue.length > 0;

    if (!hasActiveFilters) {
      // NO FILTERS: Calculate direct distance from QL Kitchen to each route
      return filteredRows.map((row) => {
        // QL Kitchen row always shows 0 distance (it's the starting point)
        if (row.location === "QL kitchen") {
          return { ...row, kilometer: "0.00", segmentDistance: 0 };
        }

        // Check if current row coordinates are missing before parsing
        if (!row.latitude || !row.longitude) {
          return { ...row, kilometer: "—", segmentDistance: 0 };
        }

        const currentLat = parseFloat(row.latitude);
        const currentLng = parseFloat(row.longitude);

        // Use Number.isFinite to validate numeric coordinates
        if (!Number.isFinite(currentLat) || !Number.isFinite(currentLng)) {
          return { ...row, kilometer: "—", segmentDistance: 0 };
        }

        // Calculate direct distance from QL Kitchen to this route location
        const directDistance = calculateDistance(qlLat, qlLng, currentLat, currentLng);

        return { ...row, kilometer: directDistance.toFixed(2), segmentDistance: directDistance };
      });
    } else {
      // FILTERS ACTIVE: Calculate cumulative distance through the route sequence
      let cumulativeDistance = 0;
      let previousLat = qlLat;
      let previousLng = qlLng;

      return filteredRows.map((row, index) => {
        // When encountering QL Kitchen row, reset everything and set kilometer = 0
        if (row.location === "QL kitchen") {
          cumulativeDistance = 0;
          previousLat = qlLat;
          previousLng = qlLng;
          return { ...row, kilometer: "0.00", segmentDistance: 0 };
        }

        // Check if current row coordinates are missing before parsing
        if (!row.latitude || !row.longitude) {
          return { ...row, kilometer: "—", segmentDistance: 0 };
        }

        const currentLat = parseFloat(row.latitude);
        const currentLng = parseFloat(row.longitude);

        // Use Number.isFinite to validate numeric coordinates
        if (!Number.isFinite(currentLat) || !Number.isFinite(currentLng)) {
          return { ...row, kilometer: "—", segmentDistance: 0 };
        }

        // Calculate distance from previous location to current location
        const segmentDistance = calculateDistance(previousLat, previousLng, currentLat, currentLng);
        cumulativeDistance += segmentDistance;

        // Update previous coordinates for next iteration
        previousLat = currentLat;
        previousLng = currentLng;

        return { ...row, kilometer: cumulativeDistance.toFixed(2), segmentDistance };
      });
    }
  }, [filteredRows, searchTerm, filterValue, tripFilterValue]);

  // Clear all filters and reset sort order to default
  const clearAllFilters = async () => {
    setSearchTerm("");
    setFilterValue([]);
    setTripFilterValue([]);
    
    // Reset all "no" values to match sortOrder (default state)
    const resetPromises = rows.map((row) => {
      if (row.location !== "QL kitchen" && row.no !== row.sortOrder) {
        return updateRow.mutateAsync({
          id: row.id,
          updates: { no: row.sortOrder },
        });
      }
      return Promise.resolve();
    });
    
    await Promise.all(resetPromises);
  };

  const handleSaveData = () => {
    setShowSaveConfirmation(true);
  };

  const confirmSaveData = () => {
    setShowSaveConfirmation(false);
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
      const { tngSite, tngRoute } = generateTngValues();
      const newRowData = {
        no: 0,
        route: "New Route",
        location: "New Location",
        delivery: "Pending",
        tngSite,
        tngRoute,
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

  const handleApplyColumnCustomization = async (newVisibleColumns: string[], newColumnOrder: string[]) => {
    console.log('Applying column customization:', { 
      newVisibleColumns, 
      newColumnOrder,
      currentVisible: visibleColumns,
      currentOrder: columnOrder 
    });
    setVisibleColumns(newVisibleColumns);
    setColumnOrder(newColumnOrder);
    saveColumnPreferences(newVisibleColumns, newColumnOrder);
    
    // Also save to database
    try {
      const validColumnOrder = newColumnOrder.filter(id => columns.some(col => col.id === id));
      const columnVisibilityMap = columns.reduce((acc, col) => {
        acc[col.id] = newVisibleColumns.includes(col.id);
        return acc;
      }, {} as Record<string, boolean>);

      const userId = getUserId();
      await fetch('/api/layout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          columnOrder: validColumnOrder,
          columnVisibility: columnVisibilityMap,
        }),
      });
    } catch (error) {
      console.error('Failed to save layout to database:', error);
    }
    
    toast({
      title: "Columns Updated",
      description: "Your column preferences have been saved.",
    });
  };

  const handleEditModeRequest = () => {
    if (editMode) {
      // Show confirmation before exiting edit mode
      setShowExitConfirmation(true);
    } else {
      // Require password to enter edit mode
      if (!isAuthenticated) {
        setPendingAction('edit');
        setShowPasswordPrompt(true);
      } else {
        setEditMode(true);
        toast({
          title: "Edit Mode Enabled",
          description: "You can now edit and modify table data.",
        });
      }
    }
  };

  const handleConfirmExit = async () => {
    // Start loading state
    setExitingEditMode(true);
    
    // Immediately close all edit-related modals and clear states
    setShowExitConfirmation(false);
    setCustomizationModalOpen(false);
    setShowPositionDialog(false);
    setSelectedRowForImage(null);
    setPendingAction(null);
    
    // Small delay for loading effect
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Exit edit mode and clear authentication
    setEditMode(false);
    setIsAuthenticated(false); // Auto-clear password
    setExitingEditMode(false);
    
    toast({
      title: "Edit Mode Disabled",
      description: "Edit mode has been turned off and password cleared.",
    });
  };

  const handleCancelExit = () => {
    setShowExitConfirmation(false);
  };

  // Auto-clear authentication when edit mode is disabled (safeguard)
  useEffect(() => {
    if (!editMode && isAuthenticated) {
      setIsAuthenticated(false);
    }
  }, [editMode, isAuthenticated]);

  const handlePasswordSuccess = () => {
    setIsAuthenticated(true);
    if (pendingAction === 'edit') {
      setEditMode(true);
      toast({
        title: "Edit Mode Enabled",
        description: "You can now edit and modify table data.",
      });
    }
    setPendingAction(null);
  };

  const handleGenerateTngValues = async () => {
    if (!editMode) {
      toast({
        title: "Access Denied",
        description: "Please enable Edit mode to generate TnG values.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Find rows with empty or placeholder TnG values
      const rowsToUpdate = filteredRows.filter(row => 
        !row.tngSite || 
        row.tngSite === "" || 
        row.tngSite === "Site" ||
        !row.tngRoute || 
        row.tngRoute === "" || 
        row.tngRoute === "Route"
      );

      if (rowsToUpdate.length === 0) {
        toast({
          title: "No Rows to Update",
          description: "All rows already have TnG values assigned.",
        });
        return;
      }

      // Update each row with generated TnG values
      for (const row of rowsToUpdate) {
        const { tngSite, tngRoute } = generateTngValues();
        await updateRow.mutateAsync({
          id: row.id,
          updates: { tngSite, tngRoute }
        });
      }

      toast({
        title: "TnG Values Generated",
        description: `Generated TnG values for ${rowsToUpdate.length} row${rowsToUpdate.length !== 1 ? 's' : ''}.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate TnG values.",
        variant: "destructive",
      });
    }
  };

  const handleCalculateTolls = async () => {
    if (!editMode) {
      toast({
        title: "Access Denied",
        description: "Please enable Edit mode to calculate tolls.",
        variant: "destructive",
      });
      return;
    }

    try {
      toast({
        title: "Calculating Tolls",
        description: "Computing toll prices using Google Maps…",
      });

      const res = await fetch("/api/calculate-tolls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) throw new Error();

      toast({
        title: "Tolls Calculated",
        description: "Toll prices have been updated.",
      });

      window.location.reload();
    } catch {
      toast({
        title: "Error",
        description: "Failed to calculate tolls.",
        variant: "destructive",
      });
    }
  };

  const handleSaveLayout = () => {
    setShowSaveLayoutConfirmation(true);
  };

  const confirmSaveLayout = async () => {
    setShowSaveLayoutConfirmation(false);
    try {
      // Sanitize column order to only include valid column IDs
      const validColumnOrder = columnOrder.filter(id => columns.some(col => col.id === id));
      
      // Build columnVisibility mapping for all columns
      const columnVisibilityMap = columns.reduce((acc, col) => {
        acc[col.id] = visibleColumns.includes(col.id);
        return acc;
      }, {} as Record<string, boolean>);

      const userId = getUserId();
      const res = await fetch('/api/layout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          columnOrder: validColumnOrder,
          columnVisibility: columnVisibilityMap,
        }),
      });

      if (!res.ok) throw new Error();

      // Also save to localStorage as backup
      saveColumnPreferences(visibleColumns, validColumnOrder);

      toast({
        title: "Layout Saved",
        description: "Your column layout has been saved successfully.",
      });
    } catch {
      toast({
        title: "Error",
        description: "Failed to save layout.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen relative">
        <LoadingOverlay message="Loading table data..." type="wave" />
      </div>
    );
  }

  return (
    <>
      <Navigation 
        editMode={editMode}
        onEditModeRequest={handleEditModeRequest}
        onShowCustomization={() => setCustomizationModalOpen(true)}
        onAddRow={handleAddRow}
        onSaveData={handleSaveData}
        onGenerateTng={handleGenerateTngValues}
        onOptimizeRoute={() => setOptimizationModalOpen(true)}
        onCalculateTolls={handleCalculateTolls}
        onSaveLayout={handleSaveLayout}
        onAddColumn={async (columnData) => {
          try {
            const newColumn = await createColumn.mutateAsync(columnData);
            
            // Ensure the new column is immediately visible
            const newVisibleColumns = [...visibleColumns, newColumn.id];
            const newColumnOrder = [...columnOrder, newColumn.id];
            
            setVisibleColumns(newVisibleColumns);
            setColumnOrder(newColumnOrder);
            saveColumnPreferences(newVisibleColumns, newColumnOrder);
            
            toast({
              title: "Success",
              description: `Column "${columnData.name}" created successfully!`,
            });
          } catch (error) {
            console.error("Failed to create column:", error);
            throw error;
          }
        }}
        isAuthenticated={isAuthenticated}
      />
      <main className="pt-4">
        <div className="container mx-auto px-4 py-8 max-w-7xl" data-testid="table-page">
          {/* Header Section - Carousel with Pages */}
          <div className="mb-8 relative">
            {sortedPages.length > 0 ? (
              <Carousel className="w-full pb-16" opts={{ loop: sortedPages.length > 1 }}>
                <div className="overflow-hidden rounded-xl border border-blue-200 dark:border-blue-500/30 bg-gradient-to-r from-blue-50/80 to-white/80 dark:from-blue-950/40 dark:to-gray-900/40 backdrop-blur-sm shadow-lg transition-all duration-500">
                  <CarouselContent>
                  {sortedPages.map((page, index) => (
                    <CarouselItem key={page.id}>
                      {/* Header Bar */}
                      <div 
                        className="flex items-center justify-between px-6 py-4 cursor-pointer hover:bg-blue-100/50 dark:hover:bg-blue-900/30 transition-colors duration-300 text-sm"
                        onClick={() => setIsHeaderExpanded(!isHeaderExpanded)}
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <h1 className="font-bold text-gray-500 dark:text-blue-300" style={{fontSize: '12px'}} data-testid={`page-title-${page.id}`}>
                            {page.title || "Untitled"}
                          </h1>
                          {editMode && (
                            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleEditPage(page)}
                                className="h-6 w-6 p-0"
                                data-testid={`button-edit-page-${page.id}`}
                              >
                                <Pencil className="h-3 w-3 text-blue-500 dark:text-blue-400" />
                              </Button>
                              {sortedPages.length > 1 && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleDeletePage(page)}
                                  disabled={deletePageMutation.isPending}
                                  className="h-6 w-6 p-0"
                                  data-testid={`button-delete-page-${page.id}`}
                                >
                                  <Trash2 className="h-3 w-3 text-red-500 dark:text-red-400" />
                                </Button>
                              )}
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleTheme();
                            }}
                            className="p-2 rounded-full hover:bg-blue-200/50 dark:hover:bg-blue-800/50 transition-all duration-300 group"
                            data-testid="button-toggle-theme"
                            aria-label="Toggle dark mode"
                          >
                            {theme === 'dark' ? (
                              <Sun className="h-4 w-4 text-yellow-500 dark:text-yellow-400 group-hover:scale-110 transition-transform duration-300" />
                            ) : (
                              <Moon className="h-4 w-4 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform duration-300" />
                            )}
                          </button>
                          
                          <button 
                            className="p-2 rounded-full hover:bg-blue-200/50 dark:hover:bg-blue-800/50 transition-all duration-300 group"
                            data-testid="button-toggle-header"
                          >
                            {isHeaderExpanded ? (
                              <ChevronUp className="h-4 w-4 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform duration-300" />
                            ) : (
                              <ChevronDown className="h-4 w-4 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform duration-300" />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Sliding Content */}
                      <div 
                        className={`overflow-hidden transition-all duration-500 ease-in-out ${
                          isHeaderExpanded ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
                        }`}
                      >
                        <div className="px-6 pb-4 border-t border-blue-200/50 dark:border-blue-500/20 pt-4 bg-gradient-to-b from-blue-50/30 to-transparent dark:from-blue-950/20 dark:to-transparent">
                          <div className="prose prose-sm max-w-none">
                            <p className="text-gray-700 dark:text-gray-300 leading-relaxed" style={{fontSize: '10px'}} data-testid={`page-description-${page.id}`}>
                              {(page.description || "").split('\n').map((line, lineIndex) => (
                                <span key={lineIndex} className="block mb-1">
                                  {line}
                                </span>
                              ))}
                            </p>
                          </div>
                        </div>
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                  
                  {/* Add Page Button (in edit mode) */}
                  {editMode && (
                    <div className="px-6 pb-4 border-t border-blue-200/50 dark:border-blue-500/20">
                      <Button
                        onClick={handleAddPage}
                        className="w-full mt-4 bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700"
                        data-testid="button-add-page"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Page
                      </Button>
                    </div>
                  )}
                </div>
                
                {/* Carousel Navigation Arrows - Below Container */}
                {sortedPages.length > 1 && editMode && (
                  <div className="flex justify-center gap-4 mt-4">
                    <CarouselPrevious className="relative left-0 top-0 translate-x-0 translate-y-0" data-testid="button-prev-page" />
                    <CarouselNext className="relative right-0 top-0 translate-x-0 translate-y-0" data-testid="button-next-page" />
                  </div>
                )}
              </Carousel>
            ) : (
              <div className="overflow-hidden rounded-xl border border-blue-200 dark:border-blue-500/30 bg-gradient-to-r from-blue-50/80 to-white/80 dark:from-blue-950/40 dark:to-gray-900/40 backdrop-blur-sm shadow-lg transition-all duration-500 px-6 py-4 text-center text-gray-500">
                <p>No pages available</p>
              </div>
            )}
          </div>

          {/* Page Add/Edit Dialog */}
          <Dialog open={showPageDialog} onOpenChange={setShowPageDialog}>
            <DialogContent data-testid="dialog-page-form">
              <DialogHeader>
                <DialogTitle>{editingPage ? "Edit Page" : "Add Page"}</DialogTitle>
                <DialogDescription>
                  {editingPage ? "Update the page details below." : "Create a new page with a title and description."}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="page-title">Title</Label>
                  <Input
                    id="page-title"
                    value={newPageTitle}
                    onChange={(e) => setNewPageTitle(e.target.value)}
                    placeholder="Enter page title..."
                    data-testid="input-page-title"
                  />
                </div>
                <div>
                  <Label htmlFor="page-description">Description</Label>
                  <Textarea
                    id="page-description"
                    value={newPageDescription}
                    onChange={(e) => setNewPageDescription(e.target.value)}
                    placeholder="Enter page description..."
                    className="min-h-[100px]"
                    data-testid="input-page-description"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button 
                  variant="outline" 
                  onClick={() => setShowPageDialog(false)}
                  disabled={createPageMutation.isPending || updatePageMutation.isPending}
                  data-testid="button-cancel-page"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleSavePage}
                  disabled={createPageMutation.isPending || updatePageMutation.isPending || !newPageTitle.trim()}
                  data-testid="button-save-page"
                >
                  {createPageMutation.isPending || updatePageMutation.isPending ? "Saving..." : "Save"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>



      {/* Image Management Section */}
      {selectedRowForImage && selectedRowForImage !== 'access-denied' && !exitingEditMode && (
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
      <div ref={tableRef}>
        <DataTable
        rows={rowsWithDistances}
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
        onShowCustomization={() => setCustomizationModalOpen(true)}
        onOptimizeRoute={() => setOptimizationModalOpen(true)}
        onScreenshot={() => setScreenshotDialogOpen(true)}
        isAuthenticated={isAuthenticated}
        isLoading={exitingEditMode}
        isFiltered={searchTerm !== "" || filterValue.length > 0 || tripFilterValue.length > 0}
        // Search and filter props
        searchTerm={searchTerm}
        onSearchTermChange={setSearchTerm}
        filterValue={filterValue}
        onFilterValueChange={setFilterValue}
        tripFilterValue={tripFilterValue}
        onTripFilterValueChange={setTripFilterValue}
        routeOptions={routeOptions}
        tripOptions={tripOptions}
        onClearAllFilters={clearAllFilters}
        filteredRowsCount={filteredRows.length}
        totalRowsCount={rows.length}
      />
      </div>

      {/* Column Customization Modal */}
      <ColumnCustomizationModal
        open={customizationModalOpen && !exitingEditMode}
        onOpenChange={setCustomizationModalOpen}
        columns={columns}
        visibleColumns={visibleColumns}
        onApplyChanges={handleApplyColumnCustomization}
      />

      {/* Exit Loading Overlay */}
      {exitingEditMode && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-background/90 rounded-lg p-6 shadow-xl border">
            <div className="flex items-center gap-3">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent"></div>
              <span className="text-sm font-medium">Exiting Edit Mode...</span>
            </div>
          </div>
        </div>
      )}


      {/* Password Prompt */}
      <PasswordPrompt
        open={showPasswordPrompt && !exitingEditMode}
        onOpenChange={(open) => {
          setShowPasswordPrompt(open);
          if (!open) {
            // Clear pending action if prompt is closed without success
            setPendingAction(null);
          }
        }}
        onSuccess={handlePasswordSuccess}
        title="Authentication Required"
        description="Please enter the password to access edit mode."
      />

      {/* Exit Confirmation Dialog */}
      <Dialog open={showExitConfirmation && !exitingEditMode} onOpenChange={setShowExitConfirmation}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle style={{fontSize: '12px'}}>Exit Edit Mode</DialogTitle>
            <DialogDescription style={{fontSize: '10px'}}>
              Are you sure you want to exit edit mode? Your authentication will be cleared and you'll need to enter the password again to re-enable edit mode.
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter className="space-x-2">
            <Button 
              variant="outline" 
              onClick={handleCancelExit}
              style={{fontSize: '10px'}}
              data-testid="button-cancel-exit"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleConfirmExit}
              style={{fontSize: '10px'}}
              data-testid="button-confirm-exit"
            >
              Exit Edit Mode
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Save Confirmation Dialog */}
      <Dialog open={showSaveConfirmation} onOpenChange={setShowSaveConfirmation}>
        <DialogContent className="sm:max-w-md animate-in zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:zoom-out-95 duration-300 bg-gradient-to-br from-blue-50 to-white dark:from-blue-950/40 dark:to-gray-900 border-blue-200 dark:border-blue-500/30 shadow-2xl">
          <DialogHeader className="space-y-3">
            <div className="mx-auto w-12 h-12 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center animate-in zoom-in-50 duration-500 delay-100">
              <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <DialogTitle className="text-center text-blue-900 dark:text-blue-100" style={{fontSize: '14px'}}>Confirm Save Changes</DialogTitle>
            <DialogDescription className="text-center text-gray-600 dark:text-gray-400" style={{fontSize: '11px'}}>
              Are you sure you want to save all changes made to the table data?
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter className="flex-row justify-center gap-3 sm:justify-center mt-4">
            <Button 
              variant="outline" 
              onClick={() => setShowSaveConfirmation(false)}
              className="min-w-[100px] border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800"
              style={{fontSize: '11px'}}
              data-testid="button-cancel-save"
            >
              Cancel
            </Button>
            <Button 
              onClick={confirmSaveData}
              className="min-w-[100px] bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white shadow-lg"
              style={{fontSize: '11px'}}
              data-testid="button-confirm-save"
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Save Layout Confirmation Dialog */}
      <Dialog open={showSaveLayoutConfirmation} onOpenChange={setShowSaveLayoutConfirmation}>
        <DialogContent className="sm:max-w-md animate-in zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:zoom-out-95 duration-300 bg-gradient-to-br from-indigo-50 to-white dark:from-indigo-950/40 dark:to-gray-900 border-indigo-200 dark:border-indigo-500/30 shadow-2xl">
          <DialogHeader className="space-y-3">
            <div className="mx-auto w-12 h-12 bg-indigo-100 dark:bg-indigo-900/50 rounded-full flex items-center justify-center animate-in zoom-in-50 duration-500 delay-100">
              <svg className="w-6 h-6 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v7H4V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v7h-6V5zM4 16a1 1 0 011-1h4a1 1 0 011 1v3H4v-3zM14 16a1 1 0 011-1h4a1 1 0 011 1v3h-6v-3z" />
              </svg>
            </div>
            <DialogTitle className="text-center text-indigo-900 dark:text-indigo-100" style={{fontSize: '14px'}}>Confirm Save Layout</DialogTitle>
            <DialogDescription className="text-center text-gray-600 dark:text-gray-400" style={{fontSize: '11px'}}>
              Are you sure you want to save the current column layout and visibility settings?
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter className="flex-row justify-center gap-3 sm:justify-center mt-4">
            <Button 
              variant="outline" 
              onClick={() => setShowSaveLayoutConfirmation(false)}
              className="min-w-[100px] border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800"
              style={{fontSize: '11px'}}
              data-testid="button-cancel-save-layout"
            >
              Cancel
            </Button>
            <Button 
              onClick={confirmSaveLayout}
              className="min-w-[100px] bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white shadow-lg"
              style={{fontSize: '11px'}}
              data-testid="button-confirm-save-layout"
            >
              Save Layout
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Position Dialog */}
      <Dialog open={showPositionDialog && !exitingEditMode} onOpenChange={setShowPositionDialog}>
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

      {/* Route Optimization Modal */}
      <RouteOptimizationModal
        open={optimizationModalOpen}
        onOpenChange={setOptimizationModalOpen}
        rows={rows}
      />

      {/* Screenshot Dialog */}
      <ScreenshotDialog
        open={screenshotDialogOpen}
        onOpenChange={setScreenshotDialogOpen}
        targetRef={tableRef}
      />

        </div>
      </main>
      
      {/* Footer */}
      <Footer editMode={editMode} />
    </>
  );
}
