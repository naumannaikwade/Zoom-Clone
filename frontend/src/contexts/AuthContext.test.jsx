import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { authAPI } from '../api/auth';
import { AuthProvider, useAuth } from './AuthContext';

vi.mock('../api/auth', () => ({
  authAPI: {
    getMe: vi.fn(),
    login: vi.fn(),
    register: vi.fn(),
  },
}));

const AuthConsumer = () => {
  const { loading, login, user } = useAuth();
  if (loading) return <span>Loading</span>;

  return (
    <div>
      <span>{user?.name || 'Signed out'}</span>
      <button type="button" onClick={() => login('ada@example.com', 'password')}>Sign in</button>
    </div>
  );
};

describe('AuthProvider', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  test('stores the token and exposes the signed-in user', async () => {
    authAPI.login.mockResolvedValue({
      data: {
        data: {
          _id: 'user-1',
          name: 'Ada',
          email: 'ada@example.com',
          token: 'signed-token',
        },
      },
    });

    render(<AuthProvider><AuthConsumer /></AuthProvider>);
    await screen.findByText('Signed out');
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    await waitFor(() => expect(screen.getByText('Ada')).toBeInTheDocument());
    expect(localStorage.getItem('token')).toBe('signed-token');
  });
});
