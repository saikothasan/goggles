"use client"

import { useState, useEffect, useRef } from "react"
import { getTags, addTag } from "../actions"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Check, ChevronsUpDown } from "lucide-react"

interface TagInputProps {
  initialTags: string[]
  onChange: (tags: string[]) => void
}

export default function TagInput({ initialTags, onChange }: TagInputProps) {
  const [tags, setTags] = useState<string[]>(initialTags)
  const [input, setInput] = useState("")
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [open, setOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (input.length > 0) {
        const { data, error } = await getTags(input)
        if (!error && data) {
          setSuggestions(data)
        }
      } else {
        setSuggestions([])
      }
    }
    fetchSuggestions()
  }, [input])

  const addNewTag = async (tag: string) => {
    if (tag && !tags.includes(tag)) {
      const newTags = [...tags, tag]
      setTags(newTags)
      onChange(newTags)
      await addTag(tag)
    }
    setInput("")
    inputRef.current?.focus()
  }

  const removeTag = (tagToRemove: string) => {
    const newTags = tags.filter((tag) => tag !== tagToRemove)
    setTags(newTags)
    onChange(newTags)
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => (
          <Badge key={tag} variant="secondary" className="text-sm">
            {tag}
            <button className="ml-1 text-xs" onClick={() => removeTag(tag)}>
              ×
            </button>
          </Badge>
        ))}
      </div>
      <div className="flex items-center space-x-2">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" role="combobox" aria-expanded={open} className="justify-between">
              {input || "Select tag..."}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[200px] p-0">
            <Command>
              <CommandInput placeholder="Search tags..." value={input} onValueChange={setInput} />
              <CommandList>
                <CommandEmpty>No tags found.</CommandEmpty>
                <CommandGroup>
                  {suggestions.map((suggestion) => (
                    <CommandItem
                      key={suggestion}
                      onSelect={() => {
                        addNewTag(suggestion)
                        setOpen(false)
                      }}
                    >
                      <Check className={`mr-2 h-4 w-4 ${tags.includes(suggestion) ? "opacity-100" : "opacity-0"}`} />
                      {suggestion}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
        <Input
          ref={inputRef}
          type="text"
          placeholder="Add a new tag"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault()
              addNewTag(input)
            }
          }}
        />
        <Button onClick={() => addNewTag(input)}>Add</Button>
      </div>
    </div>
  )
}

