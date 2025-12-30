"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker } from "react-day-picker"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-0", className)}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-4",
        caption: "flex justify-center items-center mb-4 relative min-h-[2rem]",
        caption_label: "text-base font-semibold text-foreground",
        nav: "flex items-center gap-1",
        nav_button: cn(
          buttonVariants({ variant: "ghost" }),
          "h-8 w-8 p-0 hover:bg-muted rounded-md flex items-center justify-center absolute"
        ),
        nav_button_previous: "left-0 top-0",
        nav_button_next: "right-0 top-0",
        table: "w-full border-collapse",
        head_row: "flex w-full",
        head_cell:
          "w-[calc(100%/7)] text-center text-xs font-medium text-muted-foreground py-2.5 flex items-center justify-center",
        row: "flex w-full",
        cell: "w-[calc(100%/7)] h-10 flex items-center justify-center p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
        day: cn(
          buttonVariants({ variant: "ghost" }),
          "h-10 w-10 p-0 m-0 font-normal text-sm rounded-md hover:bg-muted transition-colors aria-selected:opacity-100 flex items-center justify-center leading-none [&>*]:flex [&>*]:items-center [&>*]:justify-center [&>*]:w-full [&>*]:h-full"
        ),
        day_range_end: "day-range-end rounded-r-md",
        day_selected:
          "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground rounded-md font-medium",
        day_today: "bg-muted text-foreground font-medium",
        day_outside:
          "day-outside text-muted-foreground opacity-50",
        day_disabled: "text-muted-foreground opacity-30 cursor-not-allowed",
        day_range_middle:
          "aria-selected:bg-primary/10 aria-selected:text-primary rounded-none",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        IconLeft: ({ ...props }) => <ChevronLeft className="h-4 w-4" />,
        IconRight: ({ ...props }) => <ChevronRight className="h-4 w-4" />,
      }}
      {...props}
    />
  )
}
Calendar.displayName = "Calendar"

export { Calendar }

