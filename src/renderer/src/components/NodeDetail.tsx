import React from 'react'
import type { GraphNode } from '../types/graph'
import { NODE_COLORS, LAYER_LABELS } from '../types/graph'

interface NodeDetailProps {
  node: GraphNode | null
  onClose: () => void
}

export function NodeDetail({ node, onClose }: NodeDetailProps) {
  if (!node) return null

  const handleOpenVscode = () => {
    window.electronAPI.openVscode(node.filePath, node.lineNumber)
  }

  const shortPath = node.filePath.replace(/\\/g, '/').split('/').slice(-3).join('/')

  return (
    <div style={styles.panel}>
      <div style={styles.header}>
        <span
          style={{
            ...styles.badge,
            background: NODE_COLORS[node.type]
          }}
        >
          {LAYER_LABELS[node.layer]}
        </span>
        <button onClick={onClose} style={styles.close}>
          ✕
        </button>
      </div>

      <div style={styles.label}>{node.label}</div>

      <div style={styles.section}>
        <div style={styles.fieldRow}>
          <span style={styles.fieldKey}>타입</span>
          <span style={styles.fieldVal}>{node.type}</span>
        </div>
        <div style={styles.fieldRow}>
          <span style={styles.fieldKey}>파일</span>
          <span style={styles.fieldVal} title={node.filePath}>
            .../{shortPath}
          </span>
        </div>
        {node.lineNumber && (
          <div style={styles.fieldRow}>
            <span style={styles.fieldKey}>라인</span>
            <span style={styles.fieldVal}>{node.lineNumber}</span>
          </div>
        )}
      </div>

      {Object.keys(node.metadata).length > 0 && (
        <div style={styles.section}>
          {Object.entries(node.metadata).map(([k, v]) =>
            v ? (
              <div key={k} style={styles.fieldRow}>
                <span style={styles.fieldKey}>{k}</span>
                <span style={{ ...styles.fieldVal, wordBreak: 'break-all' }}>
                  {v.length > 80 ? v.substring(0, 80) + '...' : v}
                </span>
              </div>
            ) : null
          )}
        </div>
      )}

      <button onClick={handleOpenVscode} style={styles.openBtn}>
        VS Code에서 열기
      </button>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  panel: {
    width: 280,
    background: '#252526',
    borderLeft: '1px solid #333',
    padding: 16,
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    overflowY: 'auto',
    flexShrink: 0
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  badge: {
    padding: '2px 8px',
    borderRadius: 10,
    fontSize: 11,
    color: '#fff',
    fontWeight: 'bold'
  },
  close: {
    background: 'transparent',
    border: 'none',
    color: '#888',
    cursor: 'pointer',
    fontSize: 14
  },
  label: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#d4d4d4',
    wordBreak: 'break-all',
    whiteSpace: 'pre-wrap'
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    borderTop: '1px solid #333',
    paddingTop: 8
  },
  fieldRow: {
    display: 'flex',
    gap: 8,
    fontSize: 11,
    alignItems: 'flex-start'
  },
  fieldKey: {
    color: '#888',
    flexShrink: 0,
    width: 70
  },
  fieldVal: {
    color: '#9cdcfe',
    flex: 1
  },
  openBtn: {
    marginTop: 'auto',
    padding: '8px',
    background: '#0e639c',
    color: '#fff',
    border: 'none',
    borderRadius: 4,
    cursor: 'pointer',
    fontSize: 12
  }
}
