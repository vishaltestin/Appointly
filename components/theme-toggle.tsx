"use client"

import { useTheme } from "next-themes"
import { Monitor, Moon, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

/**
 * Dark mode was previously only reachable through the `d` hotkey registered
 * in theme-provider.tsx — undiscoverable for anyone who hadn't read the
 * template's landing page. This exposes it in the app chrome.
 */
export function ThemeToggle() {
  const { setTheme } = useTheme()

  const options = [
    { value: "light", label: "Light", icon: Sun },
    { value: "dark", label: "Dark", icon: Moon },
    { value: "system", label: "System", icon: Monitor },
  ] as const

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="ghost" size="sm" aria-label="Toggle theme">
            {/* Swapped with CSS rather than state: the server can't know the
                resolved theme, and a mount guard would either flash or
                trip react-hooks/set-state-in-effect. */}
            <Sun className="h-4 w-4 dark:hidden" />
            <Moon className="hidden h-4 w-4 dark:block" />
          </Button>
        }
      />
      <DropdownMenuContent align="end">
        {options.map((option) => (
          <DropdownMenuItem
            key={option.value}
            onClick={() => setTheme(option.value)}
          >
            <option.icon className="mr-2 h-4 w-4" />
            {option.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
