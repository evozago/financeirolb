import React, { forwardRef, useState } from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface CurrencyInputProps extends Omit<React.ComponentProps<"input">, 'value' | 'onChange' | 'type'> {
  value?: number;
  onValueChange?: (value: number | undefined) => void;
  placeholder?: string;
}

export const CurrencyInput = forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ value, onValueChange, className, placeholder = "R$ 0,00", ...props }, ref) => {
    const [displayValue, setDisplayValue] = useState(() => 
      value !== undefined ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value) : ''
    );
    const [isFocused, setIsFocused] = useState(false);

    const formatCurrency = (amount: number): string => {
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(amount);
    };

    const parseCurrency = (text: string): number => {
      const cleanText = text.replace(/[^\d,.-]/g, '');
      const normalizedText = cleanText.replace(',', '.');
      const parsed = parseFloat(normalizedText);
      return isNaN(parsed) ? 0 : parsed;
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value;
      if (!raw) {
        setDisplayValue('');
        onValueChange?.(undefined);
        return;
      }
      const valid = /^-?\d*[,.]?\d*$/.test(raw);
      if (!valid) return;

      setDisplayValue(raw);
      const numericValue = parseCurrency(raw);
      onValueChange?.(numericValue);
    };

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true);
      if (displayValue) {
        const numericValue = parseCurrency(displayValue);
        setDisplayValue(numericValue > 0 ? numericValue.toString().replace('.', ',') : '');
      }
      props.onFocus?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false);
      if (displayValue) {
        const numericValue = parseCurrency(displayValue);
        setDisplayValue(numericValue > 0 ? formatCurrency(numericValue) : '');
      }
      props.onBlur?.(e);
    };

    React.useEffect(() => {
      if (isFocused) {
        if (value !== undefined) {
          setDisplayValue(value.toString().replace('.', ','));
        } else {
          setDisplayValue('');
        }
      } else {
        if (value !== undefined) {
          setDisplayValue(formatCurrency(value));
        } else {
          setDisplayValue('');
        }
      }
    }, [value, isFocused]);

    return (
      <Input
        ref={ref}
        type="text"
        inputMode="decimal"
        value={displayValue}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder={placeholder}
        className={cn("text-right", className)}
        {...props}
      />
    );
  }
);

CurrencyInput.displayName = 'CurrencyInput';