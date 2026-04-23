import { Link, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useDispatch, useSelector } from 'react-redux';

import {
  logoutLocal,
  selectAuthStatus,
} from '../store/AuthSlice';
import { logoutUser } from '../services/userService.js';
import colors from '../styles/colors.js';
import Button from './UI_Components/Button.js';

interface NavLink {
  name: string;
  to: string;
}

const PUBLIC_LINKS: NavLink[] = [
  { name: 'Cards', to: '/cards' },
];

const PROTECTED_LINKS: NavLink[] = [
  { name: 'Decks', to: '/decks' },
  { name: 'Sandbox', to: '/sandbox' },
  { name: 'AI Decksmith', to: '/decksmith' },
  { name: 'Profile', to: '/profile' },
];

const Navbar = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const status = useSelector(selectAuthStatus);

  const onLogout = () => {
    dispatch(logoutLocal());
    logoutUser().catch((err) => console.error('Logout request failed:', err));
    navigate('/');
  };

  const links = status === 'authenticated'
    ? [...PUBLIC_LINKS, ...PROTECTED_LINKS]
    : PUBLIC_LINKS;

  return (
    <NavigationContainer>
      {links.map((item) => (
        <LinkItem key={item.to} to={item.to}>{item.name}</LinkItem>
      ))}
      {status === 'unauthenticated' && (
        <>
          <LinkItem to="/login">Login</LinkItem>
          <LinkItem to="/register">Register</LinkItem>
        </>
      )}
      {status === 'authenticated' && (
        <Button onClick={onLogout} name="Logout" />
      )}
    </NavigationContainer>
  );
};

export default Navbar;

const NavigationContainer = styled.div`
  position: fixed;
  top: 0;
  width: 100%;
  z-index: 100;
  background: white;
  border-bottom: 1px solid #e5e7eb;
  padding: 0.75rem 0;
`;

const LinkItem = styled(Link)`
  margin: 3%;
  padding: 2%;
  color: ${colors.black};
  text-decoration: none;
`;
