import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { App } from './App';

describe('App', () => {
  it('renders the mobile training shell', async () => {
    render(<App />);
    expect(
      await screen.findByRole('heading', { name: 'Training' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('navigation', { name: 'Primary navigation' })
    ).toBeInTheDocument();
  });
});
