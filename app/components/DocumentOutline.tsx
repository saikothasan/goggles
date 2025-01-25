"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { DragDropContext, Droppable, Draggable, type DropResult } from "react-beautiful-dnd"
import { updateNoteOutline } from "../actions"

interface OutlineItem {
  id: string
  content: string
  children: OutlineItem[]
}

interface DocumentOutlineProps {
  noteId: string
  initialOutline: OutlineItem[]
}

export default function DocumentOutline({ noteId, initialOutline }: DocumentOutlineProps) {
  const [outline, setOutline] = useState<OutlineItem[]>(initialOutline)
  const [newItemContent, setNewItemContent] = useState("")

  useEffect(() => {
    const channel = supabase
      .channel(`outline:${noteId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "notes", filter: `id=eq.${noteId}` },
        (payload) => {
          setOutline(payload.new.outline)
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [noteId])

  const updateOutline = async (newOutline: OutlineItem[]) => {
    setOutline(newOutline)
    await updateNoteOutline(noteId, newOutline)
  }

  const addItem = (parentId: string | null = null) => {
    if (!newItemContent) return

    const newItem: OutlineItem = {
      id: Date.now().toString(),
      content: newItemContent,
      children: [],
    }

    let newOutline: OutlineItem[]

    if (!parentId) {
      newOutline = [...outline, newItem]
    } else {
      newOutline = outline.map((item) => {
        if (item.id === parentId) {
          return { ...item, children: [...item.children, newItem] }
        }
        return item
      })
    }

    updateOutline(newOutline)
    setNewItemContent("")
  }

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return

    const sourceIndex = result.source.index
    const destinationIndex = result.destination.index

    const newOutline = Array.from(outline)
    const [reorderedItem] = newOutline.splice(sourceIndex, 1)
    newOutline.splice(destinationIndex, 0, reorderedItem)

    updateOutline(newOutline)
  }

  const renderOutlineItem = (item: OutlineItem, index: number) => (
    <Draggable key={item.id} draggableId={item.id} index={index}>
      {(provided) => (
        <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps} className="mb-2">
          <div className="flex items-center space-x-2">
            <Input
              value={item.content}
              onChange={(e) => {
                const newOutline = outline.map((i) => (i.id === item.id ? { ...i, content: e.target.value } : i))
                updateOutline(newOutline)
              }}
              className="flex-grow"
            />
            <Button onClick={() => addItem(item.id)} size="sm" variant="outline">
              Add Child
            </Button>
          </div>
          {item.children.length > 0 && (
            <div className="ml-4 mt-2">
              <DocumentOutline noteId={noteId} initialOutline={item.children} />
            </div>
          )}
        </div>
      )}
    </Draggable>
  )

  return (
    <div className="space-y-4">
      <div className="flex space-x-2">
        <Input
          type="text"
          placeholder="New outline item"
          value={newItemContent}
          onChange={(e) => setNewItemContent(e.target.value)}
        />
        <Button onClick={() => addItem()}>Add Item</Button>
      </div>
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="outline">
          {(provided) => (
            <div {...provided.droppableProps} ref={provided.innerRef}>
              {outline.map((item, index) => renderOutlineItem(item, index))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  )
}

