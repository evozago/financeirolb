import React, { forwardRef } from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface NumberInputProps extends Omit<React.ComponentProps<"input">, 'value' | 'onChange' | 'type'> {
  value?: number;
  onValueChange?: (value: number | undefined) => void;
  min?: number;
  max?: number;
  step?: number;
  decimals?: number;
  placeholder?: string;
}

export const NumberInput = forwardRef<HTMLInputElement, NumberInputProps>(
  ({ 
    value, 
    onValueChange, 
    min, 
    max, 
    step = 1, 
    decimals = 0,
    className, 
    placeholder = "",
    ...props 
  }, ref) => {
    
    const formatNumber = (num: number): string => {
      if (decimals > 0) {
        return num.toFixed(decimals).replace('.', ',');
      }
      return num.toString();
    };

    const parseNumber = (text: string): number => {
      if (!text) return 0;
      
      // Substitui vírgula por ponto para parsing
      const normalizedText = text.replace(',', '.');
      const parsed = parseFloat(normalizedText);
      
      return isNaN(parsed) ? 0 : parsed;
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value;
      
      // Se o campo está sendo limpo
      if (!inputValue) {
        onValueChange?.(undefined);
        return;
      }

      // Validar formato numérico
      const numericRegex = decimals > 0 ? /^-?\d*[,.]?\d*$/ : /^-?\d*$/;
      
      if (numericRegex.test(inputValue)) {
        const numericValue = parseNumber(inputValue);
        
        // Aplicar limites se especificados
        let finalValue = numericValue;
        if (min !== undefined && finalValue < min) finalValue = min;
        if (max !== undefined && finalValue > max) finalValue = max;
        
        onValueChange?.(finalValue);
      }
    };

    const displayValue = value !== undefined ? formatNumber(value) : '';

    return (
      <Input
        ref={ref}
        type="text"
        inputMode={decimals > 0 ? "decimal" : "numeric"}
        value={displayValue}
        onChange={handleChange}
        placeholder={placeholder}
        min={min}
        max={max}
        step={step}
        className={cn("text-right", className)}
        {...props}
      />
    );
  }
);

NumberInput.displayName = 'NumberInput';