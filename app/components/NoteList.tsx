import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { deleteNote, archiveNote, unarchiveNote } from "../actions"
import NoteForm from "./NoteForm"
import NoteVersions from "./NoteVersions"
import NoteLinking from "./NoteLinking"
import CollaborativeEditor from "./CollaborativeEditor"
import DocumentOutline from "./DocumentOutline"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Archive, ArchiveRestoreIcon as Unarchive, Share2, History, LinkIcon, Users, FileText } from "lucide-react"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

interface NoteListProps {
  searchParams?: { q?: string }
  isArchived: boolean
}

export default async function NoteList({ searchParams, isArchived }: NoteListProps) {
  const query = searchParams?.q || ""

  const { data: notes, error } = await supabase
    .from("notes")
    .select("*")
    .eq("is_archived", isArchived)
    .or(`title.ilike.%${query}%,content.ilike.%${query}%`)
    .order("created_at", { ascending: false })

  if (error) {
    return <div className="text-destructive">Error: {error.message}</div>
  }

  if (notes.length === 0) {
    return <div className="text-muted-foreground">No notes found.</div>
  }

  return (
    <div className="space-y-6">
      {notes.map((note) => (
        <Card key={note.id} className="w-full">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="text-xl">{note.title}</CardTitle>
              <div className="flex space-x-2">
                <Badge variant="secondary">{note.category}</Badge>
                {note.tags &&
                  note.tags.map((tag: string) => (
                    <Badge key={tag} variant="outline">
                      {tag}
                    </Badge>
                  ))}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <CollaborativeEditor
              noteId={note.id}
              initialContent={note.content}
              collaborators={note.collaborators || []}
            />
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <div className="flex justify-between w-full">
              <div className="flex space-x-2">
                <NoteForm
                  id={note.id}
                  initialTitle={note.title}
                  initialContent={note.content}
                  initialCategory={note.category}
                  initialTags={note.tags}
                />
                <Button variant="destructive" onClick={() => deleteNote(note.id)}>
                  Delete
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => (isArchived ? unarchiveNote(note.id) : archiveNote(note.id))}
                >
                  {isArchived ? <Unarchive className="mr-2 h-4 w-4" /> : <Archive className="mr-2 h-4 w-4" />}
                  {isArchived ? "Unarchive" : "Archive"}
                </Button>
              </div>
              <Link href={`/share/${note.share_id}`} passHref>
                <Button variant="outline">
                  <Share2 className="mr-2 h-4 w-4" />
                  Share
                </Button>
              </Link>
            </div>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="versions">
                <AccordionTrigger>
                  <History className="mr-2 h-4 w-4" />
                  Version History
                </AccordionTrigger>
                <AccordionContent>
                  <NoteVersions noteId={note.id} />
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="linking">
                <AccordionTrigger>
                  <LinkIcon className="mr-2 h-4 w-4" />
                  Linked Notes
                </AccordionTrigger>
                <AccordionContent>
                  <NoteLinking noteId={note.id} />
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="collaborators">
                <AccordionTrigger>
                  <Users className="mr-2 h-4 w-4" />
                  Collaborators
                </AccordionTrigger>
                <AccordionContent>
                  <CollaborativeEditor
                    noteId={note.id}
                    initialContent={note.content}
                    collaborators={note.collaborators || []}
                  />
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="outline">
                <AccordionTrigger>
                  <FileText className="mr-2 h-4 w-4" />
                  Document Outline
                </AccordionTrigger>
                <AccordionContent>
                  <DocumentOutline noteId={note.id} initialOutline={note.outline || []} />
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardFooter>
        </Card>
      ))}
    </div>
  )
}

