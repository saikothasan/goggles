"use client"

import { useState, useEffect } from "react"
import { getNoteVersions, restoreNoteVersion } from "../actions"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { History, RotateCcw } from "lucide-react"

interface NoteVersion {
  id: string
  title: string
  content: string
  category: string
  tags: string[]
  created_at: string
}

export default function NoteVersions({ noteId }: { noteId: string }) {
  const [versions, setVersions] = useState<NoteVersion[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchVersions() {
      const { data, error } = await getNoteVersions(noteId)
      if (data) {
        setVersions(data)
      }
      setLoading(false)
    }
    fetchVersions()
  }, [noteId])

  const handleRestore = async (versionId: string) => {
    const { success } = await restoreNoteVersion(noteId, versionId)
    if (success) {
      // Refresh the versions list
      const { data } = await getNoteVersions(noteId)
      if (data) {
        setVersions(data)
      }
    }
  }

  if (loading) {
    return <div>Loading versions...</div>
  }

  return (
    <div className="mt-4">
      <h3 className="text-lg font-semibold mb-2">Version History</h3>
      <ScrollArea className="h-[200px]">
        {versions.map((version, index) => (
          <div key={version.id} className="flex justify-between items-center py-2 border-b">
            <div>
              <span className="font-medium">Version {versions.length - index}</span>
              <span className="ml-2 text-sm text-gray-500">{new Date(version.created_at).toLocaleString()}</span>
            </div>
            <Button onClick={() => handleRestore(version.id)} size="sm">
              <RotateCcw className="mr-2 h-4 w-4" />
              Restore
            </Button>
          </div>
        ))}
      </ScrollArea>
    </div>
  )
}

