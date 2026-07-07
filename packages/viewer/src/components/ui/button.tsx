import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { type VariantProps, cva } from "class-variance-authority";
import { cn } from "../../lib/utils";

const buttonVariants = cva(
  "rtqi:inline-flex rtqi:items-center rtqi:justify-center rtqi:gap-2 rtqi:whitespace-nowrap rtqi:rounded-md rtqi:text-sm rtqi:font-medium rtqi:transition-all rtqi:disabled:pointer-events-none rtqi:disabled:opacity-50 rtqi:[&_svg]:pointer-events-none rtqi:[&_svg:not([class*='size-'])]:size-4 rtqi:shrink-0 rtqi:[&_svg]:shrink-0 rtqi:outline-none rtqi:focus-visible:border-ring rtqi:focus-visible:ring-ring/50 rtqi:focus-visible:ring-[3px] rtqi:aria-invalid:ring-destructive/20 rtqi:dark:aria-invalid:ring-destructive/40 rtqi:aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default: "rtqi:bg-primary rtqi:text-primary-foreground rtqi:hover:bg-primary/90",
        destructive:
          "rtqi:bg-destructive rtqi:text-white rtqi:hover:bg-destructive/90 rtqi:focus-visible:ring-destructive/20 rtqi:dark:focus-visible:ring-destructive/40 rtqi:dark:bg-destructive/60",
        outline:
          "rtqi:border rtqi:bg-background rtqi:shadow-xs rtqi:hover:bg-accent rtqi:hover:text-accent-foreground rtqi:dark:bg-input/30 rtqi:dark:border-input rtqi:dark:hover:bg-input/50",
        secondary: "rtqi:bg-secondary rtqi:text-secondary-foreground rtqi:hover:bg-secondary/80",
        ghost: "rtqi:hover:bg-accent rtqi:hover:text-accent-foreground rtqi:dark:hover:bg-accent/50",
        link: "rtqi:text-primary rtqi:underline-offset-4 rtqi:hover:underline",
      },
      size: {
        default: "rtqi:h-9 rtqi:px-4 rtqi:py-2 rtqi:has-[>svg]:px-3",
        sm: "rtqi:h-8 rtqi:rounded-md rtqi:gap-1.5 rtqi:px-3 rtqi:has-[>svg]:px-2.5",
        lg: "rtqi:h-10 rtqi:rounded-md rtqi:px-6 rtqi:has-[>svg]:px-4",
        icon: "rtqi:size-9",
        "icon-sm": "rtqi:size-8",
        "icon-lg": "rtqi:size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button };
