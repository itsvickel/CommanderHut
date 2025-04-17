import { useState } from 'react'
  
import styled from 'styled-components';

import { BrowserRouter as Router, Route, Routes, Link } from "react-router-dom";
import AIGenerate from "./pages/AIGenerate";
import Title from './Components/Title';

import colors from './styles/colors';

import Home from './pages/Home';
import Navbar from './Components/Navbar';
import CardPage from './pages/CardPage';
import DeckPage from './pages/DeckPage';
import Sandbox from './pages/Sandbox';
import Authentication from './pages/Authentication';
import RegisterUser from './pages/RegisterUser';

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
      to:"/deck"
    },
    {
      name:"Sandbox",
      to:"/sandbox"
    },
    {
      name:"AI Decksmith",
      to:"/decksmith"
    },    {
      name:"Register",
      to:"/register"
    },
    {
      name:"Login",
      to:"/login"
    },
  ]

  return (
    <MainWrapper> 

      <Router>           
        <Navbar obj={navigationObj}/>
            <Title>MTG AI</Title>      
            <Routes>
              <Route path="/decksmith" element={<AIGenerate />} />
              <Route path="/deck" element={<DeckPage />} />
              <Route path="/cards" element={<CardPage />} />
              <Route path="/sandbox" element={<Sandbox />} />
              <Route path="/register" element={<RegisterUser />} />
              <Route path="/login" element={<Authentication />} />
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