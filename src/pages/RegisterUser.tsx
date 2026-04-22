import { useState } from 'react';
import styled from 'styled-components';
import { useLocation, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';

import { postRegisterUser } from '../services/userService';
import { postProfile } from '../services/profileService';
import { Button, Input } from '../Components/UI_Components';
import { authCheckSucceeded } from '../store/AuthSlice';

const safeRedirect = (search: string): string => {
  const params = new URLSearchParams(search);
  const redirect = params.get('redirect');
  if (redirect && redirect.startsWith('/')) return redirect;
  return '/';
};

const RegisterUser = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();

  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [emailAddress, setEmailAddress] = useState<string>('');

  const registerNewUser = async () => {
    try {
      const registered = await postRegisterUser({
        username,
        email_address: emailAddress,
        password,
      });

      if (!registered?.user?._id) {
        console.error('Registration response missing user id');
        return;
      }

      await postProfile({ user_id: registered.user._id });

      dispatch(authCheckSucceeded({
        id: registered.user._id,
        username: registered.user.username,
        email_address: registered.user.email_address,
      }));

      navigate(safeRedirect(location.search), { replace: true });
    } catch (err) {
      console.error('Registration failed:', err);
    }
  };

  return (
    <PageWrapper>
      <Card>
        <Title>Register</Title>

        <InputContainer>
          <Input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Username"
          />
        </InputContainer>

        <InputContainer>
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
          />
        </InputContainer>

        <InputContainer>
          <Input
            type="email"
            value={emailAddress}
            onChange={(e) => setEmailAddress(e.target.value)}
            placeholder="Your email"
          />
        </InputContainer>

        <Button onClick={registerNewUser} name="Register" />

        <FooterText>
          Already have an account? <a href="/login">Login</a>
        </FooterText>
      </Card>
    </PageWrapper>
  );
};

export default RegisterUser;

const PageWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  width: 100vw;
`;

const Card = styled.div`
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
  margin-bottom: 1rem;
`;

const FooterText = styled.p`
  margin-top: 1rem;
  font-size: 0.875rem;
  text-align: center;
  color: #6b7280;

  a {
    color: #3b82f6;
    text-decoration: none;
    font-weight: 500;
    &:hover { text-decoration: underline; }
  }
`;
