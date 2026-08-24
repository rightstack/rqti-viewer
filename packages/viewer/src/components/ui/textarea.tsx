import * as React from "react";
import { cn } from "../../lib/utils";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "rqti:file:text-foreground rqti:placeholder:text-muted-foreground rqti:selection:bg-primary rqti:selection:text-primary-foreground rqti:dark:bg-input/30 rqti:border-input rqti:flex rqti:min-h-[60px] rqti:w-full rqti:min-w-0 rqti:rounded-md rqti:border rqti:bg-transparent rqti:px-3 rqti:py-2 rqti:text-sm rqti:shadow-xs rqti:transition-[color,box-shadow] rqti:outline-none rqti:disabled:pointer-events-none rqti:disabled:cursor-not-allowed rqti:disabled:opacity-50 rqti:md:text-sm",
        "rqti:focus-visible:border-ring rqti:focus-visible:ring-ring/50 rqti:focus-visible:ring-[3px]",
        "rqti:aria-invalid:ring-destructive/20 rqti:dark:aria-invalid:ring-destructive/40 rqti:aria-invalid:border-destructive",
        className
      )}
      {...props}
    />
  );
}

export { Textarea };
