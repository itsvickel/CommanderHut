import { useState } from "react";
import { postRegisterUser } from "../services/userService";
import { Button, Input, Label } from '../Components/UI_Components';
import styled from 'styled-components';
import { postProfile } from "../services/profileService";

const RegisterUser = () => {
    const [username, setUsername] = useState<string>("");
    const [password, setPassword] = useState<string>("");
    const [emailAdress, setEmailAddress] = useState<string>("");

    const RegisterNewUser = async () => {
        try {
            const registeredUser = await postRegisterUser({
                username: username,
                email_address: emailAdress,
                password: password
            });

            console.log(registeredUser);

            const profile = await postProfile({
                user_id: registeredUser.user?._id!,
            });
            console.log('profile Created: ', profile);
        }
        catch {
            console.log('profile not Created');
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
                        value={emailAdress}
                        onChange={(e) => setEmailAddress(e.target.value)}
                        placeholder="Your email"
                    />
                </InputContainer>

                <Button onClick={RegisterNewUser} name="Register" />

                <FooterText>
                    Already have an account? <a href="/login">Login</a>
                </FooterText>
            </Card>
        </PageWrapper>
    );
};

export default RegisterUser;

// ---------------- Styled Components ----------------

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
                        &:hover {
                            text - decoration: underline;
        }
    }
                        `;
