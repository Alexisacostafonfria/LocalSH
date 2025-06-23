
"use client";

import React, { useEffect, useRef, useState } from 'react';
import JsBarcode from 'jsbarcode';

interface ProductBarcodeProps {
  productId: string;
  className?: string;
  barcodeWidth?: number;
  barcodeHeight?: number;
  barcodeFontSize?: number;
  barcodeTextMargin?: number;
  barcodeMargin?: number;
  printMode?: boolean; // Nueva prop para modo impresión
}

const ProductBarcode: React.FC<ProductBarcodeProps> = ({ 
  productId, 
  className,
  barcodeWidth = 4, // Predeterminado para pantalla
  barcodeHeight = 70,  // Predeterminado para pantalla
  barcodeFontSize = 88, // Predeterminado para pantalla
  barcodeTextMargin = 2, // Predeterminado para pantalla
  barcodeMargin = 0,    // Predeterminado para pantalla
  printMode = false,    // Valor predeterminado para printMode
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [lineColor, setLineColor] = useState<string>('hsl(0 0% 0%)'); 

  useEffect(() => {
    if (printMode) {
      setLineColor('#000000'); // Forzar negro para impresión
    } else if (typeof window !== 'undefined') {
      const computedStyle = getComputedStyle(document.documentElement);
      const cardFgHsl = computedStyle.getPropertyValue('--card-foreground').trim();
      const fgHsl = computedStyle.getPropertyValue('--foreground').trim();
      
      let determinedColor = 'hsl(0 0% 0%)'; 

      const parseHsl = (hslStr: string): string | null => {
        if (!hslStr) return null;
        const hslMatch = hslStr.match(/(\d{1,3})\s*(\d{1,3})%\s*(\d{1,3})%/);
        if (hslMatch) {
          return `hsl(${hslMatch[1]}, ${hslMatch[2]}%, ${hslMatch[3]}%)`;
        }
        return hslStr; 
      };

      const parsedCardFg = parseHsl(cardFgHsl);
      const parsedFg = parseHsl(fgHsl);

      if (parsedCardFg && parsedCardFg !== 'hsl(0, 0%, 0%)') {
        determinedColor = parsedCardFg;
      } else if (parsedFg) {
        determinedColor = parsedFg;
      } else {
        determinedColor = 'black';
      }
      setLineColor(determinedColor);
    }
  }, [printMode]); // Re-ejecutar si printMode cambia

  useEffect(() => {
    // Eliminar guiones y luego truncar a 16 caracteres
    const cleanId = productId ? productId.replace(/-/g, '') : "";
    const truncatedProductId = cleanId.substring(0, 16);

    if (svgRef.current && truncatedProductId && lineColor && (printMode || lineColor !== 'hsl(0 0% 0%)')) {
      try {
        JsBarcode(svgRef.current, truncatedProductId, {
          format: 'CODE128',
          lineColor: lineColor,
          background: 'transparent',
          width: barcodeWidth, 
          height: barcodeHeight, 
          displayValue: true, 
          fontOptions: "bold",
          fontSize: barcodeFontSize, 
          textMargin: barcodeTextMargin, 
          margin: barcodeMargin, 
        });
      } catch (e) {
        console.error("Error generating barcode for ID (cleaned, truncated):", truncatedProductId, e);
        if (svgRef.current) {
          svgRef.current.innerHTML = ''; 
          const textElement = document.createElementNS("http://www.w3.org/2000/svg", "text");
          textElement.setAttribute("x", "50%"); 
          textElement.setAttribute("y", "50%"); 
          textElement.setAttribute("dy", ".35em"); 
          textElement.setAttribute("fill", lineColor); 
          const errorFontSize = barcodeFontSize / 3 > 10 ? barcodeFontSize / 3 : (printMode ? 10 : 12) ;
          textElement.setAttribute("font-size", String(errorFontSize)); 
          textElement.setAttribute("text-anchor", "middle"); 
          textElement.setAttribute("dominant-baseline", "middle");
          textElement.textContent = "Error código"; 
          svgRef.current.appendChild(textElement);
          
          const errorSvgWidth = (barcodeWidth * truncatedProductId.length * 1.5) + (barcodeMargin * 2) + 50; 
          const errorSvgHeight = barcodeHeight + errorFontSize + barcodeTextMargin + (barcodeMargin * 2) + (printMode ? 5 : 10); 
          svgRef.current.setAttribute("width", String(errorSvgWidth)); 
          svgRef.current.setAttribute("height", String(errorSvgHeight));
          svgRef.current.setAttribute("viewBox", `0 0 ${errorSvgWidth} ${errorSvgHeight}`);
        }
      }
    } else if (svgRef.current) {
      svgRef.current.innerHTML = ''; 
    }
  }, [productId, lineColor, barcodeWidth, barcodeHeight, barcodeFontSize, barcodeTextMargin, barcodeMargin, printMode]);

  return (
    <div className={className}>
      <svg ref={svgRef}></svg>
    </div>
  );
};

export default ProductBarcode;
