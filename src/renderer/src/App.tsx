import React, { useState } from 'react'
import { ProjectSelector } from './components/ProjectSelector'
import { SearchBar } from './components/SearchBar'
import { Toolbar } from './components/Toolbar'
import { GraphCanvas } from './components/GraphCanvas'
import { NodeDetail } from './components/NodeDetail'
import { useProjectScan } from './hooks/useProjectScan'
import { useGraphNavigation } from './hooks/useGraphNavigation'
import type { LayoutName } from './graph/layout-engine'

export default function App() {
  const { isLoading, progress, graphData, error, scan } = useProjectScan()
  const [layout, setLayout] = useState<LayoutName>('dagre-LR')
  const [zoom, setZoom] = useState(1)

  const {
    selectedNode,
    searchResultCount,
    direction,
    canvasRef,
    handleNodeSelect,
    handleNodeDblClick,
    handleSearch,
    toggleDirection,
    fitView
  } = useGraphNavigation(graphData)

  const handleZoomChange = (z: number) => {
    setZoom(z)
    canvasRef.current?.setZoom(z)
  }

  return (
    <div style={styles.root}>
      {/* 상단 툴바 */}
      <div style={styles.topBar}>
        <ProjectSelector
          onProjectSelected={scan}
          isLoading={isLoading}
          progress={isLoading ? progress : ''}
        />
        <div style={styles.divider} />
        {graphData && (
          <>
            <SearchBar onSearch={handleSearch} resultCount={searchResultCount} />
            <div style={styles.divider} />
            <Toolbar
              direction={direction}
              onDirectionToggle={toggleDirection}
              onFitView={fitView}
              layout={layout}
              onLayoutChange={setLayout}
              nodeCount={graphData.nodes.length}
              edgeCount={graphData.edges.length}
              zoom={zoom}
              onZoomChange={handleZoomChange}
            />
          </>
        )}
        {error && <span style={styles.error}>오류: {error}</span>}
        {!isLoading && progress && !error && (
          <span style={styles.progressDone}>{progress}</span>
        )}
      </div>

      {/* 메인 영역 */}
      <div style={styles.main}>
        {!graphData && !isLoading ? (
          <div style={styles.placeholder}>
            <div style={styles.placeholderTitle}>Call Flow Analyzer</div>
            <div style={styles.placeholderDesc}>
              프로젝트 폴더를 선택하면 Vue → Controller → ServiceMap → iBATIS → DB
              <br />
              호출 흐름이 다이어그램으로 시각화됩니다.
            </div>
            <div style={styles.placeholderHints}>
              <div>• <b>Vue 프로젝트</b>: axiosCall(ac: 'CODE') 패턴 추출</div>
              <div>• <b>KSA 프로젝트</b>: model/*.html callQuery 패턴 추출</div>
              <div>• <b>ServiceMap.java</b>: AJAX 코드 → iBATIS query ID 매핑</div>
              <div>• <b>iBATIS XML</b>: EXEC SP_NAME 추출</div>
              <div>• <b>SQL 파일</b>: 저장 프로시저/뷰/함수 파싱</div>
            </div>
          </div>
        ) : isLoading ? (
          <div style={styles.loading}>
            <div style={styles.spinner} />
            <div style={styles.loadingText}>{progress}</div>
          </div>
        ) : null}

        <GraphCanvas
          ref={canvasRef}
          graphData={graphData}
          layout={layout}
          onNodeSelect={handleNodeSelect}
          onNodeDblClick={handleNodeDblClick}
        />

        {selectedNode && (
          <NodeDetail node={selectedNode} onClose={() => handleNodeSelect(null)} />
        )}
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  root: {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    overflow: 'hidden',
    background: '#1e1e1e',
    color: '#d4d4d4'
  },
  topBar: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '8px 12px',
    background: '#2d2d2d',
    borderBottom: '1px solid #333',
    flexWrap: 'wrap',
    minHeight: 48,
    flexShrink: 0
  },
  divider: {
    width: 1,
    height: 24,
    background: '#444'
  },
  main: {
    flex: 1,
    display: 'flex',
    overflow: 'hidden',
    position: 'relative'
  },
  error: {
    color: '#f14c4c',
    fontSize: 12
  },
  progressDone: {
    color: '#4ec9b0',
    fontSize: 12
  },
  placeholder: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    textAlign: 'center',
    zIndex: 1,
    pointerEvents: 'none'
  },
  placeholderTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#569cd6',
    marginBottom: 12
  },
  placeholderDesc: {
    fontSize: 14,
    color: '#888',
    lineHeight: 2,
    marginBottom: 20
  },
  placeholderHints: {
    fontSize: 13,
    color: '#555',
    textAlign: 'left',
    display: 'inline-block',
    lineHeight: 2
  },
  loading: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 16,
    zIndex: 2
  },
  spinner: {
    width: 40,
    height: 40,
    border: '3px solid #333',
    borderTop: '3px solid #569cd6',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite'
  },
  loadingText: {
    color: '#9cdcfe',
    fontSize: 14
  }
}
