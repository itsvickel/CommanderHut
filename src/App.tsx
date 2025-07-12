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
    { name: 'Cards', to: '/cards' },
    { name: 'Decks', to: '/decks' },
    { name: 'Sandbox', to: '/sandbox' },
    { name: 'AI Decksmith', to: '/decksmith' },
    { name: isLogged ? "" : 'Register', to: '/register' },
    { name: isLogged ? "" : 'Login', to: '/Authentication' },
  ];

  return (
    <MainWrapper> 

      <Routes>
        <Route path="/decksmith" element={<AIGenerate />} />
        <Route path="/decks" element={<DeckPage />} />
        <Route path="/decks/:id" element={<DeckList />} />
        <Route path="/cards" element={<CardPage />} />
        <Route path="/sandbox" element={<Sandbox />} />
        <Route path="/register" element={<RegisterUser />} />
        <Route path="/Authentication" element={<Authentication />} /> 
        <Route path="/" element={<Home />} />
      </Routes>
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