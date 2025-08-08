import { useSelector } from 'react-redux';
import styled from 'styled-components';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';

import AIGenerate from './pages/AIGenerate';
import Navbar from './Components/Navbar';
import CardPage from './pages/CardPage';
import DeckPage from './pages/DeckPage';
import Sandbox from './pages/Sandbox';
import Authentication from './pages/Authentication';
import RegisterUser from './pages/RegisterUser';

import { RootState } from './store';
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
    { name: isLogged ? '' : 'Register', to: '/register' },
    { name: isLogged ? '' : 'Login', to: '/Authentication' },
  ];

  return (
    <AppShell>
      <Navbar obj={navigationObj} />

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
    </AppShell>
  );
};

export default function App() {
  return (
    <Router>
      <AppComponent />
    </Router>
  );
}

const AppShell = styled.div`
  min-height: 100vh;
  width: 100%;
`;
