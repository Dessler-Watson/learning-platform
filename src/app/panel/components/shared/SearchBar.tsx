'use client';

import { Search } from 'lucide-react';
import { Input } from '../../ui/input';
import { cn } from '../../utils';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function SearchBar({ value, onChange, placeholder = 'Buscar...', className }: SearchBarProps) {
  return (
    <div className={cn('relative group', className)}>
      <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
        <Search className="h-4 w-4 text-[#00A0B5]/50 group-focus-within:text-[#00A0B5] transition-colors duration-200" />
      </div>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="pl-11 bg-white/80 backdrop-blur-sm search-glow border-[#00A0B5]/20 focus:border-[#00A0B5]/40"
      />
      {value && (
        <button
          onClick={() => onChange('')}
          className="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-300 hover:text-gray-500 transition-colors"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}
