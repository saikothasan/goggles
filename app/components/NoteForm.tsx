"use client"

import { useState, useCallback } from "react"
import { useFormStatus } from "react-dom"
import { addNote, updateNote } from "../actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import TagInput from "./TagInput"
import dynamic from "next/dynamic"
import { supabase } from "@/lib/supabase"

const ReactQuill = dynamic(() => import("react-quill"), { ssr: false })
import "react-quill/dist/quill.snow.css"

interface NoteFormProps {
  id?: string
  initialTitle?: string
  initialContent?: string
  initialCategory?: string
  initialTags?: string[]
}

const categories = ["Personal", "Work", "Study", "Other"]

export default function NoteForm({
  id,
  initialTitle = "",
  initialContent = "",
  initialCategory = "Personal",
  initialTags = [],
}: NoteFormProps) {
  const [title, setTitle] = useState(initialTitle)
  const [content, setContent] = useState(initialContent)
  const [category, setCategory] = useState(initialCategory)
  const [tags, setTags] = useState(initialTags)
  const { pending } = useFormStatus()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const formData = new FormData()
    formData.append("title", title)
    formData.append("content", content)
    formData.append("category", category)
    formData.append("tags", JSON.stringify(tags))
    if (id) {
      formData.append("id", id)
      await updateNote(formData)
    } else {
      await addNote(formData)
    }
    if (!id) {
      setTitle("")
      setContent("")
      setCategory("Personal")
      setTags([])
    }
  }

  const imageHandler = useCallback(() => {
    const input = document.createElement("input")
    input.setAttribute("type", "file")
    input.setAttribute("accept", "image/*")
    input.click()

    input.onchange = async () => {
      const file = input.files?.[0]
      if (file) {
        const { data, error } = await supabase.storage.from("note-images").upload(`${Date.now()}-${file.name}`, file)

        if (error) {
          console.error("Error uploading image:", error)
        } else if (data) {
          const { publicURL, error: urlError } = supabase.storage.from("note-images").getPublicUrl(data.path)

          if (urlError) {
            console.error("Error getting public URL:", urlError)
          } else if (publicURL) {
            const quill = (ReactQuill as any).getEditor()
            const range = quill.getSelection(true)
            quill.insertEmbed(range.index, "image", publicURL)
          }
        }
      }
    }
  }, [])

  const modules = {
    toolbar: {
      container: [
        [{ header: [1, 2, 3, 4, 5, 6, false] }],
        ["bold", "italic", "underline", "strike"],
        [{ list: "ordered" }, { list: "bullet" }],
        ["link", "image"],
        ["clean"],
      ],
      handlers: {
        image: imageHandler,
      },
    },
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Note Title" required />
      <Select value={category} onValueChange={setCategory}>
        <SelectTrigger>
          <SelectValue placeholder="Select a category" />
        </SelectTrigger>
        <SelectContent>
          {categories.map((cat) => (
            <SelectItem key={cat} value={cat}>
              {cat}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <TagInput initialTags={tags} onChange={setTags} />
      <ReactQuill theme="snow" value={content} onChange={setContent} modules={modules} />
      <Button type="submit" disabled={pending}>
        {id ? "Update Note" : "Add Note"}
      </Button>
    </form>
  )
}

