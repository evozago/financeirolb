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
      value ? formatCurrency(value) : ''
    );

    const formatCurrency = (amount: number): string => {
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(amount);
    };

    const parseCurrency = (text: string): number => {
      // Remove tudo exceto números, vírgula e ponto
      const cleanText = text.replace(/[^\d,.-]/g, '');
      
      // Substitui vírgula por ponto para parsing
      const normalizedText = cleanText.replace(',', '.');
      
      // Parse para float
      const parsed = parseFloat(normalizedText);
      
      return isNaN(parsed) ? 0 : parsed;
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value;
      
      // Se o campo está sendo limpo
      if (!inputValue) {
        setDisplayValue('');
        onValueChange?.(undefined);
        return;
      }

      // Parse do valor inserido
      const numericValue = parseCurrency(inputValue);
      
      // Formatar para exibição
      const formatted = formatCurrency(numericValue);
      setDisplayValue(formatted);
      
      // Callback com valor numérico
      onValueChange?.(numericValue);
    };

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      // Ao focar, remove formatação para facilitar edição
      if (displayValue) {
        const numericValue = parseCurrency(displayValue);
        if (numericValue > 0) {
          setDisplayValue(numericValue.toString().replace('.', ','));
        }
      }
      props.onFocus?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      // Ao sair do foco, aplica formatação completa
      if (displayValue) {
        const numericValue = parseCurrency(displayValue);
        if (numericValue > 0) {
          setDisplayValue(formatCurrency(numericValue));
        } else {
          setDisplayValue('');
        }
      }
      props.onBlur?.(e);
    };

    // Sincronizar quando valor externo muda
    React.useEffect(() => {
      if (value !== undefined && value > 0) {
        setDisplayValue(formatCurrency(value));
      } else {
        setDisplayValue('');
      }
    }, [value]);

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