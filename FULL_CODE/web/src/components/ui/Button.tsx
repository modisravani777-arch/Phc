import React from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost' | 'success';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  icon,
  className = '',
  disabled,
  ...props
}) => {
  const base =
    'inline-flex items-center justify-center font-bold tracking-tight transition-all duration-200 ease-out focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none select-none active:scale-[0.98]';

  const variants = {
    primary:
      'bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white hover:from-blue-500 hover:to-indigo-500 focus:ring-blue-500/40 shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/35 hover:-translate-y-0.5 active:translate-y-0',
    secondary:
      'bg-slate-900 text-white hover:bg-slate-800 focus:ring-slate-500/30 shadow-md shadow-slate-900/15 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0',
    outline:
      'border border-slate-200/90 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300 hover:text-slate-900 focus:ring-slate-300 shadow-xs hover:shadow-md hover:-translate-y-0.5 active:translate-y-0',
    danger:
      'bg-gradient-to-r from-rose-600 to-red-600 text-white hover:from-rose-500 hover:to-red-500 focus:ring-rose-500/40 shadow-lg shadow-rose-500/25 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0',
    ghost:
      'text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus:ring-slate-200 hover:-translate-y-0.5 active:translate-y-0',
    success:
      'bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-500 hover:to-teal-500 focus:ring-emerald-500/40 shadow-lg shadow-emerald-500/25 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0',
  };

  const sizes = {
    sm: 'text-xs px-3.5 py-1.5 rounded-xl gap-1.5',
    md: 'text-xs sm:text-sm px-5 py-2.5 rounded-2xl gap-2',
    lg: 'text-sm sm:text-base px-6 py-3.5 rounded-2xl gap-2.5',
  };

  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? <Loader2 className="w-4 h-4 animate-spin text-current" /> : icon}
      {children}
    </button>
  );
};
