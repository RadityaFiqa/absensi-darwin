import React from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className = "",
      label,
      error,
      leftIcon,
      rightIcon,
      type = "text",
      ...props
    },
    ref
  ) => {
    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 tracking-wide">
            {label}
          </label>
        )}
        <div className="relative flex items-center w-full">
          {leftIcon && (
            <span className="absolute left-4 text-zinc-400 dark:text-zinc-500 pointer-events-none">
              {leftIcon}
            </span>
          )}

          <input
            ref={ref}
            type={type}
            className={`w-full rounded-2xl border text-sm transition-all duration-200 focus:outline-none focus:ring-2 bg-zinc-50 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 text-zinc-950 dark:text-zinc-50 placeholder-zinc-400 dark:placeholder-zinc-600 focus:border-blue-500 focus:ring-blue-500/20 py-3.5 ${
              leftIcon ? "pl-11" : "pl-4"
            } ${rightIcon ? "pr-11" : "pr-4"} ${
              error
                ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                : ""
            } ${className}`}
            {...props}
          />

          {rightIcon && (
            <span className="absolute right-4 text-zinc-400 dark:text-zinc-500">
              {rightIcon}
            </span>
          )}
        </div>
        {error && (
          <span className="text-xs font-semibold text-red-500 pl-1">
            {error}
          </span>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
export default Input;
