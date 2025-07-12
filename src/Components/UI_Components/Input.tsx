import { Link } from 'react-router-dom';

import styled from 'styled-components';

interface Props {
    onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const Input = ({ onChange }: Props) => {
    return (
        <InputContainer onChange={onChange}/>
    );
};

export default Input;

const InputContainer = styled.input`

`;