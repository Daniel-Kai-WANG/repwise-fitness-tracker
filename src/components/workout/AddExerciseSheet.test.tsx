import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { AddExerciseSheet } from './AddExerciseSheet';

describe('AddExerciseSheet', () => {
  it('prefills and submits a custom exercise from the current search', async () => {
    const user = userEvent.setup();
    const onCreate = vi.fn().mockResolvedValue(undefined);

    render(
      <AddExerciseSheet
        exercises={[]}
        onSelect={vi.fn()}
        onCreate={onCreate}
        onClose={vi.fn()}
      />
    );

    await user.type(
      screen.getByRole('textbox', { name: 'Search exercise library' }),
      'Landmine Press'
    );
    await user.click(
      screen.getByRole('button', { name: 'Create custom exercise' })
    );

    expect(screen.getByRole('textbox', { name: 'Name' })).toHaveValue(
      'Landmine Press'
    );
    await user.selectOptions(
      screen.getByRole('combobox', { name: 'Category' }),
      'shoulders'
    );
    await user.selectOptions(
      screen.getByRole('combobox', { name: 'Equipment' }),
      'barbell'
    );
    await user.click(screen.getByRole('button', { name: 'Add exercise' }));

    await waitFor(() =>
      expect(onCreate).toHaveBeenCalledWith({
        name: 'Landmine Press',
        category: 'shoulders',
        equipment: 'barbell',
        trackingType: 'weight-reps',
        notes: ''
      })
    );
  });
});
