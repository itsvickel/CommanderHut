import { useState, useEffect } from "react"; 

import styled from 'styled-components';
import {Label,Input, Button } from "../Components/UI_Components";
import { loginUser } from "../services/userService"; 
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';

import { login } from '../store/authSlice';

const Authentication = () => {
    const navigate = useNavigate();

    const [email, setEmail] = useState<string>(""); 
    const [password, setPassword] = useState<string>("");  

    const dispatch = useDispatch();

    const Login = () =>{
        loginUser({
            email_address: email,
            password: password,
        }).then((res)=>{
            console.log(res);    
            if(res){
                navigate('/'); 
                dispatch(login(res?.data?.user));  
            }   
        }).catch((err)=>{
            console.log(err);
        })
    }

    return (
        <Wrapper>
            <InputContainer>
                <Label name="Email Address" />
                <Input onChange={(e )=>setEmail(e.target.value)} />   
            </InputContainer> 
            <InputContainer>
                <Label name="Password" />
                <Input onChange={(e )=>setPassword(e.target.value)} />   
            </InputContainer> 

            <Button onClick={Login} name={'Login'} />
        </Wrapper>
    );
};

export default Authentication;

const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
    overflow-y: scrol;;
`;

const InputContainer = styled.div`
    display: flex;
    flex-direction: column;
    overflow-y: scrol;;
`;

