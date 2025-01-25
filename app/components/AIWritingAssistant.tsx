"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useCompletion } from "ai/react"
import { saveAIPrompt, getAIPrompts } from "../actions"

interface AIPrompt {
  id: string
  prompt: string
  response: string
  created_at: string
}

export default function AIWritingAssistant() {
  const [savedPrompts, setSavedPrompts] = useState<AIPrompt[]>([])

  const { completion, input, handleInputChange, handleSubmit, isLoading } = useCompletion({
    api: "/api/writing-assistant",
  })

  useEffect(() => {
    fetchSavedPrompts()
  }, [])

  const fetchSavedPrompts = async () => {
    const { data, error } = await getAIPrompts()
    if (error) {
      console.error("Error fetching AI prompts:", error)
    } else if (data) {
      setSavedPrompts(data)
    }
  }

  const handleSave = async () => {
    if (input && completion) {
      const { success, data, error } = await saveAIPrompt(input, completion)
      if (error) {
        console.error("Error saving AI prompt:", error)
      } else if (success && data) {
        setSavedPrompts([data[0], ...savedPrompts])
      }
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Textarea placeholder="Enter your writing prompt here..." value={input} onChange={handleInputChange} rows={4} />
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Generating..." : "Generate"}
        </Button>
      </form>
      {completion && (
        <Card>
          <CardHeader>
            <CardTitle>AI Response</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{completion}</p>
            <Button onClick={handleSave} className="mt-4">
              Save Response
            </Button>
          </CardContent>
        </Card>
      )}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Saved Prompts and Responses</h2>
        {savedPrompts.map((item) => (
          <Card key={item.id}>
            <CardHeader>
              <CardTitle>Prompt: {item.prompt}</CardTitle>
            </CardHeader>
            <CardContent>
              <p>{item.response}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

