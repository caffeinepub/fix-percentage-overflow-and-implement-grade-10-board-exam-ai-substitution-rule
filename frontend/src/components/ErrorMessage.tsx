import React from 'react';
import { AlertTriangle, Info, RefreshCw, XCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

interface ErrorMessageProps {
  title?: string;
  message: string;
  variant?: 'error' | 'warning' | 'info';
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
}

export function ErrorMessage({
  title,
  message,
  variant = 'error',
  onRetry,
  retryLabel = 'Try Again',
  className = '',
}: ErrorMessageProps) {
  const icons = {
    error: <XCircle className="h-4 w-4" />,
    warning: <AlertTriangle className="h-4 w-4" />,
    info: <Info className="h-4 w-4" />,
  };

  const alertVariant = variant === 'error' ? 'destructive' : 'default';

  const defaultTitles = {
    error: 'Error',
    warning: 'Warning',
    info: 'Information',
  };

  return (
    <Alert variant={alertVariant} className={className}>
      {icons[variant]}
      <AlertTitle>{title || defaultTitles[variant]}</AlertTitle>
      <AlertDescription className="flex flex-col gap-2">
        <span>{message}</span>
        {onRetry && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRetry}
            className="w-fit mt-1"
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            {retryLabel}
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
}
