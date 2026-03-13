import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'

// CSS 애니메이션 주입
const style = document.createElement('style')
style.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  * { box-sizing: border-box; }
  ::-webkit-scrollbar { width: 6px; height: 6px; }
  ::-webkit-scrollbar-track { background: #1e1e1e; }
  ::-webkit-scrollbar-thumb { background: #555; border-radius: 3px; }
  ::-webkit-scrollbar-thumb:hover { background: #777; }
`
document.head.appendChild(style)

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
