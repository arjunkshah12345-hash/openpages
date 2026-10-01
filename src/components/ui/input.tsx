import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, type, ...props }, ref) => (
  <input
    type={type}
    className={cn(
      "flex h-10 w-full rounded-xl border border-[#e4e4de] bg-white px-3 py-2 text-[14px] tracking-normal text-[#20201e] shadow-none transition-colors placeholder:text-[#93938b] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#20201e]/10 disabled:cursor-not-allowed disabled:opacity-50",
      className
    )}
    ref={ref}
    {...props}
  />
));
Input.displayName = "Input";

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    className={cn(
      "flex min-h-[80px] w-full rounded-xl border border-[#e4e4de] bg-white px-3 py-2 text-[14px] tracking-normal text-[#20201e] placeholder:text-[#93938b] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#20201e]/10 disabled:cursor-not-allowed disabled:opacity-50",
      className
    )}
    ref={ref}
    {...props}
  />
));
Textarea.displayName = "Textarea";
