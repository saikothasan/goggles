"use client"

import { useState, useEffect } from "react"
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardHeader, CardContent } from "@/components/ui/card"

interface Task {
  id: string
  content: string
  position: number
}

interface Column {
  id: string
  title: string
  tasks: Task[]
}

interface Board {
  id: string
  title: string
  columns: Column[]
}

export default function KanbanBoard() {
  const [board, setBoard] = useState<Board | null>(null)
  const [newColumnTitle, setNewColumnTitle] = useState("")
  const [newTaskContent, setNewTaskContent] = useState("")

  useEffect(() => {
    fetchBoard()
  }, [])

  const fetchBoard = async () => {
    const { data: boardData, error: boardError } = await supabase.from("boards").select("*").single()

    if (boardError) {
      console.error("Error fetching board:", boardError)
      return
    }

    const { data: columnsData, error: columnsError } = await supabase
      .from("columns")
      .select("*")
      .eq("board_id", boardData.id)
      .order("position", { ascending: true })

    if (columnsError) {
      console.error("Error fetching columns:", columnsError)
      return
    }

    const columnsWithTasks = await Promise.all(
      columnsData.map(async (column) => {
        const { data: tasksData, error: tasksError } = await supabase
          .from("tasks")
          .select("*")
          .eq("column_id", column.id)
          .order("position", { ascending: true })

        if (tasksError) {
          console.error("Error fetching tasks:", tasksError)
          return column
        }

        return { ...column, tasks: tasksData }
      }),
    )

    setBoard({ ...boardData, columns: columnsWithTasks })
  }

  const handleDragEnd = async (result: any) => {
    if (!result.destination) return

    const { source, destination } = result

    if (source.droppableId === destination.droppableId) {
      // Reorder within the same column
      const column = board!.columns.find((col) => col.id === source.droppableId)
      const newTasks = Array.from(column!.tasks)
      const [reorderedTask] = newTasks.splice(source.index, 1)
      newTasks.splice(destination.index, 0, reorderedTask)

      const updatedColumns = board!.columns.map((col) =>
        col.id === source.droppableId ? { ...col, tasks: newTasks } : col,
      )

      setBoard({ ...board!, columns: updatedColumns })

      // Update task order in the database
      await supabase.from("tasks").upsert(
        newTasks.map((task, index) => ({
          id: task.id,
          position: index,
        })),
      )
    } else {
      // Move task between columns
      const sourceColumn = board!.columns.find((col) => col.id === source.droppableId)
      const destColumn = board!.columns.find((col) => col.id === destination.droppableId)
      const sourceTasks = Array.from(sourceColumn!.tasks)
      const destTasks = Array.from(destColumn!.tasks)
      const [movedTask] = sourceTasks.splice(source.index, 1)
      destTasks.splice(destination.index, 0, movedTask)

      const updatedColumns = board!.columns.map((col) => {
        if (col.id === source.droppableId) {
          return { ...col, tasks: sourceTasks }
        }
        if (col.id === destination.droppableId) {
          return { ...col, tasks: destTasks }
        }
        return col
      })

      setBoard({ ...board!, columns: updatedColumns })

      // Update task column and order in the database
      await supabase
        .from("tasks")
        .update({ column_id: destination.droppableId, position: destination.index })
        .eq("id", movedTask.id)

      // Update order of tasks in the destination column
      await supabase.from("tasks").upsert(
        destTasks.map((task, index) => ({
          id: task.id,
          position: index,
        })),
      )
    }
  }

  const handleAddColumn = async () => {
    if (!newColumnTitle) return

    const { data, error } = await supabase
      .from("columns")
      .insert({
        board_id: board!.id,
        title: newColumnTitle,
        position: board!.columns.length,
      })
      .select()
      .single()

    if (error) {
      console.error("Error adding column:", error)
      return
    }

    setBoard({
      ...board!,
      columns: [...board!.columns, { ...data, tasks: [] }],
    })
    setNewColumnTitle("")
  }

  const handleAddTask = async (columnId: string) => {
    if (!newTaskContent) return

    const column = board!.columns.find((col) => col.id === columnId)

    const { data, error } = await supabase
      .from("tasks")
      .insert({
        column_id: columnId,
        content: newTaskContent,
        position: column!.tasks.length,
      })
      .select()
      .single()

    if (error) {
      console.error("Error adding task:", error)
      return
    }

    const updatedColumns = board!.columns.map((col) =>
      col.id === columnId ? { ...col, tasks: [...col.tasks, data] } : col,
    )

    setBoard({ ...board!, columns: updatedColumns })
    setNewTaskContent("")
  }

  if (!board) return <div>Loading...</div>

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">{board.title}</h2>
      <div className="flex space-x-2 mb-4">
        <Input
          type="text"
          placeholder="New column title"
          value={newColumnTitle}
          onChange={(e) => setNewColumnTitle(e.target.value)}
        />
        <Button onClick={handleAddColumn}>Add Column</Button>
      </div>
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex space-x-4 overflow-x-auto pb-4">
          {board.columns.map((column) => (
            <Droppable key={column.id} droppableId={column.id}>
              {(provided) => (
                <Card className="w-64 flex-shrink-0" {...provided.droppableProps} ref={provided.innerRef}>
                  <CardHeader>
                    <h3 className="font-semibold">{column.title}</h3>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {column.tasks.map((task, index) => (
                      <Draggable key={task.id} draggableId={task.id} index={index}>
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className="bg-secondary p-2 rounded"
                          >
                            {task.content}
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                    <div className="mt-2">
                      <Input
                        type="text"
                        placeholder="New task"
                        value={newTaskContent}
                        onChange={(e) => setNewTaskContent(e.target.value)}
                      />
                      <Button className="mt-2 w-full" onClick={() => handleAddTask(column.id)}>
                        Add Task
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </Droppable>
          ))}
        </div>
      </DragDropContext>
    </div>
  )
}

