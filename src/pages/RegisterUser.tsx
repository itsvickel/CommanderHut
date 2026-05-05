import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';

import { postRegisterUser } from '../services/userService';
import { postProfile } from '../services/profileService';
import { Button, Input } from '../Components/UI_Components';
import { authCheckSucceeded } from '../store/AuthSlice';
import { safeRedirect } from '../utils/safeRedirect';

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
    <div className="flex items-center justify-center min-h-screen w-screen">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl w-full max-w-sm">
        <h2 className="text-center text-2xl font-bold mb-6">Register</h2>

        <div className="flex flex-col mb-4">
          <Input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Username"
          />
        </div>

        <div className="flex flex-col mb-4">
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
          />
        </div>

        <div className="flex flex-col mb-4">
          <Input
            type="email"
            value={emailAddress}
            onChange={(e) => setEmailAddress(e.target.value)}
            placeholder="Your email"
          />
        </div>

        <Button onClick={registerNewUser} name="Register" />

        <p className="mt-4 text-sm text-center text-gray-500 dark:text-gray-400">
          Already have an account?{' '}
          <a href="/login" className="text-blue-500 no-underline font-medium hover:underline">
            Login
          </a>
        </p>
      </div>
    </div>
  );
};

export default RegisterUser;
