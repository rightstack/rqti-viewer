import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
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

function Dialog({ ...props }: React.ComponentProps<typeof DialogPrimitive.Root>) {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />;
}

function DialogTrigger({ ...props }: React.ComponentProps<typeof DialogPrimitive.Trigger>) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />;
}

function DialogPortal({ ...props }: React.ComponentProps<typeof DialogPrimitive.Portal>) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />;
}

function DialogClose({ ...props }: React.ComponentProps<typeof DialogPrimitive.Close>) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />;
}

function DialogOverlay({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      data-slot="dialog-overlay"
      className={cn(
        "rtqi:data-[state=open]:animate-in rtqi:data-[state=closed]:animate-out rtqi:data-[state=closed]:fade-out-0 rtqi:data-[state=open]:fade-in-0 rtqi:fixed rtqi:inset-0 rtqi:z-50 rtqi:bg-black/50",
        className
      )}
      {...props}
    />
  );
}

function DialogContent({
  className,
  children,
  showCloseButton = true,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & {
  showCloseButton?: boolean;
}) {
  return (
    <DialogPortal data-slot="dialog-portal">
      {/* <DialogOverlay /> */}
      <DialogPrimitive.Content
        data-slot="dialog-content"
        className={cn(
          "rtqi-viewer",
          "rtqi:bg-background rtqi:data-[state=open]:animate-in rtqi:data-[state=closed]:animate-out rtqi:data-[state=closed]:fade-out-0 rtqi:data-[state=open]:fade-in-0 rtqi:data-[state=closed]:zoom-out-95 rtqi:data-[state=open]:zoom-in-95 rtqi:fixed rtqi:top-[50%] rtqi:left-[50%] rtqi:z-50 rtqi:grid rtqi:w-full rtqi:max-w-[calc(100%-2rem)] rtqi:translate-x-[-50%] rtqi:translate-y-[-50%] rtqi:gap-4 rtqi:rounded-lg rtqi:border rtqi:p-6 rtqi:shadow-lg rtqi:duration-200 rtqi:sm:max-w-lg",
          className
        )}
        {...props}
      >
        {children}
        {showCloseButton && (
          <DialogPrimitive.Close
            data-slot="dialog-close"
            className="rtqi:ring-offset-background rtqi:focus:ring-ring rtqi:data-[state=open]:bg-accent rtqi:data-[state=open]:text-muted-foreground rtqi:absolute rtqi:top-4 rtqi:right-4 rtqi:rounded-xs rtqi:opacity-70 rtqi:transition-opacity rtqi:hover:opacity-100 rtqi:focus:ring-2 rtqi:focus:ring-offset-2 rtqi:focus:outline-hidden rtqi:disabled:pointer-events-none rtqi:[&_svg]:pointer-events-none rtqi:[&_svg]:shrink-0 rtqi:[&_svg:not([class*='size-'])]:size-4"
          >
            <XIcon />
            <span className="rtqi:sr-only">Close</span>
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Content>
    </DialogPortal>
  );
}

function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-header"
      className={cn("rtqi:flex rtqi:flex-col rtqi:gap-2 rtqi:text-center rtqi:sm:text-left", className)}
      {...props}
    />
  );
}

function DialogFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn("rtqi:flex rtqi:flex-col-reverse rtqi:gap-2 rtqi:sm:flex-row rtqi:sm:justify-end", className)}
      {...props}
    />
  );
}

function DialogTitle({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn("rtqi:text-lg rtqi:leading-none rtqi:font-semibold", className)}
      {...props}
    />
  );
}

function DialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn("rtqi:text-muted-foreground rtqi:text-sm", className)}
      {...props}
    />
  );
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
};
