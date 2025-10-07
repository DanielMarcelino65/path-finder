'use client';
import React from 'react';

type ButtonProps = {
  children: React.ReactNode;
} & React.HtmlHTMLAttributes<HTMLButtonElement>;

export default function Button({ children, ...props }: ButtonProps) {
  return (
    <button
      className="bg-blue-500 hover:opacity-90 active:opacity-70 transition-all text-white py-2 px-4 rounded cursor-pointer"
      {...props}
    >
      {children}
    </button>
  );
}
