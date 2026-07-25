import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { App } from './App';

describe('App', () => {
  it('renders the mobile training shell', async () => {
    const user = userEvent.setup();
    render(<App />);
    expect(
      await screen.findByRole('heading', { name: 'Training' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('navigation', { name: 'Primary navigation' })
    ).toBeInTheDocument();

    await user.click(screen.getAllByRole('link', { name: 'Settings' }).at(-1)!);
    await user.selectOptions(
      await screen.findByRole('combobox', { name: 'Language' }),
      'zh'
    );

    expect(
      await screen.findByRole('heading', { name: '设置' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('navigation', { name: '主导航' })
    ).toBeInTheDocument();

    await user.click(screen.getByRole('link', { name: /Repwise 使用指南/ }));
    expect(
      await screen.findByRole('heading', {
        name: 'Repwise 使用指南',
        level: 1
      })
    ).toBeInTheDocument();
    expect(screen.getByText('记录一次训练')).toBeInTheDocument();
    expect(screen.getByText('备份与恢复')).toBeInTheDocument();
  });
});
