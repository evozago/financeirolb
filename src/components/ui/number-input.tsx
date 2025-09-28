import React, { forwardRef, useState } from 'react';
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
    const [isFocused, setIsFocused] = useState(false);
    const [inputStr, setInputStr] = useState<string>('');

    const formatNumber = (num: number): string => {
      if (decimals > 0) {
        return num.toFixed(decimals).replace('.', ',');
      }
      return num.toString();
    };

    const parseNumber = (text: string): number | undefined => {
      if (!text) return undefined;
      const normalizedText = text.replace(',', '.');
      const parsed = parseFloat(normalizedText);
      return isNaN(parsed) ? undefined : parsed;
    };

    const clamp = (num: number): number => {
      let final = num;
      if (min !== undefined && final < min) final = min;
      if (max !== undefined && final > max) final = max;
      return final;
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value;
      if (raw === '') {
        setInputStr('');
        onValueChange?.(undefined);
        return;
      }
      const numericRegex = decimals > 0 ? /^-?\d*[,.]?\d*$/ : /^-?\d*$/;
      if (!numericRegex.test(raw)) return;

      setInputStr(raw);
      const parsed = parseNumber(raw);
      if (parsed === undefined) {
        onValueChange?.(undefined);
      } else {
        onValueChange?.(parsed);
      }
    };

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true);
      if (!inputStr) {
        const initial = value !== undefined ? formatNumber(value) : '';
        setInputStr(initial.replace(/\./g, ','));
      }
      props.onFocus?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false);
      const parsed = parseNumber(inputStr);
      if (parsed === undefined) {
        setInputStr('');
        onValueChange?.(undefined);
      } else {
        const clamped = clamp(parsed);
        onValueChange?.(clamped);
        setInputStr('');
      }
      props.onBlur?.(e);
    };

    React.useEffect(() => {
      if (!isFocused) {
        setInputStr('');
      }
    }, [isFocused]);

    const displayValue = isFocused
      ? inputStr
      : value !== undefined
        ? formatNumber(clamp(value))
        : '';

    return (
      <Input
        ref={ref}
        type="text"
        inputMode={decimals > 0 ? "decimal" : "numeric"}
        value={displayValue}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
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