import * as React from "react";
import * as SheetPrimitive from "@radix-ui/react-dialog";
import { cn } from "../../lib/utils";

const XIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M18 6L6 18" />
    <path d="M6 6l12 12" />
  </svg>
);

function Sheet({ ...props }: React.ComponentProps<typeof SheetPrimitive.Root>) {
  return <SheetPrimitive.Root data-slot="sheet" {...props} />;
}

function SheetTrigger({ ...props }: React.ComponentProps<typeof SheetPrimitive.Trigger>) {
  return <SheetPrimitive.Trigger data-slot="sheet-trigger" {...props} />;
}

function SheetClose({ ...props }: React.ComponentProps<typeof SheetPrimitive.Close>) {
  return <SheetPrimitive.Close data-slot="sheet-close" {...props} />;
}

function SheetPortal({ ...props }: React.ComponentProps<typeof SheetPrimitive.Portal>) {
  return <SheetPrimitive.Portal data-slot="sheet-portal" {...props} />;
}

// function SheetOverlay({
//   className,
//   ...props
// }: React.ComponentProps<typeof SheetPrimitive.Overlay>) {
//   return (
//     <SheetPrimitive.Overlay
//       className={cn(
//         "rtqi:data-[state=open]:animate-in rtqi:data-[state=closed]:animate-out rtqi:data-[state=closed]:fade-out-0 rtqi:data-[state=open]:fade-in-0 rtqi:fixed rtqi:inset-0 rtqi:z-50 rtqi:bg-black/50",
//         className
//       )}
//       {...props}
//     />
//   );
// }

function SheetContent({
  className,
  children,
  side = "right",
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Content> & {
  side?: "top" | "right" | "bottom" | "left";
}) {
  return (
    <SheetPortal>
      {/* <SheetOverlay /> */}
      <SheetPrimitive.Content
        data-slot="sheet-content"
        className={cn(
          "rtqi:bg-background rtqi:data-[state=open]:animate-in rtqi:data-[state=closed]:animate-out rtqi:fixed rtqi:z-50 rtqi:flex rtqi:flex-col rtqi:gap-4 rtqi:shadow-lg rtqi:transition rtqi:ease-in-out rtqi:data-[state=closed]:duration-300 rtqi:data-[state=open]:duration-500",
          side === "right" &&
            "rtqi:data-[state=closed]:slide-out-to-right rtqi:data-[state=open]:slide-in-from-right rtqi:inset-y-0 rtqi:right-0 rtqi:h-full rtqi:w-3/4 rtqi:border-l rtqi:sm:max-w-sm",
          side === "left" &&
            "rtqi:data-[state=closed]:slide-out-to-left rtqi:data-[state=open]:slide-in-from-left rtqi:inset-y-0 rtqi:left-0 rtqi:h-full rtqi:w-3/4 rtqi:border-r rtqi:sm:max-w-sm",
          side === "top" &&
            "rtqi:data-[state=closed]:slide-out-to-top rtqi:data-[state=open]:slide-in-from-top rtqi:inset-x-0 rtqi:top-0 rtqi:h-auto rtqi:border-b",
          side === "bottom" &&
            "rtqi:data-[state=closed]:slide-out-to-bottom rtqi:data-[state=open]:slide-in-from-bottom rtqi:inset-x-0 rtqi:bottom-0 rtqi:h-auto rtqi:border-t",
          className
        )}
        {...props}
      >
        {children}
        <SheetPrimitive.Close className="rtqi:ring-offset-background rtqi:focus:ring-ring rtqi:data-[state=open]:bg-secondary rtqi:absolute rtqi:top-4 rtqi:right-4 rtqi:rounded-xs rtqi:opacity-70 rtqi:transition-opacity rtqi:hover:opacity-100 rtqi:focus:ring-2 rtqi:focus:ring-offset-2 rtqi:focus:outline-hidden rtqi:disabled:pointer-events-none">
          <XIcon className="size-4" />
          <span className="rtqi:sr-only">Close</span>
        </SheetPrimitive.Close>
      </SheetPrimitive.Content>
    </SheetPortal>
  );
}

function SheetHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-header"
      className={cn("rtqi:flex rtqi:flex-col rtqi:gap-1.5 rtqi:p-4", className)}
      {...props}
    />
  );
}

function SheetFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-footer"
      className={cn("rtqi:mt-auto rtqi:flex rtqi:flex-col rtqi:gap-2 rtqi:p-4", className)}
      {...props}
    />
  );
}

function SheetTitle({ className, ...props }: React.ComponentProps<typeof SheetPrimitive.Title>) {
  return (
    <SheetPrimitive.Title
      data-slot="sheet-title"
      className={cn("rtqi:text-foreground rtqi:font-semibold", className)}
      {...props}
    />
  );
}

function SheetDescription({
  className,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Description>) {
  return (
    <SheetPrimitive.Description
      data-slot="sheet-description"
      className={cn("rtqi:text-muted-foreground rtqi:text-sm", className)}
      {...props}
    />
  );
}

export {
  Sheet,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
};
