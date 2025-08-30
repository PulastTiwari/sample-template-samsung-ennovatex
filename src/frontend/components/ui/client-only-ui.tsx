"use client"

import React from 'react'
import SplashCursor from './splash-cursor'
import DockNav from './dock-nav'

type DockItem = {
  name: string
  url: string
  icon: string
}

export default function ClientOnlyUI({ items }: { items: DockItem[] }) {
  return (
    <>
      <SplashCursor />
      <DockNav items={items} />
    </>
  )
}
