"use client";

import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { motion } from "framer-motion";

import { cn } from "@/lib/utils";

const Tabs = TabsPrimitive.Root;

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      "relative inline-flex h-9 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground",
      className,
    )}
    {...props}
  />
));
TabsList.displayName = TabsPrimitive.List.displayName;

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, children, ...props }, ref) => {
  // Radix UI passes data-state="active" to the trigger
  const [isActive, setIsActive] = React.useState(false);

  // We use an observer to track the data-state attribute since Radix doesn't expose it via props
  const localRef = React.useRef<HTMLButtonElement>(null);

  React.useLayoutEffect(() => {
    const el = localRef.current;
    if (!el) return;

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === "data-state") {
          setIsActive(el.getAttribute("data-state") === "active");
        }
      });
    });

    observer.observe(el, { attributes: true });
    setIsActive(el.getAttribute("data-state") === "active");

    return () => observer.disconnect();
  }, []);

  return (
    <TabsPrimitive.Trigger
      ref={(node) => {
        // Handle both refs
        (localRef as any).current = node;
        if (typeof ref === "function") ref(node);
        else if (ref) (ref as any).current = node;
      }}
      className={cn(
        "relative inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium ring-offset-background cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed data-[state=active]:text-foreground z-10",
        className,
      )}
      {...props}
    >
      {isActive && (
        <motion.div
          layoutId="active-tab"
          className="absolute inset-0 bg-background rounded-md shadow-sm z-[-1]"
          transition={{
            type: "spring",
            stiffness: 500,
            damping: 35,
            mass: 1,
          }}
        />
      )}
      <span className="relative z-10">{children}</span>
    </TabsPrimitive.Trigger>
  );
});
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      className,
    )}
    {...props}
  />
));
TabsContent.displayName = TabsPrimitive.Content.displayName;

export { Tabs, TabsList, TabsTrigger, TabsContent };
