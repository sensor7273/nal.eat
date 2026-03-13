import { contextBridge, ipcRenderer } from 'electron'

const api = {
  selectFolder: (): Promise<string | null> => ipcRenderer.invoke('select-folder'),

  readFile: (filePath: string, encoding?: string): Promise<string | null> =>
    ipcRenderer.invoke('read-file', filePath, encoding),

  listFiles: (dirPath: string, extensions: string[]): Promise<string[]> =>
    ipcRenderer.invoke('list-files', dirPath, extensions),

  pathExists: (p: string): Promise<boolean> => ipcRenderer.invoke('path-exists', p),

  listDirs: (dirPath: string): Promise<string[]> => ipcRenderer.invoke('list-dirs', dirPath),

  openInEditor: (filePath: string, lineNumber?: number): Promise<void> =>
    ipcRenderer.invoke('open-in-editor', filePath, lineNumber),

  openVscode: (filePath: string, lineNumber?: number): Promise<boolean> =>
    ipcRenderer.invoke('open-vscode', filePath, lineNumber)
}

contextBridge.exposeInMainWorld('electronAPI', api)

export type ElectronAPI = typeof api
