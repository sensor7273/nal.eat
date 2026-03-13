import { IpcMain, Dialog, Shell } from 'electron'
import * as fs from 'fs'
import * as path from 'path'
import * as iconv from 'iconv-lite'

export function setupIpcHandlers(ipcMain: IpcMain, dialog: Dialog, shell: Shell): void {
  // 폴더 선택 다이얼로그
  ipcMain.handle('select-folder', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory'],
      title: '프로젝트 폴더 선택'
    })
    if (result.canceled || result.filePaths.length === 0) return null
    return result.filePaths[0]
  })

  // 파일 읽기 (인코딩 자동 감지)
  ipcMain.handle('read-file', async (_event, filePath: string, encoding?: string) => {
    try {
      const buffer = fs.readFileSync(filePath)
      // UTF-16LE BOM 감지
      if (buffer.length >= 2 && buffer[0] === 0xff && buffer[1] === 0xfe) {
        return iconv.decode(buffer, 'UTF-16LE')
      }
      if (encoding) {
        return iconv.decode(buffer, encoding)
      }
      return buffer.toString('utf-8')
    } catch {
      return null
    }
  })

  // 디렉토리 내 파일 목록 (재귀)
  ipcMain.handle('list-files', async (_event, dirPath: string, extensions: string[]) => {
    const results: string[] = []
    if (!fs.existsSync(dirPath)) return results

    function walk(dir: string): void {
      try {
        const entries = fs.readdirSync(dir, { withFileTypes: true })
        for (const entry of entries) {
          const full = path.join(dir, entry.name)
          if (entry.isDirectory()) {
            // node_modules, .git 등 제외
            if (!['node_modules', '.git', 'dist', 'build', 'target'].includes(entry.name)) {
              walk(full)
            }
          } else if (entry.isFile()) {
            const ext = path.extname(entry.name).toLowerCase()
            if (extensions.includes(ext)) {
              results.push(full)
            }
          }
        }
      } catch {
        // 접근 불가 디렉토리 무시
      }
    }

    walk(dirPath)
    return results
  })

  // 경로 존재 여부 확인
  ipcMain.handle('path-exists', async (_event, p: string) => {
    return fs.existsSync(p)
  })

  // 디렉토리 목록 (1단계)
  ipcMain.handle('list-dirs', async (_event, dirPath: string) => {
    try {
      const entries = fs.readdirSync(dirPath, { withFileTypes: true })
      return entries
        .filter((e) => e.isDirectory())
        .map((e) => path.join(dirPath, e.name))
    } catch {
      return []
    }
  })

  // 에디터로 파일 열기 (VS Code 우선)
  ipcMain.handle('open-in-editor', async (_event, filePath: string, lineNumber?: number) => {
    try {
      const target = lineNumber ? `${filePath}:${lineNumber}` : filePath
      await shell.openPath(target)
    } catch {
      // VS Code CLI 시도
      const { exec } = await import('child_process')
      const cmd = lineNumber
        ? `code --goto "${filePath}:${lineNumber}"`
        : `code "${filePath}"`
      exec(cmd)
    }
  })

  // VS Code로 열기
  ipcMain.handle('open-vscode', async (_event, filePath: string, lineNumber?: number) => {
    const { exec } = await import('child_process')
    const cmd = lineNumber
      ? `code --goto "${filePath}:${lineNumber}"`
      : `code "${filePath}"`
    return new Promise((resolve) => {
      exec(cmd, (err) => resolve(!err))
    })
  })
}
