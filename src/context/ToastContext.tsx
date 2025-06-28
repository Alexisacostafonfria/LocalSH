
"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode, useRef, useEffect } from 'react';

interface ToastInfo {
  key: number;
  productName: string;
  imageUrl?: string;
  quantity: number;
}

interface ToastContextType {
  showToast: (info: Omit<ToastInfo, 'key'>) => void;
  toastInfo: ToastInfo | null;
}

const AddToCartToastContext = createContext<ToastContextType | undefined>(undefined);

export const useAddToCartToast = (): ToastContextType => {
  const context = useContext(AddToCartToastContext);
  if (!context) {
    throw new Error('useAddToCartToast must be used within a AddToCartToastProvider');
  }
  return context;
};

export const AddToCartToastProvider = ({ children }: { children: ReactNode }) => {
  const [toastInfo, setToastInfo] = useState<ToastInfo | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const showToast = useCallback((info: Omit<ToastInfo, 'key'>) => {
    // If a toast is already showing, clear its timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    // Set the new toast immediately
    setToastInfo({ ...info, key: Date.now() });

    // Set a new timeout to clear this toast
    timeoutRef.current = setTimeout(() => {
      setToastInfo(null);
      timeoutRef.current = null;
    }, 3000); // Toast visible for 3 seconds
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <AddToCartToastContext.Provider value={{ showToast, toastInfo }}>
      {children}
    </AddToCartToastContext.Provider>
  );
};
