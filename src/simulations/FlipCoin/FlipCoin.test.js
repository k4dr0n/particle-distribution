import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import FlipCoin from './FlipCoin';

test('renders FlipCoin component', () => {
    const { getByText, getByPlaceholderText } = render(<FlipCoin />);
    expect(getByText(/Flip a Coin/i)).toBeInTheDocument();
    
    const input = getByPlaceholderText(/Number of flips/i);
    fireEvent.change(input, { target: { value: '5' } });
    expect(input.value).toBe('5');
});
