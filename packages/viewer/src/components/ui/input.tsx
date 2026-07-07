import * as React from "react";
import { cn } from "../../lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "rtqi:file:text-foreground rtqi:placeholder:text-muted-foreground rtqi:selection:bg-primary rtqi:selection:text-primary-foreground rtqi:dark:bg-input/30 rtqi:border-input rtqi:h-9 rtqi:w-full rtqi:min-w-0 rtqi:rounded-md rtqi:border rtqi:bg-transparent rtqi:px-3 rtqi:py-1 rtqi:text-base rtqi:shadow-xs rtqi:transition-[color,box-shadow] rtqi:outline-none rtqi:file:inline-flex rtqi:file:h-7 rtqi:file:border-0 rtqi:file:bg-transparent rtqi:file:text-sm rtqi:file:font-medium rtqi:disabled:pointer-events-none rtqi:disabled:cursor-not-allowed rtqi:disabled:opacity-50 rtqi:md:text-sm",
        "rtqi:focus-visible:border-ring rtqi:focus-visible:ring-ring/50 rtqi:focus-visible:ring-[3px]",
        "rtqi:aria-invalid:ring-destructive/20 rtqi:dark:aria-invalid:ring-destructive/40 rtqi:aria-invalid:border-destructive",
        className
      )}
      {...props}
    />
  );
}

export { Input };
