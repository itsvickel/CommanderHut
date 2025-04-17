import { useState } from "react";
import { fetchCardByQuery, fetchCardsFromAI } from "../services/cardService";

import styled from 'styled-components';
import {Label,Input, Button } from "../Components/UI_Components/UI_Components";
import { loginUser } from "../services/userService";

const Authentication = () => {
    const [email, setEmail] = useState<string>(""); 
    const [password, setPassword] = useState<string>(""); 
 
const Login = () =>{
    loginUser({
        email_address: email,
        password: password,
    }).then((res)=>{
        console.log(res);
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
 
             <Button onClick={Login} name={'Register'} />
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

