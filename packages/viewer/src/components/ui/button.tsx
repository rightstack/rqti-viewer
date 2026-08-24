import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { type VariantProps, cva } from "class-variance-authority";
import { cn } from "../../lib/utils";

const buttonVariants = cva(
  "rqti:inline-flex rqti:items-center rqti:justify-center rqti:gap-2 rqti:whitespace-nowrap rqti:rounded-md rqti:text-sm rqti:font-medium rqti:transition-all rqti:disabled:pointer-events-none rqti:disabled:opacity-50 rqti:[&_svg]:pointer-events-none rqti:[&_svg:not([class*='size-'])]:size-4 rqti:shrink-0 rqti:[&_svg]:shrink-0 rqti:outline-none rqti:focus-visible:border-ring rqti:focus-visible:ring-ring/50 rqti:focus-visible:ring-[3px] rqti:aria-invalid:ring-destructive/20 rqti:dark:aria-invalid:ring-destructive/40 rqti:aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default: "rqti:bg-primary rqti:text-primary-foreground rqti:hover:bg-primary/90",
        destructive:
          "rqti:bg-destructive rqti:text-white rqti:hover:bg-destructive/90 rqti:focus-visible:ring-destructive/20 rqti:dark:focus-visible:ring-destructive/40 rqti:dark:bg-destructive/60",
        outline:
          "rqti:border rqti:bg-background rqti:shadow-xs rqti:hover:bg-accent rqti:hover:text-accent-foreground rqti:dark:bg-input/30 rqti:dark:border-input rqti:dark:hover:bg-input/50",
        secondary: "rqti:bg-secondary rqti:text-secondary-foreground rqti:hover:bg-secondary/80",
        ghost: "rqti:hover:bg-accent rqti:hover:text-accent-foreground rqti:dark:hover:bg-accent/50",
        link: "rqti:text-primary rqti:underline-offset-4 rqti:hover:underline",
      },
      size: {
        default: "rqti:h-9 rqti:px-4 rqti:py-2 rqti:has-[>svg]:px-3",
        sm: "rqti:h-8 rqti:rounded-md rqti:gap-1.5 rqti:px-3 rqti:has-[>svg]:px-2.5",
        lg: "rqti:h-10 rqti:rounded-md rqti:px-6 rqti:has-[>svg]:px-4",
        icon: "rqti:size-9",
        "icon-sm": "rqti:size-8",
        "icon-lg": "rqti:size-10",
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
