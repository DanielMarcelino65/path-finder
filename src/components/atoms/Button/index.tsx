'use client';
import { cn } from '@/lib/utils';
import React from 'react';

type ButtonProps = {
  children: React.ReactNode;
  disabled?: boolean;
} & React.HtmlHTMLAttributes<HTMLButtonElement>;

export default function Button({
  children,
  className,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        'bg-blue-500 hover:opacity-90 active:opacity-70 active:scale-[0.95] transition-all text-white py-2 px-4 rounded cursor-pointer',
        className
      )}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}
