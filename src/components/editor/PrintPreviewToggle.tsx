// src/components/editor/PrintPreviewToggle.tsx
// PURPOSE: Toggle between Print View (page breaks/margins) and Web View (continuous scroll)
// ACTION: Provides a button to switch viewing modes and applies appropriate styles
// MECHANISM: Uses CSS classes and state to toggle between modes

'use client';

import { useState, createContext, useContext, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { BookOpen, Monitor, Printer } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';

// ═══════════════════════════════════════════
// CONTEXT
// ═══════════════════════════════════════════

interface PrintPreviewContextType {
  isPrintView: boolean;
  toggleView: () => void;
  setIsPrintView: (value: boolean) => void;
}

const PrintPreviewContext = createContext<PrintPreviewContextType | null>(null);

export function usePrintPreview() {
  const context = useContext(PrintPreviewContext);
  if (!context) {
    throw new Error('usePrintPreview must be used within PrintPreviewProvider');
  }
  return context;
}

// ═══════════════════════════════════════════
// PROVIDER
// ═══════════════════════════════════════════

export function PrintPreviewProvider({ children }: { children: ReactNode }) {
  const [isPrintView, setIsPrintView] = useState(false);

  const toggleView = () => setIsPrintView(prev => !prev);

  return (
    <PrintPreviewContext.Provider value={{ isPrintView, toggleView, setIsPrintView }}>
      <div className={isPrintView ? 'print-view-active' : 'web-view-active'}>
        {children}
      </div>
    </PrintPreviewContext.Provider>
  );
}

// ═══════════════════════════════════════════
// TOGGLE BUTTON
// ═══════════════════════════════════════════

export function PrintPreviewToggle() {
  const { isPrintView, toggleView } = usePrintPreview();
  const t = useTranslations('Editor');

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={isPrintView ? "secondary" : "outline"}
            size="sm"
            onClick={toggleView}
            className="gap-2 transition-all"
          >
            <AnimatePresence mode="wait" initial={false}>
              {isPrintView ? (
                <motion.div
                  key="print"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="flex items-center gap-2"
                >
                  <Printer className="h-4 w-4" />
                  <span className="hidden sm:inline">{t('printView')}</span>
                </motion.div>
              ) : (
                <motion.div
                  key="web"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="flex items-center gap-2"
                >
                  <Monitor className="h-4 w-4" />
                  <span className="hidden sm:inline">{t('webView')}</span>
                </motion.div>
              )}
            </AnimatePresence>
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p className="text-xs">
            {isPrintView ? t('switchToWebView') : t('switchToPrintView')}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// ═══════════════════════════════════════════
// PRINT VIEW WRAPPER
// ═══════════════════════════════════════════

interface PrintViewWrapperProps {
  children: ReactNode;
  pageWidth?: number; // in mm
  pageHeight?: number; // in mm
  showPageNumbers?: boolean;
}

export function PrintViewWrapper({ 
  children, 
  pageWidth = 152, 
  pageHeight = 229,
  showPageNumbers = true 
}: PrintViewWrapperProps) {
  const { isPrintView } = usePrintPreview();

  if (!isPrintView) {
    // Web view: continuous scroll
    return <div className="web-view">{children}</div>;
  }

  // Print view: paginated with margins
  return (
    <div className="print-view-container">
      <div 
        className="print-view-page-mock"
        style={{
          '--page-width': `${pageWidth}mm`,
          '--page-height': `${pageHeight}mm`,
        } as React.CSSProperties}
      >
        {children}
        {showPageNumbers && (
          <div className="print-view-page-number">1</div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════
// CSS (add to globals.css)
// ═══════════════════════════════════════════

export const PRINT_PREVIEW_CSS = `
/* Print View Mode Styles */
.print-view-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2rem;
  padding: 2rem;
  background: #e5e5e5;
  min-height: 100vh;
}

.dark .print-view-container {
  background: #1e1e1e;
}

.print-view-page-mock {
  width: var(--page-width, 152mm);
  min-height: var(--page-height, 229mm);
  background: white;
  box-shadow: 
    0 1px 3px rgba(0, 0, 0, 0.12),
    0 4px 12px rgba(0, 0, 0, 0.08);
  padding: 20mm 15mm;
  position: relative;
  page-break-after: always;
}

.dark .print-view-page-mock {
  background: #2a2a2a;
  box-shadow: 
    0 1px 3px rgba(0, 0, 0, 0.3),
    0 4px 12px rgba(0, 0, 0, 0.2);
}

/* Page number indicator */
.print-view-page-number {
  position: absolute;
  bottom: 10mm;
  left: 50%;
  transform: translateX(-50%);
  font-family: var(--font-serif, 'Crimson Pro');
  font-size: 10pt;
  color: #666;
}

/* Margin guides (optional - visible in print view) */
.print-view-active .print-margin-guide {
  position: absolute;
  border: 1px dashed rgba(0, 0, 0, 0.1);
  pointer-events: none;
}

.print-view-active .print-margin-guide.top {
  top: 20mm;
  left: 15mm;
  right: 15mm;
  height: 0;
}

.print-view-active .print-margin-guide.bottom {
  bottom: 20mm;
  left: 15mm;
  right: 15mm;
  height: 0;
}

/* Page break indicator */
.print-view-active .page-break-indicator {
  display: block;
  border-top: 2px dashed #ccc;
  margin: 2rem 0;
  position: relative;
}

.print-view-active .page-break-indicator::after {
  content: 'Page Break';
  position: absolute;
  top: -10px;
  left: 50%;
  transform: translateX(-50%);
  background: #e5e5e5;
  padding: 0 0.5rem;
  font-size: 10px;
  color: #888;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

/* Web view: hide page breaks */
.web-view-active .page-break-indicator {
  display: none;
}

/* Web view: continuous scroll styling */
.web-view {
  padding: 1rem;
}

/* Animation for mode switching */
.print-view-active,
.web-view-active {
  transition: background-color 0.3s ease;
}
`;
