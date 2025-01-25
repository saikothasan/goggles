"use client"

import { useState, useEffect } from "react"
import { linkNotes, getLinkedNotes } from "../actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { supabase } from "@/lib/supabase"

interface NoteLinkingProps {
  noteId: string
}

export default function NoteLinking({ noteId }: NoteLinkingProps) {
  const [linkedNotes, setLinkedNotes] = useState<{ id: string; title: string }[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [searchResults, setSearchResults] = useState<{ id: string; title: string }[]>([])

  useEffect(() => {
    fetchLinkedNotes()
  }, []) // Removed noteId from dependencies

  useEffect(() => {
    if (searchTerm) {
      searchNotes()
    } else {
      setSearchResults([])
    }
  }, [searchTerm])

  const fetchLinkedNotes = async () => {
    const { data, error } = await getLinkedNotes(noteId)
    if (!error && data) {
      setLinkedNotes(data)
    }
  }

  const searchNotes = async () => {
    const { data, error } = await supabase
      .from("notes")
      .select("id, title")
      .neq("id", noteId)
      .ilike("title", `%${searchTerm}%`)
      .limit(5)

    if (!error && data) {
      setSearchResults(data)
    }
  }

  const handleLinkNote = async (targetId: string) => {
    const { success, error } = await linkNotes(noteId, targetId)
    if (success) {
      fetchLinkedNotes()
      setSearchTerm("")
    } else if (error) {
      console.error("Error linking note:", error)
    }
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Linked Notes</h3>
      <div className="flex flex-wrap gap-2">
        {linkedNotes.map((note) => (
          <Badge key={note.id} variant="secondary">
            {note.title}
          </Badge>
        ))}
      </div>
      <div className="flex items-center space-x-2">
        <Input
          type="text"
          placeholder="Search notes to link"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      {searchResults.length > 0 && (
        <ul className="space-y-2">
          {searchResults.map((note) => (
            <li key={note.id} className="flex justify-between items-center">
              <span>{note.title}</span>
              <Button onClick={() => handleLinkNote(note.id)} size="sm">
                Link
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

