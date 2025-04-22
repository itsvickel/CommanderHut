import { Link } from 'react-router-dom';
import styled from 'styled-components';

import { useDispatch, useSelector } from 'react-redux';
import { logout as logoutAction } from '../store/authSlice';
import { RootState } from '../store';

import colors from '../styles/colors.js';
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
                {obj.map((item, index) => {
                    return  <LinkItem key={index} to={item.to}>{item.name}</LinkItem> 
                })}

                { isLogged ? <Button onClick={logout} name={'Logout'} />  : null}
        </NavigationContainer>
    );
};

export default Navbar;

const NavigationContainer = styled.div`
    width: 100%;
    top: 0;
    position: absolute;
    margin: 2%;
`;

const LinkItem = styled(Link)`
    margin: 3%;
    padding: 2%;
    color: ${colors.black};
`;