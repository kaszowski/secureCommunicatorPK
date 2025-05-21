import { describe, expect, test, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Input from '../../app/components/atoms/Input/Input';

describe('Input component tests', () => {
  test('renders the input with label from children prop', () => {
    render(<Input id='test-input'>Test Label</Input>);
    const inputElement = screen.getByLabelText(/test label/i);
    expect(inputElement).toBeTruthy();
  });

  test('calls onChange handler when input value changes', () => {
    const handleChange = vi.fn();
    render(
      <Input id='test-input' onChange={handleChange}>
        Test Label
      </Input>
    );
    const inputElement = screen.getByLabelText(/test label/i);
    fireEvent.change(inputElement, { target: { value: 'Hello' } });
    expect(handleChange).toHaveBeenCalledTimes(1);
  });

  test('forwards additional props to the underlying input element', () => {
    render(
      <Input
        id='custom-id'
        variant='filled'
        size='small'
        color='primary'
        placeholder='Placeholder Test'
      >
        Label
      </Input>
    );
    const inputElement = screen.getByPlaceholderText(/Placeholder Test/i);
    expect(inputElement).toHaveProperty('placeholder', 'Placeholder Test');
  });
});
