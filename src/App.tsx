import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import styled from 'styled-components';
import { ReactElement } from 'react';

import Decksmith from './pages/Decksmith';
import Navbar from './Components/Navbar';
import CardPage from './pages/CardPage';
import DeckPage from './pages/DeckPage';
import Sandbox from './pages/Sandbox';
import Login from './pages/Login';
import RegisterUser from './pages/RegisterUser';
import ProfilePage from './pages/Profile/Profile';
import Home from './pages/home';
import DeckList from './Components/Deck/DeckList';

import colors from './styles/colors';
import useAuth from './hooks/useAuth';
import PageBoundary from './Components/UI_Components/PageBoundary';
import RequireAuth from './Components/Auth/RequireAuth';

const publicRoute = (element: ReactElement) => <PageBoundary>{element}</PageBoundary>;
const protectedRoute = (element: ReactElement) => (
  <PageBoundary>
    <RequireAuth>{element}</RequireAuth>
  </PageBoundary>
);

const AppComponent = () => {
  useAuth();

  return (
    <MainWrapper>
      <Navbar />
      <Routes>
        <Route path="/" element={publicRoute(<Home />)} />
        <Route path="/cards" element={publicRoute(<CardPage />)} />
        <Route path="/login" element={publicRoute(<Login />)} />
        <Route path="/register" element={publicRoute(<RegisterUser />)} />
        <Route path="/decks" element={protectedRoute(<DeckPage />)} />
        <Route path="/decks/:id" element={protectedRoute(<DeckList />)} />
        <Route path="/sandbox" element={protectedRoute(<Sandbox />)} />
        <Route path="/decksmith" element={protectedRoute(<Decksmith />)} />
        <Route path="/profile" element={protectedRoute(<ProfilePage />)} />
      </Routes>
    </MainWrapper>
  );
};

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

  background: linear-gradient(135deg, #f9fafb, #e5e7eb);
  color: ${colors.black};
`;
