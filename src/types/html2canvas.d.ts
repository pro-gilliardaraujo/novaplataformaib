// Type definitions for html2canvas 
// Project: https://github.com/niklasvh/html2canvas
// Definitions extend: @types/html2canvas

import html2canvas from 'html2canvas';

declare module 'html2canvas' {
  interface Html2CanvasOptions {
    scale?: number;
    backgroundColor?: string;
    windowWidth?: number;
  }
}
