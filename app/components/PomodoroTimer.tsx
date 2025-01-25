"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Bell } from "lucide-react"

export default function PomodoroTimer() {
  const [time, setTime] = useState(25 * 60)
  const [isActive, setIsActive] = useState(false)
  const [isBreak, setIsBreak] = useState(false)

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null

    if (isActive && time > 0) {
      interval = setInterval(() => {
        setTime((time) => time - 1)
      }, 1000)
    } else if (time === 0) {
      if (isBreak) {
        setTime(25 * 60)
        setIsBreak(false)
      } else {
        setTime(5 * 60)
        setIsBreak(true)
      }
      setIsActive(false)
      playAlarm()
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isActive, time, isBreak])

  const toggleTimer = () => {
    setIsActive(!isActive)
  }

  const resetTimer = () => {
    setTime(25 * 60)
    setIsActive(false)
    setIsBreak(false)
  }

  const playAlarm = () => {
    const audio = new Audio("/alarm.mp3")
    audio.play()
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const progress = isBreak ? ((5 * 60 - time) / (5 * 60)) * 100 : ((25 * 60 - time) / (25 * 60)) * 100

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">{isBreak ? "Break Time" : "Focus Time"}</h2>
      <div className="text-4xl font-bold text-center">{formatTime(time)}</div>
      <Progress value={progress} className="w-full" />
      <div className="flex justify-center space-x-2">
        <Button onClick={toggleTimer}>{isActive ? "Pause" : "Start"}</Button>
        <Button onClick={resetTimer} variant="outline">
          Reset
        </Button>
      </div>
    </div>
  )
}

