import { useState, useEffect } from "react";
import styled from 'styled-components';
import { getProfile } from "../../services/profileService";

interface Profile {
    _id: string,
    avatar_url: string,
    bio: string,
    user: string,
    decks: [string],
    website: string,
    followers: [String],
    following: [String],
    likes: [String],
    last_active_at: Date,
}

const ProfilePage = () => {
    const [profileData, setProfileData] = useState<Profile>();

    useEffect(() => {
        const storedUser = sessionStorage.getItem("user");
        if (!storedUser) return;

        const userInfo = JSON.parse(storedUser) as { id: string; email: string };
        getProfile(userInfo.id)
            .then((res) => {
                const profile = res?.data?.profile;
                console.log("Fetched profile:", profile);
                setProfileData({
                    ...profile,
                });
            })
            .catch((err) => console.error("Failed to fetch profile:", err));

    }, []);

    useEffect(() => {
        console.log("Profile updated:", profileData);
    }, [profileData]);

    return (
        <ProfileWrapper>
            <Card>
                <ProfileContainer>
                    <Title>Avatar</Title>
                    <Title>username</Title>
                    <Title>{profileData?.bio}</Title>
                    <Title>{profileData?.last_active_at
                        ? new Date(profileData.last_active_at).toLocaleString()
                        : "No activity yet"}
                    </Title>
                </ProfileContainer>

                <ImportDeck>

                </ImportDeck>

                {/* <span>
                    - recently viewed
                    - suggestion cards you might like
                    - Avatar, username, and short bio
                    - deck import/export
                    - Decks list create a deck if none
                </span> */}

                <ListOfUserDecks>

                </ListOfUserDecks>
            </Card>
        </ProfileWrapper>
    );
};

export default ProfilePage;

// ---------------- Styled Components ----------------

const ProfileWrapper = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    width: 100vw;
`;

const ProfileContainer = styled.div``;

const ImportDeck = styled.div``;

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
            text-decoration: underline;
        }
    }
`;

const ListOfUserDecks = styled.div`

`;