import * as React from "react";
import { cn } from "../../lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "rqti:file:text-foreground rqti:placeholder:text-muted-foreground rqti:selection:bg-primary rqti:selection:text-primary-foreground rqti:dark:bg-input/30 rqti:border-input rqti:h-9 rqti:w-full rqti:min-w-0 rqti:rounded-md rqti:border rqti:bg-transparent rqti:px-3 rqti:py-1 rqti:text-base rqti:shadow-xs rqti:transition-[color,box-shadow] rqti:outline-none rqti:file:inline-flex rqti:file:h-7 rqti:file:border-0 rqti:file:bg-transparent rqti:file:text-sm rqti:file:font-medium rqti:disabled:pointer-events-none rqti:disabled:cursor-not-allowed rqti:disabled:opacity-50 rqti:md:text-sm",
        "rqti:focus-visible:border-ring rqti:focus-visible:ring-ring/50 rqti:focus-visible:ring-[3px]",
        "rqti:aria-invalid:ring-destructive/20 rqti:dark:aria-invalid:ring-destructive/40 rqti:aria-invalid:border-destructive",
        className
      )}
      {...props}
    />
  );
}

export { Input };
