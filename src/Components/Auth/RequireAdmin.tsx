import { ReactNode } from 'react';
import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';
import { selectAuthStatus, selectIsAdmin } from '../../store/AuthSlice';
import Spinner from '../UI_Components/Spinner';

interface Props {
  children: ReactNode;
}

const RequireAdmin = ({ children }: Props) => {
  const status = useSelector(selectAuthStatus);
  const isAdmin = useSelector(selectIsAdmin);

  if (status === 'idle' || status === 'checking') return <Spinner />;
  if (status === 'unauthenticated') return <Navigate to="/login" replace />;
  if (!isAdmin) return <Navigate to="/" replace />;

  return children;
};

export default RequireAdmin;
