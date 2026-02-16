import { createContext, useContext } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getUsername } from '@/services';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['username'],
    queryFn: getUsername,
    staleTime: 1000 * 60 * 5,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: false,
  });

  const isAuthenticated = !!data?.username;
  const username = data?.username || null;
  const isSuperuser = data?.is_superuser || false;

  const login = () => {
    queryClient.invalidateQueries({ queryKey: ['username'] });
  };

  const logout = () => {
    localStorage.removeItem('access');
    localStorage.removeItem('refresh');
    queryClient.setQueryData(['username'], null);
    queryClient.invalidateQueries({ queryKey: ['username'] });
    queryClient.clear();
  };

  const value = {
    isAuthenticated,
    username,
    isSuperuser,
    isLoading,
    error,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
