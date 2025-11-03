import { useState, useEffect } from "react";

import styled from 'styled-components';
import { Label, Input, Button } from "../Components/UI_Components";
import { loginUser } from "../services/userService";
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';

import { login } from '../store/authSlice';

const Authentication = () => {
    const navigate = useNavigate();

    const [email, setEmail] = useState<string>("");
    const [password, setPassword] = useState<string>("");

    const dispatch = useDispatch();

    const Login = () => {
        loginUser({
            email_address: email,
            password: password,
        }).then((res) => {
            console.log(res);
            if (res) {
                navigate('/');
                dispatch(login(res?.data?.user));
                sessionStorage.setItem('user', JSON.stringify(res.data.user));
            }
        }).catch((err) => {
            console.log(err);
        })
    }

    return (
        <Wrapper>
            <Title>Login</Title>
            <InputContainer>
                <Input placeholder="Email Address" onChange={(e) => setEmail(e.target.value)} />
            </InputContainer>
            <InputContainer>
                <Input placeholder="Password" onChange={(e) => setPassword(e.target.value)} />
            </InputContainer>

            <Button onClick={Login} name={'Login'} />
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
    overflow-y: scrol;
    margin: 5% 2%;
`;

