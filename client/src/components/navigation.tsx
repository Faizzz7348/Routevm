import { Button } from "@/components/ui/button";
import { Database, Settings, Save, DoorOpen, Rows, Receipt, Layout } from "lucide-react";
import { AddColumnModal } from "./add-column-modal";

interface NavigationProps {
  editMode?: boolean;
  onEditModeRequest?: () => void;
  onShowCustomization?: () => void;
  onAddRow?: () => void;
  onSaveData?: () => void;
  onGenerateTng?: () => void;
  onAddColumn?: (columnData: { name: string; dataKey: string; type: string; options?: string[] }) => Promise<void>;
  onOptimizeRoute?: () => void;
  onCalculateTolls?: () => void;
  onSaveLayout?: () => void;
  isAuthenticated?: boolean;
}

export function Navigation({ editMode, onEditModeRequest, onShowCustomization, onAddRow, onSaveData, onGenerateTng, onAddColumn, onOptimizeRoute, onCalculateTolls, onSaveLayout, isAuthenticated }: NavigationProps) {

  return (
    <nav className="sticky top-0 z-50 w-full border-b-2 border-blue-500/50 dark:border-blue-400/50 bg-gradient-to-r from-blue-500/10 via-blue-600/10 to-blue-700/10 dark:from-blue-500/20 dark:via-blue-600/20 dark:to-blue-700/20 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-lg shadow-blue-500/20">
      <div className="container mx-auto px-4">
        <div className="flex h-14 items-center justify-between text-[12px]">
          {/* Logo/Brand */}
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 dark:bg-blue-500 text-white">
                <Database className="h-4 w-4" />
              </div>
              <span className="font-bold text-slate-600 dark:text-slate-300" style={{ fontSize: '14px' }}>
                {editMode ? "Edit Mode" : "Route Management"}
              </span>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center space-x-1 md:space-x-2">
            <Button
              onClick={onEditModeRequest}
              variant="outline"
              size="sm"
              className="btn-glass w-8 h-8 md:w-20 md:h-9 p-0 md:px-3 pagination-button transition-smooth-with-color hover:scale-110 active:scale-95"
              data-testid="button-edit-mode"
              title={editMode ? "Exit edit mode" : "Enter edit mode"}
            >
              {editMode ? (
                <>
                  <DoorOpen className="w-3 h-3 text-red-500 transition-smooth-fast" />
                  <span className="hidden md:inline ml-2 text-xs">Exit</span>
                </>
              ) : (
                <>
                  <Settings className="w-3 h-3 transition-smooth-fast" />
                  <span className="hidden md:inline ml-2 text-xs">Edit</span>
                </>
              )}
            </Button>
            {editMode && (
              <Button
                onClick={onCalculateTolls}
                variant="outline"
                size="sm"
                className="btn-glass w-8 h-8 md:w-20 md:h-9 p-0 md:px-3 pagination-button transition-smooth-fast animate-in fade-in-0 slide-in-from-left-2"
                data-testid="button-calculate-tolls"
                title="Calculate toll prices from Google Maps"
              >
                <Receipt className="w-3 h-3 text-green-500" />
                <span className="hidden md:inline ml-2 text-xs">Tolls</span>
              </Button>
            )}
            {editMode && (
              <Button
                onClick={onAddRow}
                variant="outline"
                size="sm"
                className="btn-glass w-8 h-8 md:w-24 md:h-9 p-0 md:px-3 pagination-button transition-smooth-fast animate-in fade-in-0 slide-in-from-left-2"
                data-testid="button-add-row"
                title="Add new route"
              >
                <Rows className="w-3 h-3" />
                <span className="hidden md:inline ml-2 text-xs">Add Row</span>
              </Button>
            )}
            {editMode && onAddColumn && (
              <div className="animate-in fade-in-0 slide-in-from-left-2">
                <AddColumnModal
                  onCreateColumn={onAddColumn}
                  disabled={!isAuthenticated}
                />
              </div>
            )}
            {editMode && (
              <Button
                onClick={onSaveData}
                variant="outline"
                size="sm"
                className="btn-glass w-8 h-8 md:w-20 md:h-9 p-0 md:px-3 pagination-button transition-smooth-fast animate-in fade-in-0 slide-in-from-left-2"
                data-testid="button-save-data"
                title="Apply changes"
              >
                <Save className="w-3 h-3" />
                <span className="hidden md:inline ml-2 text-xs">Save</span>
              </Button>
            )}
            <Button
              onClick={onSaveLayout}
              variant="outline"
              size="sm"
              className="btn-glass w-8 h-8 md:w-20 md:h-9 p-0 md:px-3 pagination-button"
              data-testid="button-save-layout"
              title="Save column layout"
            >
              <Layout className="w-3 h-3 text-blue-500 dark:text-blue-400" />
              <span className="hidden md:inline ml-2 text-xs">Layout</span>
            </Button>
          </div>
        </div>

      </div>
    </nav>
  );
}