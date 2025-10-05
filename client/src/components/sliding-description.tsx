import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronDown, ChevronRight, Edit3, Check, X } from "lucide-react";

interface SlidingDescriptionProps {
  value: string;
  onSave: (newValue: string) => void;
  isEditable?: boolean;
}

export function SlidingDescription({ value, onSave, isEditable = true }: SlidingDescriptionProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setEditValue(value);
  }, [value]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSave = () => {
    onSave(editValue);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(value);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  const toggleExpanded = () => {
    if (!isEditing) {
      setIsExpanded(!isExpanded);
    }
  };

  const displayValue = value || "No information available";
  const shouldShowToggle = displayValue.length > 50;
  const truncatedValue = shouldShowToggle && !isExpanded 
    ? displayValue.substring(0, 50) + "..." 
    : displayValue;

  return (
    <div className="space-y-2">
      <div className="flex items-start gap-2">
        {shouldShowToggle && (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 flex-shrink-0 mt-0.5"
            onClick={toggleExpanded}
            data-testid="button-toggle-description"
          >
            {isExpanded ? (
              <ChevronDown className="w-3 h-3" />
            ) : (
              <ChevronRight className="w-3 h-3" />
            )}
          </Button>
        )}
        
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <div className="flex items-center gap-2">
              <Input
                ref={inputRef}
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onKeyDown={handleKeyDown}
                className="text-sm"
                placeholder="Enter description..."
              />
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 text-green-600 hover:text-green-700"
                onClick={handleSave}
                data-testid="button-save-description"
              >
                <Check className="w-3 h-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                onClick={handleCancel}
                data-testid="button-cancel-description"
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          ) : (
            <div className="flex items-start gap-2 group">
              <div 
                className={`text-sm flex-1 cursor-pointer transition-all duration-300 ease-in-out ${
                  isExpanded ? 'opacity-100' : 'opacity-90'
                }`}
                onClick={toggleExpanded}
              >
                <div className="whitespace-pre-wrap break-words text-[13px]">
                  {truncatedValue}
                </div>
              </div>
              
              {isEditable && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex-shrink-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsEditing(true);
                  }}
                  data-testid="button-edit-description"
                >
                  <Edit3 className="w-3 h-3 text-blue-600" />
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
      {/* Sliding animation container */}
      <div 
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        {shouldShowToggle && isExpanded && !isEditing && (
          <div className="pl-8 text-xs text-muted-foreground">
            Click to collapse
          </div>
        )}
      </div>
    </div>
  );
}