import React, { useState } from 'react'

interface ProjectSelectorProps {
  onProjectSelected: (path: string) => void
  isLoading: boolean
  progress: string
}

export function ProjectSelector({ onProjectSelected, isLoading, progress }: ProjectSelectorProps) {
  const [recentPaths, setRecentPaths] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('recentPaths') || '[]')
    } catch {
      return []
    }
  })

  const handleSelect = async () => {
    const path = await window.electronAPI.selectFolder()
    if (path) {
      const updated = [path, ...recentPaths.filter((p) => p !== path)].slice(0, 5)
      setRecentPaths(updated)
      localStorage.setItem('recentPaths', JSON.stringify(updated))
      onProjectSelected(path)
    }
  }

  const handleRecent = (path: string) => {
    onProjectSelected(path)
  }

  return (
    <div style={styles.container}>
      <button onClick={handleSelect} disabled={isLoading} style={styles.button}>
        {isLoading ? '분석 중...' : '프로젝트 폴더 선택'}
      </button>
      {progress && <span style={styles.progress}>{progress}</span>}
      {recentPaths.length > 0 && (
        <div style={styles.recent}>
          {recentPaths.map((p) => (
            <button
              key={p}
              onClick={() => handleRecent(p)}
              disabled={isLoading}
              style={styles.recentItem}
              title={p}
            >
              {p.split(/[/\\]/).pop() || p}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    alignItems: 'center',
    gap: 8
  },
  button: {
    padding: '6px 14px',
    background: '#0e639c',
    color: '#fff',
    border: 'none',
    borderRadius: 4,
    cursor: 'pointer',
    fontSize: 13,
    whiteSpace: 'nowrap'
  },
  progress: {
    fontSize: 12,
    color: '#9cdcfe',
    whiteSpace: 'nowrap'
  },
  recent: {
    display: 'flex',
    gap: 4
  },
  recentItem: {
    padding: '4px 10px',
    background: '#333',
    color: '#d4d4d4',
    border: '1px solid #555',
    borderRadius: 4,
    cursor: 'pointer',
    fontSize: 12,
    maxWidth: 120,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  }
}
