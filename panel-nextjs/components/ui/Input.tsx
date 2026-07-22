'use client';

import { InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', label, error, id, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={id} className="block text-sm font-semibold text-gray-700 mb-2">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={id}
          className={`w-full px-4 py-3 border-2 border-gray-200 rounded-xl shadow-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all duration-200 ${
            error ? 'border-red-500 focus:border-red-500 focus:ring-red-100' : ''
          } ${className}`}
          {...props}
        />
        {error && (
          <div className="flex items-center gap-2 mt-2">
            <span className="text-red-500">⚠️</span>
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
