import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import API_ENDPOINT from '../Constants/api';
import {
  authCheckStarted,
  authCheckSucceeded,
  authCheckFailed,
  User,
} from '../store/AuthSlice';

const SESSION_STORAGE_KEY = 'user';

const readCachedUser = (): User | null => {
  const raw = sessionStorage.getItem(SESSION_STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
};

const useAuth = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    const cached = readCachedUser();
    if (cached) {
      dispatch(authCheckSucceeded(cached));
    } else {
      dispatch(authCheckStarted());
    }

    const controller = new AbortController();

    (async () => {
      try {
        const res = await fetch(API_ENDPOINT.ME, {
          credentials: 'include',
          signal: controller.signal,
        });
        if (!res.ok) {
          dispatch(authCheckFailed());
          return;
        }
        const user = (await res.json()) as User;
        dispatch(authCheckSucceeded({
          id: user.id,
          username: user.username,
          email_address: user.email_address,
        }));
      } catch (err) {
        if ((err as { name?: string })?.name === 'AbortError') return;
        dispatch(authCheckFailed());
      }
    })();

    return () => {
      controller.abort();
    };
  }, [dispatch]);
};

export default useAuth;
