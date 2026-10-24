'use client';

import * as React from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AccordionContextValue {
  expandedItem: string | null;
  toggleItem: (id: string) => void;
}

const AccordionContext = React.createContext<AccordionContextValue | undefined>(undefined);

interface AccordionProps extends React.HTMLAttributes<HTMLDivElement> {
  type?: 'single';
  collapsible?: boolean;
  defaultValue?: string;
  children: React.ReactNode;
}

export function Accordion({
  className,
  defaultValue = '',
  children,
  ...props
}: AccordionProps) {
  const [expandedItem, setExpandedItem] = React.useState<string | null>(defaultValue || null);

  const toggleItem = React.useCallback((id: string) => {
    setExpandedItem((prev) => (prev === id ? null : id));
  }, []);

  return (
    <AccordionContext.Provider value={{ expandedItem, toggleItem }}>
      <div className={cn('divide-y divide-slate-200 border-y border-slate-200', className)} {...props}>
        {children}
      </div>
    </AccordionContext.Provider>
  );
}

interface AccordionItemProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
  children: React.ReactNode;
}

const AccordionItemContext = React.createContext<{ value: string } | undefined>(undefined);

export function AccordionItem({ value, className, children, ...props }: AccordionItemProps) {
  return (
    <AccordionItemContext.Provider value={{ value }}>
      <div className={cn('py-1', className)} {...props}>
        {children}
      </div>
    </AccordionItemContext.Provider>
  );
}

interface AccordionTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

export function AccordionTrigger({ className, children, ...props }: AccordionTriggerProps) {
  const context = React.useContext(AccordionContext);
  const itemContext = React.useContext(AccordionItemContext);

  if (!context || !itemContext) {
    throw new Error('AccordionTrigger must be used within Accordion and AccordionItem');
  }

  const isOpen = context.expandedItem === itemContext.value;

  return (
    <button
      type="button"
      onClick={() => context.toggleItem(itemContext.value)}
      aria-expanded={isOpen}
      className={cn(
        'flex w-full items-center justify-between py-4 text-left text-sm font-semibold text-slate-900 transition-all hover:text-[#FE4D03] cursor-pointer focus:outline-hidden',
        className
      )}
      {...props}
    >
      <span>{children}</span>
      <ChevronDown
        className={cn(
          'h-4 w-4 shrink-0 text-slate-500 transition-transform duration-200',
          isOpen && 'rotate-180 text-[#FE4D03]'
        )}
      />
    </button>
  );
}

interface AccordionContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function AccordionContent({ className, children, ...props }: AccordionContentProps) {
  const context = React.useContext(AccordionContext);
  const itemContext = React.useContext(AccordionItemContext);

  if (!context || !itemContext) {
    throw new Error('AccordionContent must be used within Accordion and AccordionItem');
  }

  const isOpen = context.expandedItem === itemContext.value;

  if (!isOpen) return null;

  return (
    <div
      role="region"
      className={cn('pb-4 pt-1 text-xs text-slate-600 leading-relaxed animate-in fade-in-50 duration-200', className)}
      {...props}
    >
      {children}
    </div>
  );
}
