"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar } from "@/components/ui/calendar"
import { format } from "date-fns"
import { createMeeting, getMeetings } from "../actions"

interface Meeting {
  id: string
  title: string
  description: string
  start_time: string
  end_time: string
  attendees: string[]
}

export default function MeetingScheduler() {
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [startDate, setStartDate] = useState<Date | undefined>(new Date())
  const [endDate, setEndDate] = useState<Date | undefined>(new Date())
  const [attendees, setAttendees] = useState("")

  useEffect(() => {
    fetchMeetings()
  }, [])

  const fetchMeetings = async () => {
    const { data, error } = await getMeetings()
    if (error) {
      console.error("Error fetching meetings:", error)
    } else if (data) {
      setMeetings(data)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!startDate || !endDate) return

    const newMeeting = {
      title,
      description,
      start_time: startDate.toISOString(),
      end_time: endDate.toISOString(),
      attendees: attendees.split(",").map((email) => email.trim()),
    }

    const { success, data, error } = await createMeeting(newMeeting)

    if (error) {
      console.error("Error creating meeting:", error)
    } else if (success && data) {
      setMeetings([...meetings, data[0]])
      setTitle("")
      setDescription("")
      setStartDate(new Date())
      setEndDate(new Date())
      setAttendees("")
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          type="text"
          placeholder="Meeting Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
        <Textarea
          placeholder="Meeting Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <div className="flex space-x-4">
          <div>
            <label className="block text-sm font-medium mb-1">Start Date</label>
            <Calendar mode="single" selected={startDate} onSelect={setStartDate} className="rounded-md border" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">End Date</label>
            <Calendar mode="single" selected={endDate} onSelect={setEndDate} className="rounded-md border" />
          </div>
        </div>
        <Input
          type="text"
          placeholder="Attendees (comma-separated emails)"
          value={attendees}
          onChange={(e) => setAttendees(e.target.value)}
          required
        />
        <Button type="submit">Schedule Meeting</Button>
      </form>
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Scheduled Meetings</h2>
        {meetings.map((meeting) => (
          <Card key={meeting.id}>
            <CardHeader>
              <CardTitle>{meeting.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p>{meeting.description}</p>
              <p>Start: {format(new Date(meeting.start_time), "PPpp")}</p>
              <p>End: {format(new Date(meeting.end_time), "PPpp")}</p>
              <p>Attendees: {meeting.attendees.join(", ")}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

