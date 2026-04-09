import * as React from "react"
import { cn } from "@/lib/utils"

interface FloatingTextareaProps extends React.ComponentProps<"textarea"> {
  label: string;
}

const FloatingTextarea = React.forwardRef<HTMLTextAreaElement, FloatingTextareaProps>(
  ({ className, label, id, ...props }, ref) => {
    const generatedId = React.useId();
    const textareaId = id || generatedId;

    return (
      <div className="relative">
        <textarea
          id={textareaId}
          ref={ref}
          placeholder=" "
          rows={3}
          className={cn(
            "peer flex min-h-[80px] w-full rounded-lg border border-input bg-transparent px-3 pt-6 pb-2 text-base shadow-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:border-primary disabled:cursor-not-allowed disabled:opacity-50 md:text-sm resize-none",
            className
          )}
          {...props}
        />
        <label
          htmlFor={textareaId}
          className="absolute left-3 top-1.5 -translate-y-1.5 text-sm text-muted-foreground transition-all duration-200 pointer-events-none peer-focus:top-2.5 peer-focus:translate-y-0 peer-focus:text-xs peer-focus:text-primary peer-[:not(:placeholder-shown)]:top-2.5 peer-[:not(:placeholder-shown)]:translate-y-0 peer-[:not(:placeholder-shown)]:text-xs"
        >
          {label}
        </label>
      </div>
    )
  }
)
FloatingTextarea.displayName = "FloatingTextarea"

export { FloatingTextarea }
