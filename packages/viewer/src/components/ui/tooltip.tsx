import * as React from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { cn } from "../../lib/utils";

function TooltipProvider({
  delayDuration = 0,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Provider>) {
  return (
    <TooltipPrimitive.Provider
      data-slot="tooltip-provider"
      delayDuration={delayDuration}
      {...props}
    />
  );
}

function Tooltip({ ...props }: React.ComponentProps<typeof TooltipPrimitive.Root>) {
  return (
    <TooltipProvider>
      <TooltipPrimitive.Root data-slot="tooltip" {...props} />
    </TooltipProvider>
  );
}

function TooltipTrigger({ ...props }: React.ComponentProps<typeof TooltipPrimitive.Trigger>) {
  return <TooltipPrimitive.Trigger data-slot="tooltip-trigger" {...props} />;
}

function TooltipContent({
  className,
  sideOffset = 0,
  children,
  container,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Content> & {
  container?: HTMLElement | null;
}) {
  return (
    <TooltipPrimitive.Portal container={container ?? undefined}>
      <TooltipPrimitive.Content
        data-slot="tooltip-content"
        sideOffset={sideOffset}
        className={cn(
          "rqti:bg-foreground rqti:text-background rqti:animate-in rqti:fade-in-0 rqti:zoom-in-95 rqti:data-[state=closed]:animate-out rqti:data-[state=closed]:fade-out-0 rqti:data-[state=closed]:zoom-out-95 rqti:data-[side=bottom]:slide-in-from-top-2 rqti:data-[side=left]:slide-in-from-right-2 rqti:data-[side=right]:slide-in-from-left-2 rqti:data-[side=top]:slide-in-from-bottom-2 rqti:z-50 rqti:w-fit rqti:origin-(--radix-tooltip-content-transform-origin) rqti:rounded-md rqti:px-3 rqti:py-1.5 rqti:text-xs rqti:text-balance",
          className,
        )}
        {...props}
      >
        {children}
        <TooltipPrimitive.Arrow className="rqti:bg-foreground rqti:fill-foreground rqti:z-50 rqti:size-2.5 rqti:translate-y-[calc(-50%_-_2px)] rqti:rotate-45 rqti:rounded-[2px]" />
      </TooltipPrimitive.Content>
    </TooltipPrimitive.Portal>
  );
}

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider };
