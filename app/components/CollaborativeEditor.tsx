"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import dynamic from "next/dynamic"

const ReactQuill = dynamic(() => import("react-quill"), { ssr: false })
import "react-quill/dist/quill.snow.css"

interface CollaborativeEditorProps {
  noteId: string
  initialContent: string
  collaborators: string[]
}

export default function CollaborativeEditor({ noteId, initialContent, collaborators }: CollaborativeEditorProps) {
  const [content, setContent] = useState(initialContent)
  const [users, setUsers] = useState<any[]>([])
  const [newCollaborator, setNewCollaborator] = useState("")
  const router = useRouter()

  useEffect(() => {
    const channel = supabase
      .channel(`note:${noteId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "notes", filter: `id=eq.${noteId}` },
        (payload) => {
          setContent(payload.new.content)
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [noteId])

  useEffect(() => {
    const fetchUsers = async () => {
      const { data, error } = await supabase.from("users").select("id, email, avatar_url").in("id", collaborators)

      if (data) {
        setUsers(data)
      }
    }

    fetchUsers()
  }, [collaborators])

  const handleContentChange = async (value: string) => {
    setContent(value)
    await supabase.from("notes").update({ content: value }).eq("id", noteId)
  }

  const handleAddCollaborator = async () => {
    const { data, error } = await supabase
      .from("notes")
      .update({
        collaborators: [...collaborators, newCollaborator],
      })
      .eq("id", noteId)

    if (!error) {
      router.refresh()
      setNewCollaborator("")
    }
  }

  return (
    <div className="space-y-4">
      <ReactQuill theme="snow" value={content} onChange={handleContentChange} />
      <div>
        <h3 className="text-lg font-semibold mb-2">Collaborators</h3>
        <div className="flex space-x-2 mb-2">
          {users.map((user) => (
            <Avatar key={user.id}>
              <AvatarImage src={user.avatar_url} alt={user.email} />
              <AvatarFallback>{user.email[0].toUpperCase()}</AvatarFallback>
            </Avatar>
          ))}
        </div>
        <div className="flex space-x-2">
          <Input
            type="email"
            placeholder="Add collaborator by email"
            value={newCollaborator}
            onChange={(e) => setNewCollaborator(e.target.value)}
          />
          <Button onClick={handleAddCollaborator}>Add</Button>
        </div>
      </div>
    </div>
  )
}

