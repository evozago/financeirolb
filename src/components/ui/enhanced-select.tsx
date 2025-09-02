import React, { useState } from 'react';
import { Plus, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface EnhancedSelectOption {
  value: string;
  label: string;
}

interface EnhancedSelectProps {
  value?: string;
  onValueChange: (value: string) => void;
  options: EnhancedSelectOption[];
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  allowCreate?: boolean;
  createLabel?: string;
  createTitle?: string;
  createFields?: Array<{
    key: string;
    label: string;
    type?: 'text' | 'select';
    required?: boolean;
    placeholder?: string;
    options?: EnhancedSelectOption[];
  }>;
  onCreateNew?: (data: Record<string, string>) => Promise<{ id: string; label: string }>;
  onRefresh?: () => void;
}

export function EnhancedSelect({
  value,
  onValueChange,
  options,
  placeholder = "Selecione uma opção",
  className,
  disabled,
  allowCreate = true,
  createLabel = "Adicionar novo",
  createTitle = "Adicionar novo item",
  createFields = [{ key: 'name', label: 'Nome', required: true }],
  onCreateNew,
  onRefresh,
}: EnhancedSelectProps) {
  const { toast } = useToast();
  const [createDialog, setCreateDialog] = useState(false);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const handleCreateClick = () => {
    setFormData({});
    setCreateDialog(true);
  };

  const handleFormChange = (key: string, newValue: string) => {
    setFormData(prev => ({
      ...prev,
      [key]: newValue,
    }));
  };

  const handleCreate = async () => {
    // Validate required fields
    const requiredFields = createFields.filter(field => field.required);
    const missingFields = requiredFields.filter(field => !formData[field.key]?.trim());
    
    if (missingFields.length > 0) {
      toast({
        title: "Erro",
        description: `Os seguintes campos são obrigatórios: ${missingFields.map(f => f.label).join(', ')}`,
        variant: "destructive",
      });
      return;
    }

    if (!onCreateNew) {
      toast({
        title: "Erro",
        description: "Função de criação não definida",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      const newItem = await onCreateNew(formData);
      
      toast({
        title: "Sucesso",
        description: `${newItem.label} foi criado com sucesso`,
      });

      // Auto-select the new item
      onValueChange(newItem.id);
      
      // Refresh the options list
      if (onRefresh) {
        onRefresh();
      }
      
      setCreateDialog(false);
      setFormData({});
    } catch (error) {
      console.error('Error creating new item:', error);
      toast({
        title: "Erro",
        description: "Falha ao criar novo item",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="flex gap-2">
        <Select value={value} onValueChange={onValueChange} disabled={disabled}>
          <SelectTrigger className={cn("flex-1", className)}>
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent>
            {options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                <div className="flex items-center">
                  {value === option.value && <Check className="h-4 w-4 mr-2" />}
                  {option.label}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        {allowCreate && (
          <Button
            type="button"
            variant="outline"
            size="default"
            onClick={handleCreateClick}
            disabled={disabled}
            className="px-3"
          >
            <Plus className="h-4 w-4" />
          </Button>
        )}
      </div>

      <Dialog open={createDialog} onOpenChange={setCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{createTitle}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {createFields.map((field) => (
              <div key={field.key} className="space-y-2">
                <Label htmlFor={field.key}>
                  {field.label}
                  {field.required && <span className="text-destructive ml-1">*</span>}
                </Label>
                {field.type === 'select' && field.options ? (
                  <Select 
                    value={formData[field.key] || ''} 
                    onValueChange={(value) => handleFormChange(field.key, value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={field.placeholder || `Selecione ${field.label.toLowerCase()}`} />
                    </SelectTrigger>
                    <SelectContent>
                      {field.options.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    id={field.key}
                    value={formData[field.key] || ''}
                    onChange={(e) => handleFormChange(field.key, e.target.value)}
                    placeholder={field.placeholder || `Digite ${field.label.toLowerCase()}`}
                  />
                )}
              </div>
            ))}
            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setCreateDialog(false)}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button onClick={handleCreate} disabled={loading}>
                {loading ? "Criando..." : "Criar"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}