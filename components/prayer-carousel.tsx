'use client'

import { useRef, useState, useEffect, useCallback } from 'react'
import { motion, useMotionValue, animate, PanInfo } from 'framer-motion'
import { PrayerCardData, PrayerMeta } from '@/types'
import PrayerCard from './prayer-card'
import NavigationDots from './navigation-dots'

interface Props {
  prayers: PrayerMeta[]
  cards: PrayerCardData[]
  initialIndex: number
}

const DRAG_THRESHOLD    = 40   // px
const VELOCITY_THRESHOLD = 400  // px/s

export default function PrayerCarousel({ prayers, cards, initialIndex }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [current, setCurrent]     = useState(() => initialIndex)
  const [width, setWidth]         = useState(0)
  const [dragging, setDragging]   = useState(false)
  const x = useMotionValue(0)

  // Measure container width
  useEffect(() => {
    const measure = () => {
      if (containerRef.current) {
        setWidth(containerRef.current.offsetWidth)
      }
    }
    measure()
    const ro = new ResizeObserver(measure)
    if (containerRef.current) ro.observe(containerRef.current)
    return () => ro.disconnect()
  }, [])

  // Snap to initialIndex when width is known
  useEffect(() => {
    if (width > 0) {
      x.set(-initialIndex * width)
    }
  }, [width, initialIndex, x])

  const snapTo = useCallback(
    (index: number) => {
      const clamped = Math.max(0, Math.min(cards.length - 1, index))
      setCurrent(clamped)
      animate(x, -clamped * width, {
        type: 'spring',
        stiffness: 380,
        damping:   38,
        mass:       0.8,
      })
    },
    [cards.length, width, x]
  )

  const handleDragEnd = useCallback(
    (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      setDragging(false)
      const goNext = info.velocity.x < -VELOCITY_THRESHOLD || info.offset.x < -DRAG_THRESHOLD
      const goPrev = info.velocity.x >  VELOCITY_THRESHOLD || info.offset.x >  DRAG_THRESHOLD
      if (goNext) snapTo(current + 1)
      else if (goPrev) snapTo(current - 1)
      else snapTo(current)
    },
    [current, snapTo]
  )

  return (
    <div className="flex flex-col h-full">
      {/* Carousel viewport */}
      <div
        ref={containerRef}
        className="relative flex-1 overflow-hidden"
        style={{ touchAction: 'pan-y' }}
      >
        {width > 0 && (
          <motion.div
            className="absolute inset-0 flex"
            style={{ x, width: cards.length * width }}
            drag="x"
            dragConstraints={{
              left:  -(cards.length - 1) * width,
              right: 0,
            }}
            dragElastic={0.07}
            dragTransition={{ bounceStiffness: 600, bounceDamping: 40 }}
            onDragStart={() => setDragging(true)}
            onDragEnd={handleDragEnd}
          >
            {cards.map((card, i) => (
              <div
                key={card.prayer.key}
                className="h-full flex-shrink-0 relative"
                style={{ width }}
              >
                <PrayerCard data={card} isActive={current === i && !dragging} />
              </div>
            ))}
          </motion.div>
        )}
      </div>

      {/* Navigation dots */}
      <div className="shrink-0 bg-[#080810]">
        <NavigationDots
          prayers={prayers}
          current={current}
          onSelect={snapTo}
        />
      </div>
    </div>
  )
}
