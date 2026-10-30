import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'blue' | 'teal' | 'green' | 'amber' | 'rose' | 'red' | 'slate' | 'purple' | 'pink';
  size?: 'sm' | 'md';
  dot?: boolean;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'blue',
  size = 'md',
  dot = false,
  className = '',
}) => {
  const variantStyles = {
    blue: 'bg-gradient-to-r from-blue-50 to-indigo-50 text-brand-700 border-brand-200/60 shadow-sm shadow-brand-100/50',
    teal: 'bg-gradient-to-r from-emerald-50 to-teal-50 text-accent-700 border-accent-200/60 shadow-sm shadow-accent-100/50',
    green:
      'bg-gradient-to-r from-emerald-50 to-teal-50 text-accent-700 border-accent-200/60 shadow-sm shadow-accent-100/50',
    amber:
      'bg-gradient-to-r from-amber-50 to-yellow-50 text-amber-700 border-amber-200/60 shadow-sm shadow-amber-100/50',
    rose: 'bg-gradient-to-r from-rose-50 to-pink-50 text-rose-700 border-rose-200/60 shadow-sm shadow-rose-100/50',
    red: 'bg-gradient-to-r from-rose-50 to-pink-50 text-rose-700 border-rose-200/60 shadow-sm shadow-rose-100/50',
    pink: 'bg-gradient-to-r from-pink-50 to-rose-50 text-pink-700 border-pink-200/60 shadow-sm shadow-pink-100/50',
    slate:
      'bg-gradient-to-r from-slate-50 to-gray-50 text-slate-700 border-slate-200/60 shadow-sm shadow-slate-100/50',
    purple:
      'bg-gradient-to-r from-purple-50 to-violet-50 text-purple-700 border-purple-200/60 shadow-sm shadow-purple-100/50',
  };

  const dotColors = {
    blue: 'bg-brand-500',
    teal: 'bg-accent-500',
    green: 'bg-accent-500',
    amber: 'bg-amber-500',
    rose: 'bg-rose-500',
    red: 'bg-rose-500',
    pink: 'bg-pink-500',
    slate: 'bg-slate-500',
    purple: 'bg-purple-500',
  };

  const sizeStyles = {
    sm: 'px-2 py-0.5 text-[10px]',
    md: 'px-2.5 py-1 text-xs',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border font-bold tracking-wide transition-all duration-200 ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${dotColors[variant]} dot-pulse`} />}
      {children}
    </span>
  );
};
