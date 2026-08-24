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
//         "rqti:data-[state=open]:animate-in rqti:data-[state=closed]:animate-out rqti:data-[state=closed]:fade-out-0 rqti:data-[state=open]:fade-in-0 rqti:fixed rqti:inset-0 rqti:z-50 rqti:bg-black/50",
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
          "rqti-viewer",
          "rqti:bg-background rqti:data-[state=open]:animate-in rqti:data-[state=closed]:animate-out rqti:fixed rqti:z-50 rqti:flex rqti:flex-col rqti:gap-4 rqti:shadow-lg rqti:transition rqti:ease-in-out rqti:data-[state=closed]:duration-300 rqti:data-[state=open]:duration-500",
          side === "right" &&
            "rqti:data-[state=closed]:slide-out-to-right rqti:data-[state=open]:slide-in-from-right rqti:inset-y-0 rqti:right-0 rqti:h-full rqti:w-3/4 rqti:border-l rqti:sm:max-w-sm",
          side === "left" &&
            "rqti:data-[state=closed]:slide-out-to-left rqti:data-[state=open]:slide-in-from-left rqti:inset-y-0 rqti:left-0 rqti:h-full rqti:w-3/4 rqti:border-r rqti:sm:max-w-sm",
          side === "top" &&
            "rqti:data-[state=closed]:slide-out-to-top rqti:data-[state=open]:slide-in-from-top rqti:inset-x-0 rqti:top-0 rqti:h-auto rqti:border-b",
          side === "bottom" &&
            "rqti:data-[state=closed]:slide-out-to-bottom rqti:data-[state=open]:slide-in-from-bottom rqti:inset-x-0 rqti:bottom-0 rqti:h-auto rqti:border-t",
          className
        )}
        {...props}
      >
        {children}
        <SheetPrimitive.Close className="rqti:ring-offset-background rqti:focus:ring-ring rqti:data-[state=open]:bg-secondary rqti:absolute rqti:top-4 rqti:right-4 rqti:rounded-xs rqti:opacity-70 rqti:transition-opacity rqti:hover:opacity-100 rqti:focus:ring-2 rqti:focus:ring-offset-2 rqti:focus:outline-hidden rqti:disabled:pointer-events-none">
          <XIcon className="size-4" />
          <span className="rqti:sr-only">Close</span>
        </SheetPrimitive.Close>
      </SheetPrimitive.Content>
    </SheetPortal>
  );
}

function SheetHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-header"
      className={cn("rqti:flex rqti:flex-col rqti:gap-1.5 rqti:p-4", className)}
      {...props}
    />
  );
}

function SheetFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-footer"
      className={cn("rqti:mt-auto rqti:flex rqti:flex-col rqti:gap-2 rqti:p-4", className)}
      {...props}
    />
  );
}

function SheetTitle({ className, ...props }: React.ComponentProps<typeof SheetPrimitive.Title>) {
  return (
    <SheetPrimitive.Title
      data-slot="sheet-title"
      className={cn("rqti:text-foreground rqti:font-semibold", className)}
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
      className={cn("rqti:text-muted-foreground rqti:text-sm", className)}
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
