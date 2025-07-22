import { useState } from "react";
import { fetchCardByQuery, fetchCardsFromAI } from "../services/cardService";

import {Button, Input, Label} from '../Components/UI_Components';

import styled from 'styled-components';
import { postRegisterUser } from "../services/userService"; 

const RegisterUser = () => {
    const [username, setUsername] = useState<string>(""); 
    const [password, setPassword] = useState<string>(""); 
    const [emailAdress, setEmailAddress] = useState<string>(""); 
    
    const RegisterNewUser = () =>{

        postRegisterUser({
            username: username,
            email_address: emailAdress,
            password: password
          }).then((res)=>{
            console.log(res);
        }).catch((err)=>{
            console.log(err);
        })

    }

    return (
        <Wrapper>
             <InputContainer>
                <Label name="Username" />
                <Input onChange={(e )=>setUsername(e.target.value)} />   
            </InputContainer> 
             <InputContainer>
                <Label name="Password" />
                <Input onChange={(e )=>setPassword(e.target.value)} />   
             </InputContainer> 
             
             <InputContainer>
                <Label name="Email Address" />
                <Input
                    onChange={(e) => setEmailAddress(e.target.value)}
                    placeholder="Enter your email"
                    />
             </InputContainer>  
 
             <Button onClick={RegisterNewUser} name={'Register'} />
        </Wrapper>
    );
};

export default RegisterUser;

const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
    overflow-y: scroll;
    width: 70%;
`;
 
const InputContainer = styled.div`
    display: flex;
    flex-direction: row;
`;