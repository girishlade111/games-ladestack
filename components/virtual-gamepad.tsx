"use client"

import { useState, useEffect, useCallback } from "react"
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Circle, Square } from "lucide-react"
import { Button } from "@/components/ui/button"

function getKeyCode(key: string) {
  switch (key) {
    case "ArrowUp": return 38
    case "ArrowDown": return 40
    case "ArrowLeft": return 37
    case "ArrowRight": return 39
    case " ": return 32
    case "Enter": return 13
    default: return 0
  }
}

export default function VirtualGamepad() {
  const [isTouch, setIsTouch] = useState(false)

  useEffect(() => {
    // Check if the device supports touch
    const checkTouch = () => {
      setIsTouch(
        "ontouchstart" in window ||
        navigator.maxTouchPoints > 0 ||
        // @ts-ignore
        (window.DocumentTouch && document instanceof window.DocumentTouch)
      )
    }
    checkTouch()
  }, [])

  const handleTouchStart = useCallback((e: React.TouchEvent | React.MouseEvent, key: string, code: string) => {
    e.preventDefault() // Prevent default touch behavior like scrolling
    const downEvent = new KeyboardEvent("keydown", {
      key,
      code,
      keyCode: getKeyCode(key),
      which: getKeyCode(key),
      bubbles: true,
      cancelable: true,
    })
    window.dispatchEvent(downEvent)
  }, [])

  const handleTouchEnd = useCallback((e: React.TouchEvent | React.MouseEvent, key: string, code: string) => {
    e.preventDefault()
    const upEvent = new KeyboardEvent("keyup", {
      key,
      code,
      keyCode: getKeyCode(key),
      which: getKeyCode(key),
      bubbles: true,
      cancelable: true,
    })
    window.dispatchEvent(upEvent)
  }, [])

  if (!isTouch) return null

  const ControlButton = ({ 
    icon: Icon, 
    keyName, 
    code,
    className = "" 
  }: { 
    icon: any, 
    keyName: string, 
    code: string,
    className?: string 
  }) => (
    <Button
      variant="secondary"
      size="icon"
      className={`w-14 h-14 rounded-full bg-black/40 backdrop-blur-md border border-white/20 text-white shadow-lg active:scale-95 active:bg-black/60 transition-all ${className}`}
      onTouchStart={(e) => handleTouchStart(e, keyName, code)}
      onTouchEnd={(e) => handleTouchEnd(e, keyName, code)}
      onMouseDown={(e) => handleTouchStart(e, keyName, code)}
      onMouseUp={(e) => handleTouchEnd(e, keyName, code)}
      onMouseLeave={(e) => handleTouchEnd(e, keyName, code)}
    >
      <Icon className="w-8 h-8" />
    </Button>
  )

  return (
    <div className="fixed bottom-6 left-0 w-full px-6 flex justify-between items-end z-[100] select-none pointer-events-none touch-none">
      {/* D-Pad */}
      <div className="relative w-40 h-40 pointer-events-auto">
        <ControlButton 
          icon={ArrowUp} 
          keyName="ArrowUp" 
          code="ArrowUp" 
          className="absolute top-0 left-1/2 -translate-x-1/2"
        />
        <ControlButton 
          icon={ArrowLeft} 
          keyName="ArrowLeft" 
          code="ArrowLeft" 
          className="absolute top-1/2 left-0 -translate-y-1/2"
        />
        <ControlButton 
          icon={ArrowRight} 
          keyName="ArrowRight" 
          code="ArrowRight" 
          className="absolute top-1/2 right-0 -translate-y-1/2"
        />
        <ControlButton 
          icon={ArrowDown} 
          keyName="ArrowDown" 
          code="ArrowDown" 
          className="absolute bottom-0 left-1/2 -translate-x-1/2"
        />
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4 pointer-events-auto mb-4">
        <ControlButton 
          icon={Square} 
          keyName="Enter" 
          code="Enter" 
          className="w-16 h-16 bg-blue-500/80 border-blue-500 text-white hover:bg-blue-600 mt-8"
        />
        <ControlButton 
          icon={Circle} 
          keyName=" " 
          code="Space" 
          className="w-16 h-16 bg-red-500/80 border-red-500 text-white hover:bg-red-600"
        />
      </div>
    </div>
  )
}
