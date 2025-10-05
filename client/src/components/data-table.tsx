import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ColumnHeader } from "./column-header";
import { EditableCell } from "./editable-cell";
import { ImagePreview } from "./image-preview";
import { InfoModal } from "./info-modal";
import { EditableInfoModal } from "./editable-info-modal";
import { SlidingDescription } from "./sliding-description";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Edit,
  Trash,
  ChevronLeft,
  ChevronRight,
  GripVertical,
  PlusCircle,
  RefreshCw,
  ChevronsLeft,
  ChevronsRight,
  Eye,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Infinity,
  FileText,
  Search,
  Filter,
  X,
  MapPin,
  Route,
  Camera,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  SkeletonLoader,
  LoadingOverlay,
  InlineLoading,
} from "./skeleton-loader";
import { TableRow as TableRowType, TableColumn } from "@shared/schema";
import { UseMutationResult } from "@tanstack/react-query";
import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";

// Simple mobile-friendly tooltip component
interface MobileTooltipProps {
  content: string;
  children: React.ReactNode;
  showBelow?: boolean;
}

function MobileTooltip({ content, children, showBelow = false }: MobileTooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Detect if device supports touch
    const checkIsMobile = () => {
      setIsMobile('ontouchstart' in window || navigator.maxTouchPoints > 0);
    };
    
    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  const handleClick = () => {
    if (isMobile) {
      setIsVisible(!isVisible);
      // Auto-hide after 3 seconds on mobile
      setTimeout(() => setIsVisible(false), 3000);
    }
  };

  const handleMouseEnter = () => {
    if (!isMobile) {
      setIsVisible(true);
    }
  };

  const handleMouseLeave = () => {
    if (!isMobile) {
      setIsVisible(false);
    }
  };

  return (
    <div className="relative inline-block">
      <div
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={`${isMobile ? 'cursor-pointer' : 'cursor-help'}`}
      >
        {children}
      </div>
      
      {isVisible && (
        <div className={`absolute left-1/2 transform -translate-x-1/2 z-50 ${showBelow ? 'top-full mt-1' : 'bottom-full mb-1'}`}>
          <div className="px-2 py-1 text-xs bg-gray-900 text-white rounded shadow-lg whitespace-nowrap">
            {content}
          </div>
          <div className={`absolute left-1/2 transform -translate-x-1/2 border-4 border-transparent ${showBelow ? 'bottom-full border-b-gray-900' : 'top-full border-t-gray-900'}`} />
        </div>
      )}
    </div>
  );
}

interface DataTableProps {
  rows: TableRowType[];
  columns: TableColumn[];
  editMode: boolean;
  onUpdateRow: UseMutationResult<
    any,
    Error,
    { id: string; updates: Partial<any> },
    unknown
  >;
  onDeleteRow: UseMutationResult<void, Error, string, unknown>;
  onReorderRows: UseMutationResult<TableRowType[], Error, string[], unknown>;
  onReorderColumns: UseMutationResult<TableColumn[], Error, string[], unknown>;
  onDeleteColumn: UseMutationResult<void, Error, string, unknown>;
  onSelectRowForImage: (rowId: string) => void;
  onShowCustomization?: () => void;
  onOptimizeRoute?: () => void;
  onScreenshot?: () => void;
  isAuthenticated?: boolean;
  isLoading?: boolean;
  isFiltered?: boolean;
  // Search and filter props
  searchTerm?: string;
  onSearchTermChange?: (term: string) => void;
  filterValue?: string[];
  onFilterValueChange?: (filters: string[]) => void;
  tripFilterValue?: string[];
  onTripFilterValueChange?: (filters: string[]) => void;
  routeOptions?: string[];
  tripOptions?: string[];
  onClearAllFilters?: () => void;
  filteredRowsCount?: number;
  totalRowsCount?: number;
}

