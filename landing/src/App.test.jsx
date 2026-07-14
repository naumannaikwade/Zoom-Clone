import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import App from './App';

describe('XZoom landing page', () => {
  test('describes only the implemented meeting features', () => {
    render(<App />);

    expect(screen.getByRole('heading', { name: /meet, share, and chat/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /video and audio/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /screen sharing/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /meeting chat/i })).toBeInTheDocument();
    expect(screen.queryByText(/\b(pricing|webinars?)\b|enterprise security/i)).not.toBeInTheDocument();
  });
});
