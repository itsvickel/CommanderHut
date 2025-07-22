import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import styled from 'styled-components';
import { BrowserRouter as Router, Route, Routes, useNavigate } from 'react-router-dom';

import AIGenerate from './pages/AIGenerate';
import Title from './Components/UI_Components/Title';
import Navbar from './Components/Navbar';
import CardPage from './pages/CardPage';
import DeckPage from './pages/DeckPage';
import Sandbox from './pages/Sandbox';
import Authentication from './pages/Authentication';
import RegisterUser from './pages/RegisterUser';

import colors from './styles/colors'; 
import { login, logout } from './store/authSlice';
import { RootState } from '../src/store';
import Home from './pages/home';
import useAuth from './hooks/useAuth';
import DeckList from './Components/Deck/DeckList';

const AppComponent = () => { 
  useAuth();

  const isLogged = useSelector((state: RootState) => state.auth.isAuthenticated);
 

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
      <Navbar obj={navigationObj}  />

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
  );
};

// Wrap with Router in root index.tsx (not here)
export default function App() {
  return (
    <Router>
      <AppComponent />
    </Router>
  );
}

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
  color: ${colors.black};
`;
