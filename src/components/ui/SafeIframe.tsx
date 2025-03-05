'use client'

import { useState, useEffect } from 'react'

export function SafeIframe({ src, title }: { src: string; title: string }) {
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!isMounted) {
    return <div className="w-full h-full animate-pulse bg-gray-100" />
  }

  return (
    <iframe
      src={src}
      title={title}
      className="w-full h-full border-0"
      allowFullScreen
    />
  )
} 