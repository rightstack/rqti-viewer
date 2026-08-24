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
        "rqti:data-[state=open]:animate-in rqti:data-[state=closed]:animate-out rqti:data-[state=closed]:fade-out-0 rqti:data-[state=open]:fade-in-0 rqti:fixed rqti:inset-0 rqti:z-50 rqti:bg-black/50",
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
          "rqti-viewer",
          "rqti:bg-background rqti:data-[state=open]:animate-in rqti:data-[state=closed]:animate-out rqti:data-[state=closed]:fade-out-0 rqti:data-[state=open]:fade-in-0 rqti:data-[state=closed]:zoom-out-95 rqti:data-[state=open]:zoom-in-95 rqti:fixed rqti:top-[50%] rqti:left-[50%] rqti:z-50 rqti:grid rqti:w-full rqti:max-w-[calc(100%-2rem)] rqti:translate-x-[-50%] rqti:translate-y-[-50%] rqti:gap-4 rqti:rounded-lg rqti:border rqti:p-6 rqti:shadow-lg rqti:duration-200 rqti:sm:max-w-lg",
          className
        )}
        {...props}
      >
        {children}
        {showCloseButton && (
          <DialogPrimitive.Close
            data-slot="dialog-close"
            className="rqti:ring-offset-background rqti:focus:ring-ring rqti:data-[state=open]:bg-accent rqti:data-[state=open]:text-muted-foreground rqti:absolute rqti:top-4 rqti:right-4 rqti:rounded-xs rqti:opacity-70 rqti:transition-opacity rqti:hover:opacity-100 rqti:focus:ring-2 rqti:focus:ring-offset-2 rqti:focus:outline-hidden rqti:disabled:pointer-events-none rqti:[&_svg]:pointer-events-none rqti:[&_svg]:shrink-0 rqti:[&_svg:not([class*='size-'])]:size-4"
          >
            <XIcon />
            <span className="rqti:sr-only">Close</span>
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
      className={cn("rqti:flex rqti:flex-col rqti:gap-2 rqti:text-center rqti:sm:text-left", className)}
      {...props}
    />
  );
}

function DialogFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn("rqti:flex rqti:flex-col-reverse rqti:gap-2 rqti:sm:flex-row rqti:sm:justify-end", className)}
      {...props}
    />
  );
}

function DialogTitle({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn("rqti:text-lg rqti:leading-none rqti:font-semibold", className)}
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
      className={cn("rqti:text-muted-foreground rqti:text-sm", className)}
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
