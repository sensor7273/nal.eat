import React, { useState, useCallback } from 'react'

interface SearchBarProps {
  onSearch: (query: string) => void
  resultCount: number
}

export function SearchBar({ onSearch, resultCount }: SearchBarProps) {
  const [value, setValue] = useState('')

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const q = e.target.value
      setValue(q)
      onSearch(q)
    },
    [onSearch]
  )

  const handleClear = () => {
    setValue('')
    onSearch('')
  }

  return (
    <div style={styles.container}>
      <input
        type="text"
        value={value}
        onChange={handleChange}
        placeholder="노드 검색 (컴포넌트명, AJAX코드, SP명...)"
        style={styles.input}
      />
      {value && (
        <button onClick={handleClear} style={styles.clear}>
          ✕
        </button>
      )}
      {value && (
        <span style={styles.count}>{resultCount}개 매칭</span>
      )}
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    alignItems: 'center',
    gap: 6
  },
  input: {
    padding: '5px 10px',
    background: '#2d2d2d',
    color: '#d4d4d4',
    border: '1px solid #555',
    borderRadius: 4,
    fontSize: 12,
    width: 240,
    outline: 'none'
  },
  clear: {
    padding: '4px 8px',
    background: 'transparent',
    color: '#888',
    border: 'none',
    cursor: 'pointer',
    fontSize: 12
  },
  count: {
    fontSize: 11,
    color: '#9cdcfe',
    whiteSpace: 'nowrap'
  }
}
