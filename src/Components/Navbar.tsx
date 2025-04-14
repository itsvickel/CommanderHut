import { Link } from 'react-router-dom';
import styled from 'styled-components';
 
import colors from '../styles/colors.js';

interface Props {
    obj: {
        name: string;
        to: string;
    }[]
}

const Navbar = ({ obj }: Props) => {
    return (
        <NavigationContainer>
                {obj.map((item, index) => {
                    return  <LinkItem key={index} to={item.to}>{item.name}</LinkItem> 
                })}
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