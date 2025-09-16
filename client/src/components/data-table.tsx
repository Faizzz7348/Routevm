import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ColumnHeader } from "./column-header";
import { EditableCell } from "./editable-cell";
import { ImagePreview } from "./image-preview";
import { InfoModal } from "./info-modal";
import { EditableInfoModal } from "./editable-info-modal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Edit, Trash, ChevronLeft, ChevronRight, GripVertical, PlusCircle, RefreshCw, ChevronsLeft, ChevronsRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { SkeletonLoader, LoadingOverlay, InlineLoading } from "./skeleton-loader";
import { TableRow as TableRowType, TableColumn } from "@shared/schema";
import { UseMutationResult } from "@tanstack/react-query";
import { useState } from "react";

interface DataTableProps {
  rows: TableRowType[];
  columns: TableColumn[];
  editMode: boolean;
  onUpdateRow: UseMutationResult<any, Error, { id: string; updates: Partial<any> }, unknown>;
  onDeleteRow: UseMutationResult<void, Error, string, unknown>;
  onReorderRows: UseMutationResult<TableRowType[], Error, string[], unknown>;
  onReorderColumns: UseMutationResult<TableColumn[], Error, string[], unknown>;
  onDeleteColumn: UseMutationResult<void, Error, string, unknown>;
  onSelectRowForImage: (rowId: string) => void;
  isAuthenticated?: boolean;
  isLoading?: boolean;
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
  isAuthenticated = false,
  isLoading = false,
}: DataTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [isPageChanging, setIsPageChanging] = useState(false);
  const [pageDirection, setPageDirection] = useState<'next' | 'previous' | null>(null);
  const [editInfoModalOpen, setEditInfoModalOpen] = useState(false);
  const [selectedRowForInfo, setSelectedRowForInfo] = useState<string | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [selectedRowForDelete, setSelectedRowForDelete] = useState<string | null>(null);
  const { toast } = useToast();

  // Use rows as provided (already filtered by parent)
  
  // Calculate pagination
  const totalRows = rows.length;
  const totalPages = Math.ceil(totalRows / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedRows = rows.slice(startIndex, endIndex);

  // Reset to first page when page size changes with transition
  const handlePageSizeChange = async (newPageSize: string) => {
    setIsPageChanging(true);
    await new Promise(resolve => setTimeout(resolve, 200));
    
    setPageSize(Number(newPageSize));
    setCurrentPage(1);
    
    setTimeout(() => setIsPageChanging(false), 100);
  };


  // Handle page navigation with smooth transition
  const goToPage = async (page: number) => {
    if (page === currentPage) return;
    
    // Set direction indicator
    setPageDirection(page > currentPage ? 'next' : 'previous');
    setIsPageChanging(true);
    
    // Add a small delay for visual feedback
    await new Promise(resolve => setTimeout(resolve, 200));
    
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
    
    // Reset loading state after content loads
    setTimeout(() => {
      setIsPageChanging(false);
      setPageDirection(null);
    }, 100);
  };
  const handleDragEnd = (result: any) => {
    if (!result.destination) return;

    const { source, destination, type } = result;

    if (type === "column") {
      const newColumnOrder = Array.from(columns);
      const [reorderedColumn] = newColumnOrder.splice(source.index, 1);
      newColumnOrder.splice(destination.index, 0, reorderedColumn);
      
      const columnIds = newColumnOrder.map(col => col.id);
      onReorderColumns.mutate(columnIds);
    } else if (type === "row") {
      const newRowOrder = Array.from(rows);
      const [reorderedRow] = newRowOrder.splice(source.index, 1);
      newRowOrder.splice(destination.index, 0, reorderedRow);
      
      const rowIds = newRowOrder.map(row => row.id);
      onReorderRows.mutate(rowIds);
    }
  };

  const formatNumber = (value: string | number) => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return new Intl.NumberFormat('en-US').format(num || 0);
  };

  const getCellValue = (row: TableRowType, column: TableColumn, rowIndex?: number) => {
    switch (column.dataKey) {
      case 'id':
        return row.id.slice(0, 8).toUpperCase();
      case 'no':
        return rowIndex !== undefined ? rowIndex + 1 : row.no || 0;
      case 'route':
        return row.route || '';
      case 'code':
        return row.code || '';
      case 'location':
        return row.location || '';
      case 'delivery':
        return row.delivery || '';
      case 'trip':
        return row.trip || '';
      case 'alt1':
        return row.alt1 || '';
      case 'alt2':
        return row.alt2 || '';
      case 'info':
        return row.info || '';
      case 'tngSite':
        return row.tngSite || '';
      case 'tngRoute':
        return row.tngRoute || '';
      case 'images':
        const images = row.images || [];
        // Convert string arrays to ImageWithCaption format
        return images.map((img: any) => 
          typeof img === 'string' ? { url: img, caption: '' } : img
        );
      default:
        // Handle dynamic columns - return empty value for new columns
        return (row as any)[column.dataKey] || '';
    }
  };

  const getDeliveryBadgeColor = (delivery: string) => {
    const colors: Record<string, string> = {
      'Same Day': 'bg-transparent text-white',
      'Next Day': 'bg-transparent text-white',
      '2-3 Days': 'bg-transparent text-white',
      '3-5 Days': 'bg-transparent text-white',
      'Daily': 'bg-transparent text-white',
      'Weekday': 'bg-transparent text-white',
      'Alternate 1': 'bg-transparent text-white',
      'Alternate 2': 'bg-transparent text-white',
    };
    return colors[delivery] || 'bg-transparent text-white';
  };

  const calculateColumnSum = (dataKey: string) => {
    if (dataKey === 'no') {
      return rows.reduce((sum, row) => sum + (row.no || 0), 0);
    }
    return 0;
  };

  const handleSortByCode = () => {
    // Sort rows by code column in ascending order (starting from 0)
    const sortedRows = [...rows].sort((a, b) => {
      const codeA = a.code || '';
      const codeB = b.code || '';
      
      // Handle numeric codes by parsing them
      const numA = parseInt(codeA) || 0;
      const numB = parseInt(codeB) || 0;
      
      // If both are numbers, sort numerically
      if (!isNaN(numA) && !isNaN(numB)) {
        return numA - numB;
      }
      
      // Otherwise sort alphabetically
      return codeA.localeCompare(codeB);
    });
    
    // Reorder rows using the mutation
    const sortedRowIds = sortedRows.map(row => row.id);
    onReorderRows.mutate(sortedRowIds);
  };

  const handleSaveInfo = (rowId: string, newInfo: string) => {
    onUpdateRow.mutate({ id: rowId, updates: { info: newInfo } });
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

  return (
    <div className="glass-table rounded-xl border-none shadow-2xl table-container my-10" data-testid="data-table">
      {/* Top controls - Show entries (Left) and Search (Right) */}
      <div className="flex justify-between items-center px-6 py-3 border-b border-border/20 bg-background/30">
        <div className="flex items-center space-x-2">
          <span className="text-sm text-muted-foreground pagination-10px">Show</span>
          <Select value={pageSize.toString()} onValueChange={handlePageSizeChange} disabled={isPageChanging || isLoading}>
            <SelectTrigger className={`w-16 h-8 pagination-button ${
              isPageChanging || isLoading ? 'pagination-loading' : ''
            }`}>
              {isPageChanging || isLoading ? (
                <InlineLoading />
              ) : (
                <SelectValue />
              )}
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="15">15</SelectItem>
              <SelectItem value="30">30</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
          <span className="text-sm text-muted-foreground pagination-10px">
            of {totalRows} entries
          </span>
        </div>
        
        <div className="flex items-center">
          <Button
            onClick={handleSortByCode}
            variant="outline"
            size="sm"
            className={`btn-glass h-8 px-3 ${
              onReorderRows.isPending ? 'mutation-loading' : ''
            }`}
            style={{fontSize: '10px'}}
            disabled={onReorderRows.isPending || isLoading}
            data-testid="button-sort-by-code"
            title="Sort by Code (ascending)"
          >
            {onReorderRows.isPending ? (
              <InlineLoading />
            ) : (
              <>
                <RefreshCw className="w-3 h-3 mr-1" />
                Sort
              </>
            )}
          </Button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <DragDropContext onDragEnd={handleDragEnd}>
          <Table>
            <TableHeader className="table-header-glass sticky top-0 z-10">
              <Droppable droppableId="columns" direction="horizontal" type="column">
                {(provided) => (
                  <TableRow ref={provided.innerRef} {...provided.droppableProps}>
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
                            className="px-4 py-2 text-center table-header-footer-12px font-semibold text-muted-foreground tracking-wider border-b border-border/20 sticky top-0 bg-background/95 backdrop-blur-md"
                            style={{ 
                              textAlign: 'center',
                              textDecoration: 'normal',
                              fontSize: '11px',
                              ...(column.dataKey === 'location' && { minWidth: `${120 + 15}px` })
                            }}
                            colSpan={column.dataKey === 'location' ? 3 : 1}
                            data-testid={`column-header-${column.dataKey}`}
                          >
                            <ColumnHeader
                              column={column}
                              dragHandleProps={provided.dragHandleProps}
                              onDelete={() => onDeleteColumn.mutate(column.id)}
                              isAuthenticated={isAuthenticated}
                            />
                          </TableHead>
                        )}
                      </Draggable>
                    ))}
                    <TableHead className="px-4 py-2 text-center table-header-footer-12px font-semibold text-muted-foreground tracking-wider border-b border-border/20 sticky top-0 bg-background/95 backdrop-blur-md" style={{ textAlign: 'center', textDecoration: 'normal', fontSize: '11px' }}>
                      Actions
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
                  className={`divide-y divide-border/10 table-content-transition ${
                    isPageChanging ? 'table-content-loading' : 'table-content-loaded'
                  }`}
                >
                  {isLoading ? (
                    Array.from({ length: pageSize }).map((_, index) => (
                      <tr key={`skeleton-${index}`} className={`skeleton-row fade-in-stagger border-b border-border/20`}>
                        {/* Actions column */}
                        <td className="p-3 w-16">
                          <div className="flex gap-1 justify-center">
                            <div className="skeleton w-8 h-8 rounded-md" />
                            <div className="skeleton w-8 h-8 rounded-md" />
                            <div className="skeleton w-8 h-8 rounded-md" />
                            <div className="skeleton w-8 h-8 rounded-md" />
                          </div>
                        </td>

                        {/* Dynamic columns based on actual column structure */}
                        {columns.map((column, colIndex) => (
                          <td key={column.id} className="p-3" colSpan={column.dataKey === 'location' ? 3 : 1}>
                            {column.dataKey === 'images' ? (
                              <div className="skeleton w-12 h-8 rounded mx-auto" />
                            ) : column.dataKey === 'delivery' ? (
                              <div className="skeleton w-16 h-6 rounded-full mx-auto" />
                            ) : column.dataKey === 'location' ? (
                              <div className="skeleton w-32 h-4 mx-auto" />
                            ) : (
                              <div className="skeleton w-20 h-4 mx-auto" />
                            )}
                          </td>
                        ))}
                      </tr>
                    ))
                  ) : (
                    paginatedRows.map((row, index) => (
                    <Draggable key={row.id} draggableId={row.id} index={index}>
                      {(provided) => (
                        <TableRow
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className="table-row-glass group"
                          data-testid={`table-row-${row.id}`}
                        >
                            {columns.map((column) => (
                              <TableCell
                                key={column.id}
                                className={`${column.dataKey === 'delivery' ? 'px-6 py-3 bg-transparent' : 'px-4 py-2'} table-cell-10px text-center`}
                                style={{
                                  color: 'silver',
                                  ...(column.dataKey === 'location' && { minWidth: `${120 + 15}px`, fontSize: '10px' }),
                                  ...(column.dataKey === 'delivery' && { fontSize: '10px', fontWeight: 'normal' })
                                }}
                                colSpan={column.dataKey === 'location' ? 3 : 1}
                                data-testid={`cell-${row.id}-${column.dataKey}`}
                              >
                                {column.dataKey === 'images' ? (
                                  <ImagePreview
                                    images={row.images}
                                    rowId={row.id}
                                    onAddImage={() => onSelectRowForImage(row.id)}
                                    editMode={editMode}
                                    onAccessDenied={() => onSelectRowForImage('access-denied')}
                                  />
                                ) : column.dataKey === 'info' ? (
                                  <InfoModal info={row.info} rowId={row.id} code={row.code} location={row.location} />
                                ) : column.dataKey === 'delivery' ? (
                                  editMode && column.isEditable === "true" ? (
                                    <EditableCell
                                      value={getCellValue(row, column, index)}
                                      type="text"
                                      onSave={(value) => onUpdateRow.mutate({ id: row.id, updates: { [column.dataKey]: value } })}
                                    />
                                  ) : (
                                    <Badge className={`${getDeliveryBadgeColor(row.delivery)}`}>
                                      {getCellValue(row, column, index)}
                                    </Badge>
                                  )
                                ) : column.dataKey === 'id' ? (
                                  <span className="font-mono">{getCellValue(row, column, index)}</span>
                                ) : editMode && column.isEditable === "true" ? (
                                  <EditableCell
                                    value={getCellValue(row, column, index)}
                                    type={column.type}
                                    options={column.options || undefined}
                                    onSave={(value) => onUpdateRow.mutate({ id: row.id, updates: { [column.dataKey]: value } })}
                                  />
                                ) : (
                                  <span>{getCellValue(row, column, index)}</span>
                                )}
                              </TableCell>
                            ))}
                            <TableCell className="px-4 py-2 text-sm text-center" style={{ textAlign: 'center', color: 'silver' }}>
                              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <div {...provided.dragHandleProps} className="cursor-grab active:cursor-grabbing mr-2">
                                  <GripVertical className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                                </div>
                                {editMode && (
                                  <>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className={`btn-glass text-primary hover:text-primary/80 ${
                                        onUpdateRow.isPending && onUpdateRow.variables?.id === row.id ? 'mutation-loading' : ''
                                      }`}
                                      onClick={() => {
                                        if (editMode) {
                                          onSelectRowForImage(row.id);
                                        } else {
                                          onSelectRowForImage('access-denied');
                                        }
                                      }}
                                      disabled={onUpdateRow.isPending && onUpdateRow.variables?.id === row.id}
                                      data-testid={`button-add-image-${row.id}`}
                                      title="Add image"
                                    >
                                      {onUpdateRow.isPending && onUpdateRow.variables?.id === row.id ? (
                                        <InlineLoading />
                                      ) : (
                                        <PlusCircle className="w-4 h-4" />
                                      )}
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className={`btn-glass text-primary hover:text-primary/80 ${
                                        onUpdateRow.isPending && onUpdateRow.variables?.id === row.id ? 'mutation-loading' : ''
                                      }`}
                                      onClick={() => {
                                        if (!editMode) {
                                          toast({
                                            title: "Access Denied",
                                            description: "Please enable Edit mode to edit row information.",
                                            variant: "destructive",
                                          });
                                          return;
                                        }
                                        setSelectedRowForInfo(row.id);
                                        setEditInfoModalOpen(true);
                                      }}
                                      disabled={onUpdateRow.isPending && onUpdateRow.variables?.id === row.id}
                                      data-testid={`button-edit-row-${row.id}`}
                                      title="Edit row info"
                                    >
                                      {onUpdateRow.isPending && onUpdateRow.variables?.id === row.id ? (
                                        <InlineLoading />
                                      ) : (
                                        <Edit className="w-4 h-4" />
                                      )}
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className={`btn-glass ${!isAuthenticated ? 'opacity-50 cursor-not-allowed' : 'text-destructive hover:text-destructive/80'} ${
                                        onDeleteRow.isPending && onDeleteRow.variables === row.id ? 'mutation-loading' : ''
                                      }`}
                                      onClick={() => isAuthenticated && handleDeleteClick(row.id)}
                                      disabled={!isAuthenticated || (onDeleteRow.isPending && onDeleteRow.variables === row.id)}
                                      data-testid={`button-delete-row-${row.id}`}
                                      title={!isAuthenticated ? "Authentication required to delete rows" : "Delete row"}
                                    >
                                      {onDeleteRow.isPending && onDeleteRow.variables === row.id ? (
                                        <InlineLoading />
                                      ) : (
                                        <Trash className="w-4 h-4" />
                                      )}
                                    </Button>
                                  </>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </Draggable>
                    ))
                  )}
                    {provided.placeholder}
                  </TableBody>
                )}
              </Droppable>
            <tfoot className="table-header-glass border-t border-border/20">
              <TableRow>
                <TableCell colSpan={3} className="px-4 py-2 table-header-footer-12px font-semibold text-foreground text-center">
                  Totals:
                </TableCell>
                {columns.slice(3).map((column) => (
                  <TableCell key={column.id} className="px-4 py-2 table-header-footer-12px font-bold text-center">
                    {column.dataKey === 'no' ? (
                      <span className="text-blue-400">{calculateColumnSum('no')}</span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                ))}
                <TableCell className="px-4 py-2"></TableCell>
              </TableRow>
            </tfoot>
          </Table>

          {/* Pagination Controls */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-border/20 bg-background/50 pagination-transition">
            <div className="flex items-center space-x-2">
              {/* Page direction indicator */}
              {pageDirection && (
                <div className="flex items-center text-xs text-muted-foreground pagination-10px mr-4">
                  {pageDirection === 'next' ? (
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
                    isPageChanging ? 'pagination-loading' : ''
                  }`}
                >
                  <ChevronsLeft className="h-4 w-4" />
                  First
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
                  
                  return pages.map(pageNum => {
                    const isCurrentPage = pageNum === currentPage;
                    
                    return (
                      <Button
                        key={pageNum}
                        variant={isCurrentPage ? "default" : "outline"}
                        size="sm"
                        onClick={() => goToPage(pageNum)}
                        disabled={isPageChanging}
                        className={`h-8 w-8 pagination-10px pagination-button ${
                          isCurrentPage ? 'active' : ''
                        } ${
                          isPageChanging ? 'pagination-loading' : ''
                        }`}
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
                    isPageChanging ? 'pagination-loading' : ''
                  }`}
                >
                  Last
                  <ChevronsRight className="h-4 w-4" />
                </Button>
              )}
            </div>

            <div className="text-sm text-muted-foreground pagination-10px">
              Page {currentPage} of {totalPages}
            </div>
          </div>
        </DragDropContext>
      </div>

      {/* Editable Info Modal */}
      {selectedRowForInfo && (
        <EditableInfoModal
          open={editInfoModalOpen}
          onOpenChange={setEditInfoModalOpen}
          info={rows.find(row => row.id === selectedRowForInfo)?.info || ''}
          rowId={selectedRowForInfo}
          code={rows.find(row => row.id === selectedRowForInfo)?.code || ''}
          location={rows.find(row => row.id === selectedRowForInfo)?.location || ''}
          onSave={handleSaveInfo}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this row? This action cannot be undone.
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
