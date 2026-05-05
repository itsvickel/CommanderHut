import { useState, useEffect } from "react";
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
        <div className="flex items-center justify-center min-h-screen w-screen">
            <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl w-full max-w-sm">
                <div>
                    <h2 className="text-center text-2xl font-bold mb-6">Avatar</h2>
                    <h2 className="text-center text-2xl font-bold mb-6">username</h2>
                    <h2 className="text-center text-2xl font-bold mb-6">{profileData?.bio}</h2>
                    <h2 className="text-center text-2xl font-bold mb-6">
                        {profileData?.last_active_at
                            ? new Date(profileData.last_active_at).toLocaleString()
                            : "No activity yet"}
                    </h2>
                </div>

                <div>

                </div>

                {/* <span>
                    - recently viewed
                    - suggestion cards you might like
                    - Avatar, username, and short bio
                    - deck import/export
                    - Decks list create a deck if none
                </span> */}

                <div>

                </div>
            </div>
        </div>
    );
};

export default ProfilePage;
