import { useState } from 'react';
import styled from 'styled-components';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';

import { Input, Button } from '../Components/UI_Components';
import { loginUser } from '../services/userService';
import { authCheckSucceeded } from '../store/AuthSlice';
import { safeRedirect } from '../utils/safeRedirect';

const Authentication = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();

  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');

  const onLogin = () => {
    loginUser({ email_address: email, password })
      .then((res) => {
        if (res && res.data?.user) {
          dispatch(authCheckSucceeded(res.data.user));
          navigate(safeRedirect(location.search), { replace: true });
        }
      })
      .catch((err) => {
        console.error('Login failed:', err);
      });
  };

  return (
    <Wrapper>
      <Title>Login</Title>
      <InputContainer>
        <Input placeholder="Email Address" onChange={(e) => setEmail(e.target.value)} />
      </InputContainer>
      <InputContainer>
        <Input placeholder="Password" onChange={(e) => setPassword(e.target.value)} />
      </InputContainer>

      <Button onClick={onLogin} name="Login" />
    </Wrapper>
  );
};

export default Authentication;

const Wrapper = styled.div`
  background: #fff;
  padding: 2rem;
  border-radius: 1rem;
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.15);
  width: 100%;
  max-width: 400px;
`;

const Title = styled.h2`
  text-align: center;
  font-size: 1.5rem;
  font-weight: bold;
  margin-bottom: 1.5rem;
`;

const InputContainer = styled.div`
  display: flex;
  flex-direction: column;
  margin: 5% 2%;
`;
