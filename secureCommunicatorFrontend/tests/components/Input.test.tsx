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

  test('renders with different Material UI variants correctly', () => {
    const { rerender } = render(<Input id="test-input" variant="outlined">Outlined Input</Input>);
    let inputElement = screen.getByLabelText(/outlined input/i);
    expect(inputElement.closest('.MuiTextField-root')).toBeTruthy();
    
    rerender(<Input id="test-input" variant="filled">Filled Input</Input>);
    inputElement = screen.getByLabelText(/filled input/i);
    let textFieldRoot = inputElement.closest('.MuiTextField-root');
    expect(textFieldRoot).toBeTruthy();

    rerender(<Input id="test-input" variant="standard">Standard Input</Input>);
    inputElement = screen.getByLabelText(/standard input/i);
    textFieldRoot = inputElement.closest('.MuiTextField-root');
    expect(textFieldRoot).toBeTruthy();
  });

  test('handles controlled input state and validation attributes', () => {
    const handleChange = vi.fn();
    render(
      <Input 
        id="controlled-input" 
        value="test value" 
        onChange={handleChange}
        required
        type="email"
        fullWidth
      >
        Email Address
      </Input>
    );
    
    const inputElement = screen.getByLabelText(/email address/i) as HTMLInputElement;
    
    // Check controlled value
    expect(inputElement.value).toBe('test value');
    
    // Check validation attributes
    expect(inputElement.required).toBe(true);
    expect(inputElement.type).toBe('email');
    
    // Test onChange functionality
    fireEvent.change(inputElement, { target: { value: 'new@email.com' } });
    expect(handleChange).toHaveBeenCalledTimes(1);
  });
});
