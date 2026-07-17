import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import toast from 'react-hot-toast';

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('verifying');

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      setStatus('error');
      return;
    }

    api
      .get(`/auth/verify-email?token=${token}`)
      .then(() => {
        setStatus('success');
        toast.success('Email verified successfully!');
        setTimeout(() => navigate('/login'), 2000);
      })
      .catch(() => {
        setStatus('error');
        toast.error('Verification failed');
      });
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="text-center">
        {status === 'verifying' && (
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
        )}
        {status === 'success' && (
          <div className="text-green-600 text-xl">Email verified successfully!</div>
        )}
        {status === 'error' && (
          <div className="text-red-600 text-xl">Verification failed. Please try again.</div>
        )}
      </div>
    </div>
  );
};

export default VerifyEmail;

