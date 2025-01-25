"use server"

import { revalidatePath } from "next/cache"
import { supabase } from "@/lib/supabase"

export async function addNote(formData: FormData) {
  const title = formData.get("title") as string
  const content = formData.get("content") as string
  const category = formData.get("category") as string
  const tags = (formData.get("tags") as string).split(",").map((tag) => tag.trim())

  const { data, error } = await supabase
    .from("notes")
    .insert({ title, content, category, tags, version_count: 1 })
    .select()
    .single()

  if (error) {
    return { error: error.message }
  }

  await supabase.from("note_versions").insert({ note_id: data.id, title, content, category, tags })

  revalidatePath("/")
  return { success: true, data }
}

export async function updateNote(formData: FormData) {
  const id = formData.get("id") as string
  const title = formData.get("title") as string
  const content = formData.get("content") as string
  const category = formData.get("category") as string
  const tags = (formData.get("tags") as string).split(",").map((tag) => tag.trim())

  const { data: oldNote, error: fetchError } = await supabase.from("notes").select().eq("id", id).single()

  if (fetchError) {
    return { error: fetchError.message }
  }

  const { error: updateError } = await supabase
    .from("notes")
    .update({ title, content, category, tags, version_count: oldNote.version_count + 1 })
    .eq("id", id)

  if (updateError) {
    return { error: updateError.message }
  }

  await supabase.from("note_versions").insert({ note_id: id, title, content, category, tags })

  revalidatePath("/")
  return { success: true }
}

export async function deleteNote(id: string) {
  const { error } = await supabase.from("notes").delete().eq("id", id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/")
  return { success: true }
}

export async function searchNotes(query: string) {
  const { data, error } = await supabase
    .from("notes")
    .select()
    .or(`title.ilike.%${query}%,content.ilike.%${query}%`)
    .order("created_at", { ascending: false })

  if (error) {
    return { error: error.message }
  }

  return { data }
}

export async function archiveNote(id: string) {
  const { error } = await supabase.from("notes").update({ is_archived: true }).eq("id", id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/")
  return { success: true }
}

export async function unarchiveNote(id: string) {
  const { error } = await supabase.from("notes").update({ is_archived: false }).eq("id", id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/")
  return { success: true }
}

export async function getSharedNote(shareId: string) {
  const { data, error } = await supabase.from("notes").select().eq("share_id", shareId).single()

  if (error) {
    return { error: error.message }
  }

  return { data }
}

export async function getNoteVersions(noteId: string) {
  const { data, error } = await supabase
    .from("note_versions")
    .select("*")
    .eq("note_id", noteId)
    .order("created_at", { ascending: false })

  if (error) {
    return { error: error.message }
  }

  return { data }
}

export async function restoreNoteVersion(noteId: string, versionId: string) {
  const { data: versionData, error: versionError } = await supabase
    .from("note_versions")
    .select("*")
    .eq("id", versionId)
    .single()

  if (versionError) {
    return { error: versionError.message }
  }

  const { error: updateError } = await supabase
    .from("notes")
    .update({
      title: versionData.title,
      content: versionData.content,
      category: versionData.category,
      tags: versionData.tags,
      version_count: versionData.version_count + 1,
    })
    .eq("id", noteId)

  if (updateError) {
    return { error: updateError.message }
  }

  await supabase.from("note_versions").insert({
    note_id: noteId,
    title: versionData.title,
    content: versionData.content,
    category: versionData.category,
    tags: versionData.tags,
  })

  revalidatePath("/")
  return { success: true }
}

export async function getAnalytics() {
  const { data: totalNotes, error: notesError } = await supabase.from("notes").select("id", { count: "exact" })

  const { data: totalArchivedNotes, error: archivedError } = await supabase
    .from("notes")
    .select("id", { count: "exact" })
    .eq("is_archived", true)

  const { data: categoryCounts, error: categoryError } = await supabase
    .from("notes")
    .select("category")
    .then(({ data }) => {
      const counts: Record<string, number> = {}
      data?.forEach((note) => {
        counts[note.category] = (counts[note.category] || 0) + 1
      })
      return counts
    })

  if (notesError || archivedError || categoryError) {
    return { error: "Failed to fetch analytics data" }
  }

  return {
    totalNotes,
    totalArchivedNotes,
    categoryCounts,
  }
}

export async function getTags(query: string) {
  const { data, error } = await supabase.from("tags").select("name").ilike("name", `%${query}%`).limit(5)

  if (error) {
    return { error: error.message }
  }

  return { data: data.map((tag) => tag.name) }
}

export async function addTag(name: string) {
  const { data, error } = await supabase.from("tags").insert({ name }).select().single()

  if (error) {
    return { error: error.message }
  }

  return { data }
}

export async function linkNotes(sourceId: string, targetId: string) {
  const { data: sourceNote, error: sourceError } = await supabase
    .from("notes")
    .select("linked_notes")
    .eq("id", sourceId)
    .single()

  if (sourceError) {
    return { error: sourceError.message }
  }

  const updatedLinkedNotes = [...(sourceNote.linked_notes || []), targetId]

  const { error: updateError } = await supabase
    .from("notes")
    .update({ linked_notes: updatedLinkedNotes })
    .eq("id", sourceId)

  if (updateError) {
    return { error: updateError.message }
  }

  revalidatePath("/")
  return { success: true }
}

export async function getLinkedNotes(noteId: string) {
  const { data: note, error: noteError } = await supabase.from("notes").select("linked_notes").eq("id", noteId).single()

  if (noteError) {
    return { error: noteError.message }
  }

  if (!note.linked_notes || note.linked_notes.length === 0) {
    return { data: [] }
  }

  const { data: linkedNotes, error: linkedError } = await supabase
    .from("notes")
    .select("id, title")
    .in("id", note.linked_notes)

  if (linkedError) {
    return { error: linkedError.message }
  }

  return { data: linkedNotes }
}

export async function updateNoteOutline(noteId: string, outline: any) {
  const { error } = await supabase.from("notes").update({ outline }).eq("id", noteId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/")
  return { success: true }
}

export async function createMeeting(meeting: {
  title: string
  description: string
  start_time: string
  end_time: string
  attendees: string[]
}) {
  const { data, error } = await supabase.from("meetings").insert(meeting).select()

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/")
  return { success: true, data }
}

export async function getMeetings() {
  const { data, error } = await supabase.from("meetings").select("*").order("start_time", { ascending: true })

  if (error) {
    return { error: error.message }
  }

  return { data }
}

export async function saveAIPrompt(prompt: string, response: string) {
  const { data, error } = await supabase.from("ai_prompts").insert({ prompt, response }).select()

  if (error) {
    return { error: error.message }
  }

  return { success: true, data }
}

export async function getAIPrompts() {
  const { data, error } = await supabase.from("ai_prompts").select("*").order("created_at", { ascending: false })

  if (error) {
    return { error: error.message }
  }

  return { data }
}

