'use client';

import * as React from 'react';
import { cn } from '../utils';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          'flex min-h-[80px] w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-foreground placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#00A0B5]/30 focus:border-[#00A0B5] disabled:cursor-not-allowed disabled:opacity-50 transition-all',
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Textarea.displayName = 'Textarea';

export { Textarea };
