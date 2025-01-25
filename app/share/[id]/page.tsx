import { getSharedNote } from "@/app/actions"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default async function SharedNotePage({ params }: { params: { id: string } }) {
  const { data: note, error } = await getSharedNote(params.id)

  if (error) {
    return <div>Error: {error}</div>
  }

  if (!note) {
    return <div>Note not found</div>
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Shared Note</h1>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>{note.title}</CardTitle>
            <div className="flex space-x-2">
              <Badge>{note.category}</Badge>
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
          <div dangerouslySetInnerHTML={{ __html: note.content }} />
        </CardContent>
      </Card>
    </div>
  )
}

