import { Link } from 'react-router-dom';
import styled from 'styled-components';

import { useDispatch, useSelector } from 'react-redux';
import { logout as logoutAction } from '../store/AuthSlice';
import { RootState } from '../store';

import { logoutUser } from '../services/userService.js';
import Button from './UI_Components/Button.js';

interface Props {
    obj: {
        name: string;
        to: string;
    }[], 
}

const Navbar = ({ obj }: Props) => {
    const dispatch = useDispatch();
    const isLogged = useSelector((state: RootState) => state.auth.isAuthenticated);

    const logout = () =>{
        logoutUser();
        dispatch(logoutAction());
    }

    return (
        <NavigationContainer>
          <NavRow>
            <Brand>Commander Hut</Brand>
            <Links>
              {obj.map((item, index) => (
                <LinkItem key={index} to={item.to}>{item.name}</LinkItem>
              ))}
            </Links>
            { isLogged ? <Button onClick={logout} name={'Logout'} />  : null}
          </NavRow>
        </NavigationContainer>
    );
};

export default Navbar;

const NavigationContainer = styled.nav`
  width: 100%;
  position: sticky;
  top: 0;
  padding: ${({ theme }) => `${theme.spacing.md} ${theme.spacing.xl}`};
  background: ${({ theme }) => theme.colors.surface};
  box-shadow: ${({ theme }) => theme.shadows.sm};
  z-index: 100;
`;

const NavRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const Brand = styled.div`
  font-weight: 700;
`;

const Links = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.lg};
`;

const LinkItem = styled(Link)`
  padding: ${({ theme }) => `${theme.spacing.xs} ${theme.spacing.sm}`};
  color: ${({ theme }) => theme.colors.text};
  border-radius: ${({ theme }) => theme.radii.sm};
  &:hover { background: ${({ theme }) => theme.colors.greyE8E8E8}; }
`;