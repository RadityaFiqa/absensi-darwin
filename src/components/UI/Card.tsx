import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, className = '', hoverable = false, ...props }) => {
  return (
    <div
      className={`bg-white dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-900 rounded-3xl p-5 shadow-sm ${
        hoverable ? 'transition-all duration-200 hover:shadow-md hover:border-zinc-200 dark:hover:border-zinc-800 hover:scale-[1.01]' : ''
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export default Card;
