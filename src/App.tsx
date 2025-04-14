import { useState } from 'react'
  
import styled from 'styled-components';

import { BrowserRouter as Router, Route, Routes, Link } from "react-router-dom";
import AIGenerate from "./pages/AIGenerate";
import Title from './Components/Title';

import colors from './styles/colors';

import Home from './pages/Home';
import Navbar from './Components/Navbar';
import CardPage from './pages/CardPage';

function App() {

  const navigationObj = [
    {
      name:"home",
      to:"/Home"
    },
    {
      name:"cards",
      to:"/cards"
    },
    {
      name:"Deck",
      to:"/ai-generate"
    },
    {
      name:"/",
      to:"/text"
    },
  ]

  return (
    <MainWrapper> 

      <Router>           
        <Navbar obj={navigationObj}/>
            <Title>MTG AI</Title>      
            <Routes>
              <Route path="/ai-generate" element={<AIGenerate />} />
              <Route path="/cards" element={<CardPage />} />
              <Route path="/" element={<h2 className="text-center mt-10">Welcome to MTG AI</h2>} />
            </Routes>   
      </Router>
    </MainWrapper>
  )
}

export default App

const MainWrapper = styled.div`
  height: 100vh;
  width: 100vw;
  display: flex;
  flex-direction: column;
  justify-content: center;
  text-align: center;
  align-items: center;
  margin: 0;
  
  background: ${colors.greyE8E8E8};

  color: ${colors.black}
`;