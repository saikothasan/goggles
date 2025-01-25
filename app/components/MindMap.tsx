"use client"

import { useState, useEffect, useRef } from "react"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface Node {
  id: string
  content: string
  x: number
  y: number
  parentId: string | null
}

export default function MindMap() {
  const [nodes, setNodes] = useState<Node[]>([])
  const [newNodeContent, setNewNodeContent] = useState("")
  const [selectedNode, setSelectedNode] = useState<string | null>(null)
  const svgRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    fetchNodes()
  }, [])

  const fetchNodes = async () => {
    const { data, error } = await supabase.from("mind_map_nodes").select("*").order("id", { ascending: true })

    if (error) {
      console.error("Error fetching nodes:", error)
      return
    }

    setNodes(data)
  }

  const handleAddNode = async () => {
    if (!newNodeContent) return

    const { data, error } = await supabase
      .from("mind_map_nodes")
      .insert({
        content: newNodeContent,
        x: Math.random() * 500,
        y: Math.random() * 500,
        parent_id: selectedNode,
      })
      .select()
      .single()

    if (error) {
      console.error("Error adding node:", error)
      return
    }

    setNodes([...nodes, data])
    setNewNodeContent("")
    setSelectedNode(null)
  }

  const handleNodeClick = (nodeId: string) => {
    setSelectedNode(nodeId === selectedNode ? null : nodeId)
  }

  const handleNodeDrag = async (nodeId: string, x: number, y: number) => {
    const updatedNodes = nodes.map((node) => (node.id === nodeId ? { ...node, x, y } : node))
    setNodes(updatedNodes)

    await supabase.from("mind_map_nodes").update({ x, y }).eq("id", nodeId)
  }

  return (
    <div className="space-y-4">
      <div className="flex space-x-2">
        <Input
          type="text"
          placeholder="New node content"
          value={newNodeContent}
          onChange={(e) => setNewNodeContent(e.target.value)}
        />
        <Button onClick={handleAddNode}>Add Node</Button>
      </div>
      <svg ref={svgRef} width="100%" height="600" style={{ border: "1px solid #ccc" }}>
        {nodes.map((node) => (
          <g key={node.id}>
            {node.parentId && (
              <line
                x1={nodes.find((n) => n.id === node.parentId)?.x || 0}
                y1={nodes.find((n) => n.id === node.parentId)?.y || 0}
                x2={node.x}
                y2={node.y}
                stroke="#999"
              />
            )}
            <circle
              cx={node.x}
              cy={node.y}
              r="20"
              fill={selectedNode === node.id ? "#007bff" : "#fff"}
              stroke="#007bff"
              strokeWidth="2"
              onClick={() => handleNodeClick(node.id)}
              onMouseDown={(e) => {
                const startX = e.clientX
                const startY = e.clientY
                const handleMouseMove = (e: MouseEvent) => {
                  const dx = e.clientX - startX
                  const dy = e.clientY - startY
                  handleNodeDrag(node.id, node.x + dx, node.y + dy)
                }
                const handleMouseUp = () => {
                  document.removeEventListener("mousemove", handleMouseMove)
                  document.removeEventListener("mouseup", handleMouseUp)
                }
                document.addEventListener("mousemove", handleMouseMove)
                document.addEventListener("mouseup", handleMouseUp)
              }}
            />
            <text x={node.x} y={node.y} textAnchor="middle" alignmentBaseline="middle" fontSize="12">
              {node.content}
            </text>
          </g>
        ))}
      </svg>
    </div>
  )
}

