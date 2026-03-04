import { Loader2 } from "lucide-react";
import React from "react";

interface LoadingStateProps {
  message?: string;
  size?: "sm" | "md" | "lg";
  fullScreen?: boolean;
  className?: string;
}

export function LoadingState({
  message = "Loading...",
  size = "md",
  fullScreen = false,
  className = "",
}: LoadingStateProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-8 w-8",
    lg: "h-12 w-12",
  };

  const textSizeClasses = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
  };

  const containerClasses = fullScreen
    ? "fixed inset-0 flex flex-col items-center justify-center bg-background z-50"
    : `flex flex-col items-center justify-center min-h-[200px] p-6 ${className}`;

  return (
    <div className={containerClasses}>
      <Loader2
        className={`${sizeClasses[size]} animate-spin text-primary mb-3`}
      />
      {message && (
        <p className={`${textSizeClasses[size]} text-muted-foreground`}>
          {message}
        </p>
      )}
    </div>
  );
}
