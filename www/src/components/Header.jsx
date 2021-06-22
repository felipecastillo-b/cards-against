import React, { useState } from 'react'
import { Stack } from 'phosphor-react'
import Select from '@/components/Select'

const OPTIONS = [
  { label: 'ES', value: 'es' },
  { label: 'EN', value: 'en' }
]

export default function Header() {
  const [selected, setSelected] = useState(OPTIONS[0])

  return (
    <header className="flex p-2 space-x-2">
      <Stack width={32} height={32} />
      <h1 className="text-2xl">CAW</h1>
      <div className="flex-grow"></div>
      <Select
        options={OPTIONS}
        selected={selected}
        onChange={setSelected}
        className="w-20 text-gray-700"
      />
    </header>
  )
}