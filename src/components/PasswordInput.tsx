import React, { useState, forwardRef } from "react";
import { Eye, EyeOff } from "lucide-react";

export interface PasswordInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  wrapperClassName?: string;
  iconClassName?: string;
}

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className = "", wrapperClassName = "", iconClassName = "", ...props }, ref) => {
    const [isVisible, setIsVisible] = useState(false);

    return (
      <div className={`relative flex items-center w-full ${wrapperClassName}`}>
        <input
          ref={ref}
          type={isVisible ? "text" : "password"}
          className={`w-full pr-11 ${className}`}
          {...props}
        />
        <button
          type="button"
          tabIndex={-1}
          onClick={() => setIsVisible((prev) => !prev)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-navy-deep/40 hover:text-navy-deep transition-colors p-1 rounded focus:outline-none focus:ring-1 focus:ring-gold cursor-pointer"
          aria-label={isVisible ? "Hide password" : "Show password"}
          title={isVisible ? "Hide password" : "Show password"}
        >
          {isVisible ? (
            <EyeOff className={`h-4.5 w-4.5 ${iconClassName}`} />
          ) : (
            <Eye className={`h-4.5 w-4.5 ${iconClassName}`} />
          )}
        </button>
      </div>
    );
  }
);

PasswordInput.displayName = "PasswordInput";
