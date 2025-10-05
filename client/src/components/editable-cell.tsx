import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface EditableCellProps {
  value: any;
  type: string;
  onSave: (value: any) => void;
  options?: string[];
  dataKey?: string;
}

export function EditableCell({ value, type, onSave, options, dataKey }: EditableCellProps) {
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
    let processedValue = editValue;
    
    if (type === 'number') {
      processedValue = parseInt(editValue) || 0;
    } else if (type === 'currency') {
      processedValue = parseFloat(editValue.toString().replace(/[^0-9.]/g, '')) || 0;
      processedValue = processedValue.toFixed(2);
    }
    
    onSave(processedValue);
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

  const getPlaceholder = () => {
    if (dataKey === 'latitude') {
      return "e.g. 3.139003 (decimal degrees)";
    }
    if (dataKey === 'longitude') {
      return "e.g. 101.686855 (decimal degrees)";
    }
    if (type === 'currency') {
      return "0.00";
    }
    if (type === 'number') {
      return "Enter number";
    }
    return undefined;
  };

  if (isEditing) {
    if (type === 'select' && options) {
      return (
        <Select 
          value={editValue} 
          onValueChange={(newValue) => {
            setEditValue(newValue);
            onSave(newValue);
            setIsEditing(false);
          }}
        >
          <SelectTrigger className="w-full h-6 px-2 py-1 text-sm bg-transparent border-transparent">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {options.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }
    
    return (
      <Input
        ref={inputRef}
        type={type === 'number' || type === 'currency' ? 'number' : 'text'}
        step={type === 'currency' ? '0.01' : undefined}
        value={type === 'currency' ? editValue.toString().replace(/[^0-9.]/g, '') : editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        placeholder={getPlaceholder()}
        className="w-full h-6 px-2 py-1 text-sm cell-editing glass-input border-none"
        data-testid="input-editable-cell"
      />
    );
  }

  return (
    <span
      onClick={() => setIsEditing(true)}
      className="cursor-pointer hover:bg-muted/50 rounded px-1 py-0.5 transition-colors"
      data-testid="text-editable-cell"
    >
      {value}
    </span>
  );
}
