import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'

import { BrowserRouter as Router, Route, Routes, Link } from "react-router-dom";
import AIGenerate from "./pages/AIGenerate";


import Home from './pages/Home';

function App() {

  return (
    <>
      <Router>
        <nav className="p-4 bg-gray-800 text-white flex justify-between">
          <h1 className="text-lg font-bold">MTG AI</h1>
          <ul className="flex space-x-4">
            <li><Link to="/" className="hover:underline">Home</Link></li>
            <li><Link to="/ai-generate" className="hover:underline">AI Generate</Link></li>
          </ul>
        </nav>

        <Routes>
          <Route path="/ai-generate" element={<AIGenerate />} />
          <Route path="/" element={<h2 className="text-center mt-10">Welcome to MTG AI</h2>} />
        </Routes>
      </Router>
    </>
  )
}

export default App
