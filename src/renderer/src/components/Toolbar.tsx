import React from 'react'
import type { LayoutName } from '../graph/layout-engine'

interface ToolbarProps {
  direction: 'forward' | 'backward'
  onDirectionToggle: () => void
  onFitView: () => void
  layout: LayoutName
  onLayoutChange: (l: LayoutName) => void
  nodeCount: number
  edgeCount: number
  zoom: number
  onZoomChange: (z: number) => void
}

export function Toolbar({
  direction,
  onDirectionToggle,
  onFitView,
  layout,
  onLayoutChange,
  nodeCount,
  edgeCount,
  zoom,
  onZoomChange
}: ToolbarProps) {
  const zoomPct = Math.round(zoom * 100)

  return (
    <div style={styles.container}>
      <button
        onClick={onDirectionToggle}
        style={{
          ...styles.button,
          background: direction === 'forward' ? '#0e639c' : '#7b2fbe'
        }}
        title="순방향/역방향 전환"
      >
        {direction === 'forward' ? '→ 순방향' : '← 역방향'}
      </button>

      <select
        value={layout}
        onChange={(e) => onLayoutChange(e.target.value as LayoutName)}
        style={styles.select}
      >
        <option value="dagre-LR">좌→우 (권장)</option>
        <option value="dagre-TB">위→아래</option>
        <option value="cose">자유 배치</option>
        <option value="grid">격자</option>
      </select>

      <button onClick={onFitView} style={styles.button}>
        전체 맞춤
      </button>

      <div style={styles.divider} />

      {/* 줌 컨트롤 */}
      <button
        onClick={() => onZoomChange(Math.max(0.1, zoom - 0.1))}
        style={styles.zoomBtn}
        title="축소"
      >
        −
      </button>
      <input
        type="range"
        min={0.1}
        max={3}
        step={0.05}
        value={zoom}
        onChange={(e) => onZoomChange(parseFloat(e.target.value))}
        style={styles.slider}
        title={`줌: ${zoomPct}%`}
      />
      <button
        onClick={() => onZoomChange(Math.min(3, zoom + 0.1))}
        style={styles.zoomBtn}
        title="확대"
      >
        ＋
      </button>
      <span style={styles.zoomLabel}>{zoomPct}%</span>

      <div style={styles.divider} />

      <span style={styles.stats}>
        노드 {nodeCount} / 엣지 {edgeCount}
      </span>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    alignItems: 'center',
    gap: 6
  },
  button: {
    padding: '5px 12px',
    background: '#0e639c',
    color: '#fff',
    border: 'none',
    borderRadius: 4,
    cursor: 'pointer',
    fontSize: 12,
    whiteSpace: 'nowrap'
  },
  select: {
    padding: '5px 8px',
    background: '#2d2d2d',
    color: '#d4d4d4',
    border: '1px solid #555',
    borderRadius: 4,
    fontSize: 12
  },
  divider: {
    width: 1,
    height: 20,
    background: '#444',
    margin: '0 2px'
  },
  zoomBtn: {
    padding: '2px 8px',
    background: '#3a3a3a',
    color: '#d4d4d4',
    border: '1px solid #555',
    borderRadius: 3,
    cursor: 'pointer',
    fontSize: 14,
    lineHeight: 1,
    fontWeight: 'bold'
  },
  slider: {
    width: 100,
    accentColor: '#0e639c',
    cursor: 'pointer'
  },
  zoomLabel: {
    fontSize: 11,
    color: '#9cdcfe',
    minWidth: 36,
    textAlign: 'center'
  },
  stats: {
    fontSize: 11,
    color: '#888'
  }
}
