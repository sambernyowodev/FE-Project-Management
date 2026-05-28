import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { authApi } from '../api/auth.api';

export function useLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const loginMutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: (data) => {
      if (data.data?.accessToken) {
        localStorage.setItem('token', data.data.accessToken);
        navigate('/');
      }
    },
    onError: (err: any) => {
      setError(err.message || 'Login failed. Please check your credentials.');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email || !password) {
      setError('Email and password are required');
      return;
    }
    loginMutation.mutate({ email, password });
  };

  return {
    email, setEmail,
    password, setPassword,
    error,
    isPending: loginMutation.isPending,
    handleSubmit
  };
}

export function useRegister() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const registerMutation = useMutation({
    mutationFn: authApi.register,
    onSuccess: (data) => {
      if (data.data?.accessToken) {
        localStorage.setItem('token', data.data.accessToken);
        navigate('/');
      }
    },
    onError: (err: any) => {
      setError(err.message || 'Registration failed. Please check your inputs.');
    }
  });

  const validatePassword = (pwd: string) => {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(pwd);
    const hasLowerCase = /[a-z]/.test(pwd);
    const hasNumber = /\d/.test(pwd);

    if (pwd.length < minLength) return 'Password harus minimal 8 karakter';
    if (!hasUpperCase) return 'Password harus memiliki setidaknya satu huruf besar';
    if (!hasLowerCase) return 'Password harus memiliki setidaknya satu huruf kecil';
    if (!hasNumber) return 'Password harus memiliki setidaknya satu angka';

    return null;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!fullName || !email || !password) {
      setError('All fields are required');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    const pwdError = validatePassword(password);
    if (pwdError) {
      setError(pwdError);
      return;
    }

    registerMutation.mutate({ fullName, email, password });
  };

  return {
    fullName, setFullName,
    email, setEmail,
    password, setPassword,
    confirmPassword, setConfirmPassword,
    error,
    isPending: registerMutation.isPending,
    handleSubmit
  };
}
