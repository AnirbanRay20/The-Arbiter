import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import ChatView from './components/ChatView.jsx'
import ShareResultView from './components/ShareResultView.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/chat/:id" element={<ChatView />} />
        <Route path="/share/:id" element={<ShareResultView />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