export function DataTable({
  rows,
  columns,
  editMode,
  onUpdateRow,
  onDeleteRow,
  onReorderRows,
  onReorderColumns,
  onDeleteColumn,
  onSelectRowForImage,
  onShowCustomization,
  onOptimizeRoute,
  onScreenshot,
  isAuthenticated = false,
  isLoading = false,
  isFiltered = false,
  // Search and filter props
  searchTerm = '',
  onSearchTermChange,
  filterValue = [],
  onFilterValueChange,
  tripFilterValue = [],
  onTripFilterValueChange,
  routeOptions = [],
  tripOptions = [],
  onClearAllFilters,
  filteredRowsCount = 0,
  totalRowsCount = 0,
}: DataTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(16);
  const [isPageChanging, setIsPageChanging] = useState(false);
  const [pageDirection, setPageDirection] = useState<
    "next" | "previous" | null
  >(null);
  const [editInfoModalOpen, setEditInfoModalOpen] = useState(false);
  const [selectedRowForInfo, setSelectedRowForInfo] = useState<string | null>(
    null,
  );
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [selectedRowForDelete, setSelectedRowForDelete] = useState<
    string | null
  >(null);
  const [sortState, setSortState] = useState<{column: string; direction: 'asc' | 'desc'} | null>(null);
  const { toast } = useToast();

  // Reset to page 1 when rows change (due to filtering)
  useEffect(() => {
    if (currentPage > 1) {
      setCurrentPage(1);
    }
  }, [rows.length]);

  // Use rows as provided (already filtered by parent with distances calculated)

  // Calculate pagination
  const totalRows = rows.length;
  const totalPages = Math.ceil(totalRows / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedRows = rows.slice(startIndex, endIndex);

  // Reset to first page when page size changes with transition
  const handlePageSizeChange = async (newPageSize: string) => {
    setIsPageChanging(true);
    await new Promise((resolve) => setTimeout(resolve, 200));

    setPageSize(Number(newPageSize));
    setCurrentPage(1);

    setTimeout(() => setIsPageChanging(false), 100);
  };

  // Handle page navigation with smooth transition
  const goToPage = async (page: number) => {
    if (page === currentPage) return;

    // Set direction indicator
    setPageDirection(page > currentPage ? "next" : "previous");
    setIsPageChanging(true);

    // Add a small delay for visual feedback
    await new Promise((resolve) => setTimeout(resolve, 200));

    setCurrentPage(Math.max(1, Math.min(page, totalPages)));

    // Reset loading state after animation completes (250ms animation + buffer)
    setTimeout(() => {
      setIsPageChanging(false);
      setPageDirection(null);
    }, 300);
  };
  const handleDragEnd = (result: any) => {
    if (!result.destination) return;

    const { source, destination, type } = result;

    if (type === "column") {
      const newColumnOrder = Array.from(columns);
      const [reorderedColumn] = newColumnOrder.splice(source.index, 1);
      newColumnOrder.splice(destination.index, 0, reorderedColumn);

      const columnIds = newColumnOrder.map((col) => col.id);
      onReorderColumns.mutate(columnIds);
    } else if (type === "row") {
      const newRowOrder = Array.from(rows);
      const [reorderedRow] = newRowOrder.splice(source.index, 1);
      newRowOrder.splice(destination.index, 0, reorderedRow);

      const rowIds = newRowOrder.map((row) => row.id);
      onReorderRows.mutate(rowIds);
    }
  };

  const formatNumber = (value: string | number) => {
    const num = typeof value === "string" ? parseFloat(value) : value;
    return new Intl.NumberFormat("en-US").format(num || 0);
  };

  const formatCurrency = (value: string | number) => {
    const num = typeof value === "string" ? parseFloat(value) : value;
    return new Intl.NumberFormat("en-MY", {
      style: "currency",
      currency: "MYR",
      currencyDisplay: "symbol",
    })
      .format(num || 0)
      .replace("MYR", "RM");
  };

  const getCellValue = (
    row: TableRowType,
    column: TableColumn,
    rowIndex?: number,
  ) => {
    switch (column.dataKey) {
      case "id":
        return row.id.slice(0, 8).toUpperCase();
      case "no":
        // Show infinity icon for QL kitchen row
        if (row.location === "QL kitchen") {
          return "∞";
        }
        // Display sequential numbers (1, 2, 3...) based on position in table
        // This shows sequential numbers even if code has gaps
        if (rowIndex !== undefined) {
          const hasQLKitchenAtTop = paginatedRows[0]?.location === "QL kitchen";
          return hasQLKitchenAtTop ? rowIndex : rowIndex + 1;
        }
        return row.no || 0;
      case "route":
        return row.route || "";
      case "code":
        return row.code || "";
      case "location":
        return row.location || "";
      case "delivery":
        return (row as any).delivery || "";
      case "trip":
        return row.trip || "";
      case "alt1":
        return (row as any).alt1 || "";
      case "alt2":
        return (row as any).alt2 || "";
      case "info":
        return row.info || "";
      case "tngSite":
        return row.tngSite || "";
      case "tngRoute":
        // Handle currency formatting for TnG column
        if (column.type === "currency") {
          const value = parseFloat(row.tngRoute || "0") || 0;
          return formatCurrency(value);
        }
        return row.tngRoute || "";
      case "destination":
        // Handle currency formatting for Destination column
        if (column.type === "currency") {
          const value = parseFloat(row.destination || "0") || 0;
          return formatCurrency(value);
        }
        return row.destination || "";
      case "images":
        const images = row.images || [];
        // Convert string arrays to ImageWithCaption format
        return images.map((img: any) =>
          typeof img === "string" ? { url: img, caption: "" } : img,
        );
      case "kilometer":
        // Use the kilometer value already calculated by parent component
        const kmValue = (row as any).kilometer;
        if (kmValue === "—" || kmValue === undefined || kmValue === null) {
          return "—";
        }
        if (typeof kmValue === "number") {
          if (kmValue === 0) {
            return "0.00 km";
          }
          return `${kmValue.toFixed(2)} km`;
        }
        return "—";
      default:
        // Handle dynamic columns - return empty value for new columns
        return (row as any)[column.dataKey] || "";
    }
  };

  const getDeliveryBadgeColor = (delivery: string) => {
    const colors: Record<string, string> = {
      "Same Day": "bg-transparent text-white",
      "Next Day": "bg-transparent text-white",
      "2-3 Days": "bg-transparent text-white",
      "3-5 Days": "bg-transparent text-white",
      Daily: "bg-transparent text-white",
      Weekday: "bg-transparent text-white",
      "Alternate 1": "bg-transparent text-white",
      "Alternate 2": "bg-transparent text-white",
    };
    return colors[delivery] || "bg-transparent text-white";
  };

  // Calculate totals based on currently visible filtered/searched data
  // The 'rows' prop already contains only the filtered data from the parent component
  const calculateColumnSum = (dataKey: string, columnType: string) => {
    if (dataKey === "no") {
      return rows.reduce((sum, row) => sum + (row.no || 0), 0);
    }
    if (columnType === "currency" && dataKey === "tngRoute") {
      return rows.reduce((sum, row) => {
        const value = parseFloat(row.tngRoute || "0") || 0;
        return sum + value;
      }, 0);
    }
    if (columnType === "currency" && dataKey === "destination") {
      return rows.reduce((sum, row) => {
        const value = parseFloat(row.destination || "0") || 0;
        return sum + value;
      }, 0);
    }
    if (columnType === "currency" && dataKey === "tollPrice") {
      return rows.reduce((sum, row) => {
        const value = parseFloat(row.tollPrice || "0") || 0;
        return sum + value;
      }, 0);
    }
    return 0;
  };

  const handleSortByCode = (direction: 'asc' | 'desc') => {
    // Sort rows by code column
    const sortedRows = [...rows].sort((a, b) => {
      const codeA = a.code || "";
      const codeB = b.code || "";

      // Handle numeric codes by parsing them
      const numA = parseInt(codeA) || 0;
      const numB = parseInt(codeB) || 0;

      // If both are numbers, sort numerically
      if (!isNaN(numA) && !isNaN(numB)) {
        return direction === 'asc' ? numA - numB : numB - numA;
      }

      // Otherwise sort alphabetically
      return direction === 'asc' ? codeA.localeCompare(codeB) : codeB.localeCompare(codeA);
    });

    // Reorder rows using the mutation
    const sortedRowIds = sortedRows.map((row) => row.id);
    onReorderRows.mutate(sortedRowIds);
  };

  const handleSortBySortOrder = (direction: 'asc' | 'desc') => {
    // Sort rows by no field
    const sortedRows = [...rows].sort((a, b) => {
      const noA = a.no || 0;
      const noB = b.no || 0;
      return direction === 'asc' ? noA - noB : noB - noA;
    });

    // Reorder rows using the mutation
    const sortedRowIds = sortedRows.map((row) => row.id);
    onReorderRows.mutate(sortedRowIds);
  };

  const handleSortByTrip = (direction: 'asc' | 'desc') => {
    // Sort rows by trip column (A-Z or Z-A)
    const sortedRows = [...rows].sort((a, b) => {
      const tripA = a.trip || "";
      const tripB = b.trip || "";
      return direction === 'asc' ? tripA.localeCompare(tripB) : tripB.localeCompare(tripA);
    });

    // Reorder rows using the mutation
    const sortedRowIds = sortedRows.map((row) => row.id);
    onReorderRows.mutate(sortedRowIds);
  };

  const handleSortByLocation = (direction: 'asc' | 'desc') => {
    // Sort rows by location column (A-Z or Z-A)
    const sortedRows = [...rows].sort((a, b) => {
      const locationA = a.location || "";
      const locationB = b.location || "";
      return direction === 'asc' ? locationA.localeCompare(locationB) : locationB.localeCompare(locationA);
    });

    // Reorder rows using the mutation
    const sortedRowIds = sortedRows.map((row) => row.id);
    onReorderRows.mutate(sortedRowIds);
  };

  const handleSortByRoute = (direction: 'asc' | 'desc') => {
    // Sort rows by route column (A-Z or Z-A)
    const sortedRows = [...rows].sort((a, b) => {
      const routeA = a.route || "";
      const routeB = b.route || "";
      return direction === 'asc' ? routeA.localeCompare(routeB) : routeB.localeCompare(routeA);
    });

    // Reorder rows using the mutation
    const sortedRowIds = sortedRows.map((row) => row.id);
    onReorderRows.mutate(sortedRowIds);
  };

  const handleSortByKilometer = (direction: 'asc' | 'desc') => {
    // Sort rows by kilometer column (0-9 or 9-0)
    const sortedRows = [...rows].sort((a, b) => {
      const kmA = parseFloat((a as any).kilometer) || 0;
      const kmB = parseFloat((b as any).kilometer) || 0;
      return direction === 'asc' ? kmA - kmB : kmB - kmA;
    });

    // Reorder rows using the mutation
    const sortedRowIds = sortedRows.map((row) => row.id);
    onReorderRows.mutate(sortedRowIds);
  };

  const handleSortToggle = (column: string) => {
    // Cycle through: null → asc → desc → null
    let newDirection: 'asc' | 'desc' | null = null;
    
    if (!sortState || sortState.column !== column) {
      // First click: set to ascending
      newDirection = 'asc';
    } else if (sortState.direction === 'asc') {
      // Second click: set to descending
      newDirection = 'desc';
    } else {
      // Third click: clear sort
      newDirection = null;
    }
    
    if (newDirection === null) {
      setSortState(null);
      // No need to reorder, just clear the state
      return;
    }
    
    setSortState({ column, direction: newDirection });
    
    // Apply the sort
    switch (column) {
      case "route":
        handleSortByRoute(newDirection);
        break;
      case "code":
        handleSortByCode(newDirection);
        break;
      case "trip":
        handleSortByTrip(newDirection);
        break;
      case "location":
        handleSortByLocation(newDirection);
        break;
      case "kilometer":
        handleSortByKilometer(newDirection);
        break;
      case "order":
        handleSortBySortOrder(newDirection);
        break;
      default:
        break;
    }
  };

  const handleSaveInfo = (rowId: string, updates: { info?: string; latitude?: string; longitude?: string }) => {
    onUpdateRow.mutate({ id: rowId, updates });
  };

  const handleDeleteClick = (rowId: string) => {
    setSelectedRowForDelete(rowId);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (selectedRowForDelete) {
      onDeleteRow.mutate(selectedRowForDelete);
      setDeleteConfirmOpen(false);
      setSelectedRowForDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteConfirmOpen(false);
    setSelectedRowForDelete(null);
  };

  // Filter toggle functions
  const toggleRouteFilter = (route: string) => {
    if (!onFilterValueChange) return;
    
    const newFilters = filterValue.includes(route)
      ? filterValue.filter(f => f !== route)
      : [...filterValue, route];
    onFilterValueChange(newFilters);
  };

  const toggleTripFilter = (trip: string) => {
    if (!onTripFilterValueChange) return;
    
    const newFilters = tripFilterValue.includes(trip)
      ? tripFilterValue.filter(f => f !== trip)
      : [...tripFilterValue, trip];
    onTripFilterValueChange(newFilters);
  };

  return (
    <div
      className="glass-table rounded-xl border-none shadow-2xl table-container my-10"
      data-testid="data-table"
    >
      {/* Top Row: Entries (Left) and Customize Buttons (Right) */}
      <div className="px-6 py-3 border-b border-border/20 bg-gradient-to-r from-blue-500/5 via-transparent to-blue-500/5 dark:from-blue-500/5 dark:via-transparent dark:to-blue-500/5 backdrop-blur-sm text-[10px]" style={{ fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif" }}>
        <div className="flex flex-row gap-3 items-center justify-between">
          
          {/* Left Side: Entries Selector */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-sm text-muted-foreground pagination-10px">
              Show
            </span>
            <Select
              value={pageSize.toString()}
              onValueChange={handlePageSizeChange}
              disabled={isPageChanging}
            >
              <SelectTrigger
                className={`w-20 h-8 pagination-button text-sm font-semibold shadow-sm ${isPageChanging ? '[&>*]:!hidden [&>svg]:!hidden' : ''}`}
              >
                {isPageChanging && (
                  <div className="loading-spinner absolute inset-0 m-auto"></div>
                )}
                {!isPageChanging && (
                  <SelectValue />
                )}
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700">
                <SelectItem value="16" className="font-semibold">16</SelectItem>
                <SelectItem value="30" className="font-semibold">30</SelectItem>
                <SelectItem value="50" className="font-semibold">50</SelectItem>
                <SelectItem value="100" className="font-semibold">100</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-sm text-muted-foreground pagination-10px">
              of {totalRows} entries
            </span>
          </div>
          
          {/* Right Side: Customize and Other Buttons */}
          <div className="flex items-center space-x-2">
            <Button
              onClick={onShowCustomization}
              variant="outline"
              size="sm"
              className="btn-glass w-8 h-8 p-0 pagination-button"
              data-testid="button-show"
              title="Customize columns"
            >
              <Eye className="w-3 h-3 text-blue-600 dark:text-blue-400" />
            </Button>
            <Button
              onClick={onOptimizeRoute}
              variant="outline"
              size="sm"
              className="btn-glass w-8 h-8 p-0 pagination-button"
              data-testid="button-optimize-route"
              title="Optimize delivery route with AI"
            >
              <Route className="w-3 h-3 text-blue-600 dark:text-blue-400" />
            </Button>
            <Button
              onClick={onScreenshot}
              variant="outline"
              size="sm"
              className="btn-glass w-8 h-8 p-0 pagination-button"
              data-testid="button-screenshot"
              title="Take screenshot"
            >
              <Camera className="w-3 h-3 text-blue-600 dark:text-blue-400" />
            </Button>
          </div>
        </div>
        
      </div>
      {/* Bottom Row: Sort/Filter/Clear (Left) and Search (Right) */}
      <div className="flex justify-between items-center px-6 py-3 border-b border-border/20 bg-background/30">
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Sort Popover */}
          <Popover>
            <PopoverTrigger asChild>
              <Button 
                variant="outline" 
                className={`h-6 px-2 pagination-button text-xs justify-start ${onReorderRows.isPending ? '[&>*]:!hidden' : ''}`}
                data-testid="sort-trigger"
                disabled={onReorderRows.isPending}
              >
                {onReorderRows.isPending && (
                  <div className="loading-spinner absolute inset-0 m-auto"></div>
                )}
                {!onReorderRows.isPending && sortState && (
                  <>
                    {sortState.direction === 'asc' ? <ArrowUp className="w-3 h-3 mr-1" /> : <ArrowDown className="w-3 h-3 mr-1" />}
                    <span className="hidden sm:inline">
                      {sortState.column === 'route' && 'Route'}
                      {sortState.column === 'code' && 'Code'}
                      {sortState.column === 'location' && 'Location'}
                      {sortState.column === 'trip' && 'Trip'}
                      {sortState.column === 'kilometer' && 'Km'}
                      {sortState.column === 'order' && 'No'}
                    </span>
                    <span className="sm:hidden">Sort</span>
                  </>
                )}
                {!onReorderRows.isPending && !sortState && (
                  <>
                    <ArrowUpDown className="w-3 h-3 mr-1 opacity-50" />
                    <span>Sort</span>
                  </>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-52 p-0" align="start">
              <div className="p-3 btn-glass">
                <h4 className="font-medium text-sm mb-3 pb-2 border-b border-border/20 flex items-center gap-2">
                  <ArrowUpDown className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400" />
                  Sort By
                </h4>
                <div className="space-y-1.5 text-sm">
                  <Button
                    variant={sortState?.column === 'route' ? 'default' : 'ghost'}
                    size="sm"
                    className={`w-full justify-between text-xs ${
                      sortState?.column === 'route' ? 'bg-blue-500 hover:bg-blue-600 text-white' : ''
                    }`}
                    onClick={() => handleSortToggle('route')}
                    data-testid="button-sort-route"
                  >
                    <span>Route</span>
                    {sortState?.column === 'route' && (
                      sortState.direction === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                    )}
                    {sortState?.column !== 'route' && <ArrowUpDown className="w-3 h-3 opacity-30" />}
                  </Button>
                  <Button
                    variant={sortState?.column === 'code' ? 'default' : 'ghost'}
                    size="sm"
                    className={`w-full justify-between text-xs ${
                      sortState?.column === 'code' ? 'bg-blue-500 hover:bg-blue-600 text-white' : ''
                    }`}
                    onClick={() => handleSortToggle('code')}
                    data-testid="button-sort-code"
                  >
                    <span>Code</span>
                    {sortState?.column === 'code' && (
                      sortState.direction === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                    )}
                    {sortState?.column !== 'code' && <ArrowUpDown className="w-3 h-3 opacity-30" />}
                  </Button>
                  <Button
                    variant={sortState?.column === 'location' ? 'default' : 'ghost'}
                    size="sm"
                    className={`w-full justify-between text-xs ${
                      sortState?.column === 'location' ? 'bg-blue-500 hover:bg-blue-600 text-white' : ''
                    }`}
                    onClick={() => handleSortToggle('location')}
                    data-testid="button-sort-location"
                  >
                    <span>Location</span>
                    {sortState?.column === 'location' && (
                      sortState.direction === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                    )}
                    {sortState?.column !== 'location' && <ArrowUpDown className="w-3 h-3 opacity-30" />}
                  </Button>
                  <Button
                    variant={sortState?.column === 'trip' ? 'default' : 'ghost'}
                    size="sm"
                    className={`w-full justify-between text-xs ${
                      sortState?.column === 'trip' ? 'bg-blue-500 hover:bg-blue-600 text-white' : ''
                    }`}
                    onClick={() => handleSortToggle('trip')}
                    data-testid="button-sort-trip"
                  >
                    <span>Trip</span>
                    {sortState?.column === 'trip' && (
                      sortState.direction === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                    )}
                    {sortState?.column !== 'trip' && <ArrowUpDown className="w-3 h-3 opacity-30" />}
                  </Button>
                  <Button
                    variant={sortState?.column === 'kilometer' ? 'default' : 'ghost'}
                    size="sm"
                    className={`w-full justify-between text-xs ${
                      sortState?.column === 'kilometer' ? 'bg-blue-500 hover:bg-blue-600 text-white' : ''
                    }`}
                    onClick={() => handleSortToggle('kilometer')}
                    data-testid="button-sort-kilometer"
                  >
                    <span>Kilometer</span>
                    {sortState?.column === 'kilometer' && (
                      sortState.direction === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                    )}
                    {sortState?.column !== 'kilometer' && <ArrowUpDown className="w-3 h-3 opacity-30" />}
                  </Button>
                  {isFiltered && (
                    <Button
                      variant={sortState?.column === 'order' ? 'default' : 'ghost'}
                      size="sm"
                      className={`w-full justify-between text-xs ${
                        sortState?.column === 'order' ? 'bg-blue-500 hover:bg-blue-600 text-white' : ''
                      }`}
                      onClick={() => handleSortToggle('order')}
                      data-testid="button-sort-order"
                    >
                      <span>No</span>
                      {sortState?.column === 'order' && (
                        sortState.direction === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                      )}
                      {sortState?.column !== 'order' && <ArrowUpDown className="w-3 h-3 opacity-30" />}
                    </Button>
                  )}
                </div>
              </div>
            </PopoverContent>
          </Popover>
          
          {/* Combined Filter Section */}
          <div className="w-auto">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="h-6 px-2 pagination-button text-xs justify-start" data-testid="combined-filter-trigger">
                  <span className="hidden sm:inline">
                    {filterValue.length === 0 && tripFilterValue.length === 0 
                      ? "🔍 Filters" 
                      : `📍 ${filterValue.length} • 🚫 ${tripFilterValue.length}`}
                  </span>
                  <span className="sm:hidden">
                    {filterValue.length === 0 && tripFilterValue.length === 0 
                      ? "🔍" 
                      : `📍${filterValue.length} 🚫${tripFilterValue.length}`}
                  </span>
                </Button>
              </PopoverTrigger>
            <PopoverContent className="w-64 p-0" align="start">
              <div className="space-y-4 p-4 text-sm btn-glass">
                {/* Routes Section */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-sm flex items-center gap-2">
                      <MapPin className="w-3 h-3 text-accent" />
                      Routes ({filterValue.length} selected)
                    </h4>
                    {filterValue.length > 0 && (
                      <Button variant="ghost" size="sm" onClick={() => onFilterValueChange?.([])} className="h-auto p-1 text-xs">
                        <X className="w-3 h-3 mr-1" />
                        Clear
                      </Button>
                    )}
                  </div>
                  <div className="space-y-2 max-h-32 overflow-y-auto border rounded p-2 bg-background/50">
                    {routeOptions.map(route => (
                      <div key={route} className="flex items-center space-x-2">
                        <Checkbox
                          id={`route-${route}`}
                          checked={filterValue.includes(route)}
                          onCheckedChange={() => toggleRouteFilter(route)}
                        />
                        <Label htmlFor={`route-${route}`} className="text-xs cursor-pointer">
                          📍 {route}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Separator */}
                <div className="border-t border-border/20"></div>
                
                {/* Trips Section */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-sm flex items-center gap-2">
                      <Filter className="w-3 h-3 text-orange-500" />
                      Hide Trips ({tripFilterValue.length} hidden)
                    </h4>
                    {tripFilterValue.length > 0 && (
                      <Button variant="ghost" size="sm" onClick={() => onTripFilterValueChange?.([])} className="h-auto p-1 text-xs">
                        <X className="w-3 h-3 mr-1" />
                        Clear
                      </Button>
                    )}
                  </div>
                  <div className="space-y-2 max-h-32 overflow-y-auto border rounded p-2 bg-background/50">
                    {tripOptions.map(trip => (
                      <div key={trip} className="flex items-center space-x-2">
                        <Checkbox
                          id={`trip-${trip}`}
                          checked={tripFilterValue.includes(trip)}
                          onCheckedChange={() => toggleTripFilter(trip)}
                        />
                        <Label htmlFor={`trip-${trip}`} className="peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-xs cursor-pointer font-medium">
                          🚫 {trip}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>
          </div>
          
          {/* Clear All Section */}
          {(searchTerm || filterValue.length > 0 || tripFilterValue.length > 0) && (
            <Button
              onClick={onClearAllFilters}
              variant="outline"
              size="sm"
              className="h-6 px-2 pagination-button text-xs border-destructive/30 hover:bg-destructive/10 hover:border-destructive/50"
              data-testid="clear-all-filters"
            >
              <span className="hidden sm:inline bg-gradient-to-r from-red-600 to-rose-600 dark:from-red-400 dark:to-rose-400 bg-clip-text text-transparent">Clear</span>
              <span className="sm:hidden bg-gradient-to-r from-red-600 to-rose-600 dark:from-red-400 dark:to-rose-400 bg-clip-text text-transparent">Clear</span>
            </Button>
          )}
        </div>
        
        {/* Right Side: Search Input */}
        <div className="flex-1 max-w-[50%] lg:max-w-md ml-auto">
          <div className="relative group">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3 h-3 text-muted-foreground group-hover:text-primary transition-colors" />
            <Input
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => onSearchTermChange?.(e.target.value)}
              className="pl-7 pr-7 h-8 bg-background text-foreground placeholder:text-muted-foreground border-2 border-input rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-colors text-sm"
              data-testid="search-input"
            />
            {searchTerm && (
              <button
                onClick={() => onSearchTermChange?.('')}
                className="absolute right-1 top-1/2 transform -translate-y-1/2 p-0.5 w-5 h-5 rounded-full hover:bg-muted/50 transition-colors flex items-center justify-center"
                data-testid="clear-search"
                aria-label="Clear search"
              >
                <X className="w-2.5 h-2.5 text-muted-foreground hover:text-foreground" />
              </button>
            )}
          </div>
        </div>
      </div>
      {/* Active Filters Display */}
      {(searchTerm || filterValue.length > 0 || tripFilterValue.length > 0) && (
        <div className="px-6 py-2 border-b border-border/20 bg-gradient-to-r from-blue-500/5 via-transparent to-blue-500/5 dark:from-blue-500/5 dark:via-transparent dark:to-blue-500/5">
          <div className="flex flex-wrap items-center gap-1">
            <span className="text-muted-foreground font-medium text-xs">Active:</span>
            {searchTerm && (
              <div className="flex items-center gap-0.5 px-2 py-0.5 bg-primary/10 border border-primary/20 rounded-full text-primary text-xs">
                <Search className="w-2.5 h-2.5" />
                <span>"{searchTerm}"</span>
                <button onClick={() => onSearchTermChange?.('')} className="ml-0.5 p-0.5 hover:text-primary/70 flex items-center justify-center rounded-full hover:bg-primary/10" aria-label="Remove text filter">
                  <X className="w-2.5 h-2.5" />
                </button>
              </div>
            )}
            {filterValue.map(route => (
              <div key={route} className="flex items-center gap-0.5 px-2 py-0.5 bg-transparent border border-transparent rounded-full text-gray-400 text-xs">
                <Filter className="w-2.5 h-2.5" />
                <span>{route}</span>
                <button onClick={() => toggleRouteFilter(route)} className="ml-0.5 p-0.5 hover:text-red-600 flex items-center justify-center rounded-full hover:bg-red-500/10" aria-label={`Remove route filter: ${route}`}>
                  <X className="w-2.5 h-2.5 text-red-500" />
                </button>
              </div>
            ))}
            {tripFilterValue.map(trip => (
              <div key={trip} className="flex items-center gap-0.5 px-2 py-0.5 bg-transparent border border-transparent rounded-full text-gray-400 text-xs">
                <Filter className="w-2.5 h-2.5" />
                <span>{trip}</span>
                <button onClick={() => toggleTripFilter(trip)} className="ml-0.5 p-0.5 hover:text-red-600 flex items-center justify-center rounded-full hover:bg-red-500/10" aria-label={`Remove trip filter: ${trip}`}>
                  <X className="w-2.5 h-2.5 text-red-500" />
                </button>
              </div>
            ))}
            <div className="ml-auto text-muted-foreground text-xs">
              {filteredRowsCount} of {totalRowsCount} results
            </div>
          </div>
        </div>
      )}
      <div className="overflow-x-auto w-full">
        <DragDropContext onDragEnd={handleDragEnd}>
          <Table className="min-w-full">
            <TableHeader className="table-header-glass sticky top-0 z-20 bg-white dark:bg-slate-900 border-b-2 border-yellow-400/30">
              <Droppable
                droppableId="columns"
                direction="horizontal"
                type="column"
              >
                {(provided) => (
                  <TableRow
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                  >
                    {columns.map((column, index) => (
                      <Draggable
                        key={column.id}
                        draggableId={column.id}
                        index={index}
                      >
                        {(provided) => (
                          <TableHead
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className="px-6 py-3 text-center table-header-footer-12px font-medium text-blue-700 dark:text-blue-300 tracking-wide border-b border-border sticky top-0 bg-white dark:bg-slate-900 shadow-sm whitespace-nowrap"
                            style={{
                              textAlign: "center",
                              textDecoration: "normal",
                              fontSize: "10px",
                              ...(column.dataKey === "location" && {
                                minWidth: `${120 + 15}px`,
                              }),
                            }}
                            colSpan={column.dataKey === "location" ? 3 : 1}
                            data-testid={`column-header-${column.dataKey}`}
                          >
                            <ColumnHeader
                              column={column}
                              dragHandleProps={provided.dragHandleProps}
                              onDelete={() => onDeleteColumn.mutate(column.id)}
                              isAuthenticated={isAuthenticated}
                              editMode={editMode}
                            />
                          </TableHead>
                        )}
                      </Draggable>
                    ))}
                    <TableHead
                      className="px-6 py-3 text-center table-header-footer-12px font-semibold tracking-wide border-b border-border sticky top-0 bg-white dark:bg-slate-900 shadow-sm whitespace-nowrap"
                      style={{
                        textAlign: "center",
                        textDecoration: "normal",
                        fontSize: "10px",
                      }}
                    >
                      <span className="bg-gradient-to-r from-red-600 to-rose-600 dark:from-red-400 dark:to-rose-400 bg-clip-text text-transparent">
                        Actions
                      </span>
                    </TableHead>
                    {provided.placeholder}
                  </TableRow>
                )}
              </Droppable>
            </TableHeader>
            <Droppable droppableId="rows" type="row">
              {(provided) => (
                <TableBody
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={`pt-2 motion-layer ${
                    pageDirection === "next" ? "slide-in-right" : pageDirection === "previous" ? "slide-in-left" : ""
                  }`}
                  key={`page-${currentPage}`}
                >
                  {isLoading
                    ? Array.from({ length: Math.min(pageSize, 5) }).map(
                        (_, index) => (
                          <tr
                            key={`skeleton-${index}`}
                            className={`skeleton-row fade-in-stagger odd:bg-white dark:odd:bg-gray-900/50 even:bg-blue-50/50 dark:even:bg-blue-900/20 backdrop-blur-sm hover:bg-muted/60 table-cell-unique-transition`}
                          >
                            {/* Actions column */}
                            <td className="p-3 w-16">
                              <div className="flex gap-1 justify-center">
                                <div className="skeleton w-8 h-8 rounded-md bg-gradient-to-r from-blue-500/20 to-purple-500/20 animate-pulse" />
                                <div className="skeleton w-8 h-8 rounded-md bg-gradient-to-r from-green-500/20 to-blue-500/20 animate-pulse" style={{animationDelay: "0.1s"}} />
                                <div className="skeleton w-8 h-8 rounded-md bg-gradient-to-r from-yellow-500/20 to-green-500/20 animate-pulse" style={{animationDelay: "0.2s"}} />
                                <div className="skeleton w-8 h-8 rounded-md bg-gradient-to-r from-red-500/20 to-yellow-500/20 animate-pulse" style={{animationDelay: "0.3s"}} />
                              </div>
                            </td>

                            {/* Dynamic columns - cleaner skeleton */}
                            {columns.map((column) => (
                              <td
                                key={column.id}
                                className="p-3"
                                colSpan={column.dataKey === "location" ? 3 : 1}
                              >
                                {column.dataKey === "images" ? (
                                  <div className="skeleton w-12 h-8 rounded mx-auto bg-gradient-to-r from-blue-400/20 to-purple-400/20 animate-pulse" />
                                ) : column.dataKey === "delivery" ? (
                                  <div className="skeleton w-16 h-6 rounded-full mx-auto bg-gradient-to-r from-green-400/20 to-blue-400/20 animate-pulse" />
                                ) : column.dataKey === "location" ? (
                                  <div className="skeleton w-32 h-4 mx-auto bg-gradient-to-r from-yellow-400/20 to-green-400/20 animate-pulse" />
                                ) : (
                                  <div className="skeleton w-20 h-4 mx-auto bg-gradient-to-r from-cyan-400/20 to-blue-400/20 animate-pulse" />
                                )}
                              </td>
                            ))}
                          </tr>
                        ),
                      )
                    : paginatedRows.map((row, index) => (
                        <Draggable
                          key={row.id}
                          draggableId={row.id}
                          index={index}
                        >
                          {(provided, snapshot) => (
                            <TableRow
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              className={`table-row-glass group ${
                                row.location === "QL kitchen" 
                                  ? "bg-gradient-to-r from-gray-100/80 to-slate-100/80 dark:from-gray-800/60 dark:to-slate-800/60" 
                                  : "odd:bg-white dark:odd:bg-gray-900/50 even:bg-blue-50/50 dark:even:bg-blue-900/20"
                              } hover:bg-blue-100/60 dark:hover:bg-blue-800/30 table-cell-unique-transition ${
                                snapshot.isDragging ? "drag-elevate" : ""
                              }`}
                              data-testid={`table-row-${row.id}`}
                            >
                              {columns.map((column) => (
                                <TableCell
                                  key={column.id}
                                  className="p-4 align-middle [&:has([role=checkbox])]:pr-0 px-6 py-3 table-cell-10px text-center text-[12px] bg-transparent text-foreground whitespace-nowrap font-normal"
                                  style={{
                                    ...(column.dataKey === "location" && {
                                      minWidth: `${120 + 15}px`,
                                      fontSize: "10px",
                                    }),
                                    ...(column.dataKey === "delivery" && {
                                      fontSize: "10px",
                                      fontWeight: "normal",
                                    }),
                                  }}
                                  colSpan={
                                    column.dataKey === "location" ? 3 : 1
                                  }
                                  data-testid={`cell-${row.id}-${column.dataKey}`}
                                >
                                  {column.dataKey === "images" ? (
                                    <ImagePreview
                                      images={row.images}
                                      rowId={row.id}
                                      onAddImage={() =>
                                        onSelectRowForImage(row.id)
                                      }
                                      editMode={editMode}
                                      onAccessDenied={() =>
                                        onSelectRowForImage("access-denied")
                                      }
                                    />
                                  ) : column.dataKey === "info" ? (
                                    row.info && row.info.trim() ? (
                                      <InfoModal
                                        info={row.info}
                                        rowId={row.id}
                                        code={row.code}
                                        location={row.location}
                                        latitude={row.latitude ? String(row.latitude) : undefined}
                                        longitude={row.longitude ? String(row.longitude) : undefined}
                                        qrCode={row.qrCode || undefined}
                                        no={row.no}
                                        onUpdateRow={(updates) =>
                                          onUpdateRow.mutate({
                                            id: row.id,
                                            updates,
                                          })
                                        }
                                        editMode={editMode}
                                        allRows={rows}
                                      />
                                    ) : (
                                      <span className="text-muted-foreground">—</span>
                                    )
                                  ) : column.dataKey === "delivery" ? (
                                    editMode && column.isEditable === "true" ? (
                                      <EditableCell
                                        value={getCellValue(row, column, index)}
                                        type="text"
                                        dataKey={column.dataKey}
                                        onSave={(value) =>
                                          onUpdateRow.mutate({
                                            id: row.id,
                                            updates: {
                                              [column.dataKey]: value,
                                            },
                                          })
                                        }
                                      />
                                    ) : (
                                      <Badge
                                        className={`${getDeliveryBadgeColor((row as any).delivery || '')}`}
                                      >
                                        {getCellValue(row, column, index)}
                                      </Badge>
                                    )
                                  ) : column.dataKey === "id" ? (
                                    <span className="font-mono text-slate-600 dark:text-slate-300" style={{ fontSize: '10px' }}>
                                      {getCellValue(row, column, index)}
                                    </span>
                                  ) : column.dataKey === "no" && editMode && row.location !== "QL kitchen" ? (
                                    <EditableCell
                                      value={String(row.no || 0)}
                                      type="number"
                                      dataKey={column.dataKey}
                                      onSave={(value) =>
                                        onUpdateRow.mutate({
                                          id: row.id,
                                          updates: { no: parseInt(value) || 0 },
                                        })
                                      }
                                    />
                                  ) : editMode &&
                                    column.isEditable === "true" ? (
                                    <EditableCell
                                      value={getCellValue(row, column, index)}
                                      type={column.type}
                                      options={column.options || undefined}
                                      dataKey={column.dataKey}
                                      onSave={(value) =>
                                        onUpdateRow.mutate({
                                          id: row.id,
                                          updates: { [column.dataKey]: value },
                                        })
                                      }
                                    />
                                  ) : (
                                    <span className="text-[9px] text-gray-500 dark:text-gray-400 font-medium">
                                      {column.dataKey === "kilometer" ? (
                                        <MobileTooltip
                                          content={(() => {
                                            const segmentDistance = (row as any).segmentDistance;
                                            if (segmentDistance && typeof segmentDistance === "number" && segmentDistance > 0) {
                                              return `${segmentDistance.toFixed(2)} km`;
                                            }
                                            return "Starting point";
                                          })()}
                                          showBelow={index === 0 && index !== paginatedRows.length - 1}
                                        >
                                          <span className="cursor-help">
                                            {getCellValue(row, column, index)}
                                          </span>
                                        </MobileTooltip>
                                      ) : (
                                        getCellValue(row, column, index)
                                      )}
                                    </span>
                                  )}
                                </TableCell>
                              ))}
                              <TableCell
                                className="px-4 py-2 text-sm text-center text-foreground"
                                style={{ textAlign: "center" }}
                              >
                                <div className="flex flex-col items-center gap-1">
                                  {editMode && (
                                    <span className="text-xs text-muted-foreground opacity-70" style={{fontSize: '8px'}}>
                                      #{row.sortOrder || (startIndex + index + 1)}
                                    </span>
                                  )}
                                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <div
                                      {...provided.dragHandleProps}
                                      className={`cursor-grab active:cursor-grabbing mr-2 transition-colors ${
                                        editMode
                                          ? "hover:text-blue-400"
                                          : "hover:text-green-400"
                                      }`}
                                      title={
                                        editMode
                                          ? "Drag to sort rows"
                                          : "Drag to reorder (playground mode)"
                                      }
                                    >
                                      <GripVertical
                                        className={`w-4 h-4 transition-colors ${
                                          editMode
                                            ? "text-muted-foreground hover:text-blue-400"
                                            : "text-muted-foreground/70 hover:text-green-400"
                                        }`}
                                      />
                                    </div>
                                    {editMode && (
                                      <>
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          className={`btn-glass text-blue-400 dark:text-blue-300 hover:text-blue-500 dark:hover:text-blue-400 ${
                                            onUpdateRow.isPending &&
                                            onUpdateRow.variables?.id === row.id
                                              ? "mutation-loading"
                                              : ""
                                          }`}
                                          onClick={() => {
                                            if (editMode) {
                                              onSelectRowForImage(row.id);
                                            } else {
                                              onSelectRowForImage(
                                                "access-denied",
                                              );
                                            }
                                          }}
                                          disabled={
                                            onUpdateRow.isPending &&
                                            onUpdateRow.variables?.id === row.id
                                          }
                                          data-testid={`button-add-image-${row.id}`}
                                          title="Add image"
                                        >
                                          {onUpdateRow.isPending &&
                                          onUpdateRow.variables?.id === row.id ? (
                                            <InlineLoading />
                                          ) : (
                                            <PlusCircle className="w-4 h-4" />
                                          )}
                                        </Button>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="btn-glass text-blue-400 dark:text-blue-300 hover:text-blue-500 dark:hover:text-blue-400"
                                        onClick={() => {
                                          setSelectedRowForInfo(row.id);
                                          setEditInfoModalOpen(true);
                                        }}
                                        data-testid={`button-info-${row.id}`}
                                        title="View and edit information"
                                      >
                                        <FileText className="w-4 h-4" />
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className={`btn-glass ${!isAuthenticated ? "opacity-50 cursor-not-allowed" : "text-blue-400 dark:text-blue-300 hover:text-blue-500 dark:hover:text-blue-400"} ${
                                          onDeleteRow.isPending &&
                                          onDeleteRow.variables === row.id
                                            ? "mutation-loading"
                                            : ""
                                        }`}
                                        onClick={() =>
                                          isAuthenticated &&
                                          handleDeleteClick(row.id)
                                        }
                                        disabled={
                                          !isAuthenticated ||
                                          (onDeleteRow.isPending &&
                                            onDeleteRow.variables === row.id)
                                        }
                                        data-testid={`button-delete-row-${row.id}`}
                                        title={
                                          !isAuthenticated
                                            ? "Authentication required to delete rows"
                                            : "Delete row"
                                        }
                                      >
                                        {onDeleteRow.isPending &&
                                        onDeleteRow.variables === row.id ? (
                                          <InlineLoading type="particles" />
                                        ) : (
                                          <Trash className="w-4 h-4" />
                                        )}
                                      </Button>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </TableCell>
                            </TableRow>
                          )}
                        </Draggable>
                      ))}
                  {provided.placeholder}
                </TableBody>
              )}
            </Droppable>
            <tfoot>
              <TableRow>
                {columns.map((column, index) => (
                  <TableCell
                    key={column.id}
                    className="px-6 py-2 font-bold text-center sticky bottom-0 backdrop-blur-2xl backdrop-saturate-150 z-[5] border-t border-border whitespace-nowrap"
                    style={{ fontSize: '10px' }}
                    colSpan={column.dataKey === "location" ? 3 : 1}
                  >
                    {index === 0 ? (
                      <span className="font-semibold bg-gradient-to-r from-blue-600 to-cyan-600 dark:from-blue-400 dark:to-cyan-400 bg-clip-text text-transparent" style={{fontSize: '11px'}}>Totals</span>
                    ) : column.dataKey === "no" ? (
                      <span className="text-muted-foreground">—</span>
                    ) : column.dataKey === "tngRoute" &&
                      column.type === "currency" ? (
                      <span className="font-semibold bg-gradient-to-r from-blue-600 to-cyan-600 dark:from-blue-400 dark:to-cyan-400 bg-clip-text text-transparent">
                        {formatCurrency(
                          calculateColumnSum("tngRoute", column.type),
                        )}
                      </span>
                    ) : column.dataKey === "tollPrice" &&
                      column.type === "currency" ? (
                      <span className="font-semibold bg-gradient-to-r from-blue-600 to-cyan-600 dark:from-blue-400 dark:to-cyan-400 bg-clip-text text-transparent">
                        {formatCurrency(
                          calculateColumnSum("tollPrice", column.type),
                        )}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                ))}
                <TableCell className="px-6 py-2 font-bold text-center sticky bottom-0 backdrop-blur-2xl backdrop-saturate-150 z-[5] border-t border-border text-foreground whitespace-nowrap" style={{ fontSize: '10px' }}>
                  <span className="text-muted-foreground">—</span>
                </TableCell>
              </TableRow>
            </tfoot>
          </Table>

          {/* Pagination Controls */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-blue-200 dark:border-blue-500/20 pagination-transition">
            <div className="flex items-center space-x-2">
              {/* Page direction indicator */}
              {pageDirection && (
                <div className="flex items-center text-xs font-medium text-blue-600 dark:text-blue-400 pagination-10px mr-4 bg-blue-50 dark:bg-blue-950/30 px-3 py-1.5 rounded-full border border-blue-200 dark:border-blue-500/30">
                  {pageDirection === "next" ? (
                    <span className="flex items-center gap-1">
                      Going Next <ChevronRight className="h-3 w-3" />
                    </span>
                  ) : (
                    <span className="flex items-center gap-1">
                      <ChevronLeft className="h-3 w-3" /> Going Previous
                    </span>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center space-x-2">
              {/* Only show First button if not on first page */}
              {currentPage > 1 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => goToPage(1)}
                  disabled={isPageChanging}
                  className={`h-8 pagination-10px pagination-button ${
                    isPageChanging ? "pagination-loading" : ""
                  }`}
                  data-testid="button-first-page"
                >
                  <ChevronsLeft className="h-4 w-4" />
                  
                </Button>
              )}

              <div className="flex items-center space-x-1">
                {(() => {
                  // Calculate sliding window of 5 pages
                  let startPage = Math.max(1, currentPage - 2);
                  let endPage = Math.min(totalPages, startPage + 4);

                  // Adjust if we're near the end
                  if (endPage - startPage < 4 && totalPages >= 5) {
                    startPage = Math.max(1, endPage - 4);
                  }

                  const pages = [];
                  for (let i = startPage; i <= endPage; i++) {
                    pages.push(i);
                  }

                  return pages.map((pageNum) => {
                    const isCurrentPage = pageNum === currentPage;

                    return (
                      <Button
                        key={pageNum}
                        variant="outline"
                        size="sm"
                        onClick={() => goToPage(pageNum)}
                        disabled={isPageChanging}
                        className={`h-8 w-8 pagination-10px pagination-button page-number text-xs font-semibold ${
                          isCurrentPage ? "active" : ""
                        } ${isPageChanging ? "pagination-loading" : ""}`}
                        data-testid={`button-page-${pageNum}`}
                      >
                        {pageNum}
                      </Button>
                    );
                  });
                })()}
              </div>

              {/* Only show Last button if not on last page */}
              {currentPage < totalPages && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => goToPage(totalPages)}
                  disabled={isPageChanging}
                  className={`h-8 pagination-10px pagination-button ${
                    isPageChanging ? "pagination-loading" : ""
                  }`}
                  data-testid="button-last-page"
                >
                  
                  <ChevronsRight className="h-4 w-4" />
                </Button>
              )}

              <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 pagination-10px px-3 py-1.5 rounded-full border border-transparent ml-3">
                Page {currentPage} of {totalPages}
              </div>
            </div>

            <div></div>
          </div>
        </DragDropContext>
      </div>
      {/* Editable Info Modal */}
      {selectedRowForInfo && (
        <EditableInfoModal
          open={editInfoModalOpen}
          onOpenChange={setEditInfoModalOpen}
          info={rows.find((row) => row.id === selectedRowForInfo)?.info || ""}
          rowId={selectedRowForInfo}
          code={rows.find((row) => row.id === selectedRowForInfo)?.code || ""}
          location={
            rows.find((row) => row.id === selectedRowForInfo)?.location || ""
          }
          latitude={rows.find((row) => row.id === selectedRowForInfo)?.latitude ? String(rows.find((row) => row.id === selectedRowForInfo)?.latitude) : undefined}
          longitude={rows.find((row) => row.id === selectedRowForInfo)?.longitude ? String(rows.find((row) => row.id === selectedRowForInfo)?.longitude) : undefined}
          onSave={handleSaveInfo}
        />
      )}
      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="sm:max-w-[425px] transition-smooth-fast">
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this row? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleDeleteCancel}
              data-testid="button-cancel-delete"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              data-testid="button-confirm-delete"
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
