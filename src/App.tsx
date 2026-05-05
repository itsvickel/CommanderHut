import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
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
import EditDeck from './pages/EditDeck';
import AdminMasterPrompt from './pages/AdminMasterPrompt';
import DeckDetailPage from './pages/DeckDetailPage';

import useAuth from './hooks/useAuth';
import PageBoundary from './Components/UI_Components/PageBoundary';
import RequireAuth from './Components/Auth/RequireAuth';
import RequireAdmin from './Components/Auth/RequireAdmin';

const publicRoute = (element: ReactElement) => <PageBoundary>{element}</PageBoundary>;
const protectedRoute = (element: ReactElement) => (
  <PageBoundary>
    <RequireAuth>{element}</RequireAuth>
  </PageBoundary>
);
const adminRoute = (element: ReactElement) => (
  <PageBoundary>
    <RequireAdmin>{element}</RequireAdmin>
  </PageBoundary>
);

const AppComponent = () => {
  useAuth();

  return (
    <div className="min-h-screen w-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-gray-200 dark:from-gray-900 dark:to-gray-800 text-gray-900 dark:text-gray-100">
      <Navbar />
      <Routes>
        <Route path="/" element={publicRoute(<Home />)} />
        <Route path="/cards" element={publicRoute(<CardPage />)} />
        <Route path="/login" element={publicRoute(<Login />)} />
        <Route path="/register" element={publicRoute(<RegisterUser />)} />
        <Route path="/decks" element={protectedRoute(<DeckPage />)} />
        <Route path="/decks/:id" element={publicRoute(<DeckDetailPage />)} />
        <Route path="/decks/:id/edit" element={protectedRoute(<EditDeck />)} />
        <Route path="/sandbox" element={publicRoute(<Sandbox />)} />
        <Route path="/decksmith" element={protectedRoute(<Decksmith />)} />
        <Route path="/profile" element={protectedRoute(<ProfilePage />)} />
        <Route path="/admin/masterprompt" element={adminRoute(<AdminMasterPrompt />)} />
      </Routes>
    </div>
  );
};

export default function App() {
  return (
    <Router>
      <AppComponent />
    </Router>
  );
}
