import { Link } from 'react-router-dom';

import styled from 'styled-components';

interface Props {
    name?: string;
    to?: string;
    onClick?: React.MouseEventHandler
}

const Button = ({ name, to, onClick }: Props) => {
    return (
        <ButtonContainer onClick={onClick}> 
            {name}
        </ButtonContainer>
    );
};

export default Button;

const ButtonContainer = styled.button`

`;