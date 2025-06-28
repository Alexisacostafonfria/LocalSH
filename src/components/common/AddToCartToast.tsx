
"use client";

import React from 'react';
import Image from 'next/image';
import { ShoppingCart } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useAddToCartToast } from '@/context/ToastContext';
import { cn } from '@/lib/utils';

export const AddToCartToast = () => {
  const { toastInfo } = useAddToCartToast();

  return (
    <div
      key={toastInfo?.key}
      className={cn(
        'fixed bottom-6 right-6 z-[100] transition-all duration-500 ease-in-out',
        toastInfo ? 'translate-x-0 opacity-100' : 'translate-x-[calc(100%+24px)] opacity-0'
      )}
    >
      {toastInfo && (
        <Card className="w-80 shadow-2xl bg-card border-primary/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="relative w-16 h-16 rounded-md overflow-hidden bg-muted flex-shrink-0">
                <Image
                  src={toastInfo.imageUrl || `https://placehold.co/100x100.png?text=${encodeURIComponent(toastInfo.productName[0])}`}
                  alt={toastInfo.productName}
                  layout="fill"
                  objectFit="cover"
                  data-ai-hint="product image thumbnail"
                />
              </div>
              <div className="flex-grow overflow-hidden">
                <p className="text-sm font-semibold truncate text-foreground">{toastInfo.productName}</p>
                <p className="text-xs text-muted-foreground">Cantidad: {toastInfo.quantity}</p>
                <div className="flex items-center gap-2 mt-2 text-primary font-medium">
                  <ShoppingCart className="h-4 w-4" />
                  <p>Añadido al carrito</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
