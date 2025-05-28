import { describe, expect, test, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '../../app/components/atoms/Button/Button';

describe('Button test', () => {
  test('renders the button with text content', () => {
    render(<Button>Click Me</Button>);
    const buttonElement = screen.getByRole('button', { name: /click me/i });
    // Check if the element exists
    expect(buttonElement).toBeTruthy();
  });

  test('disables the button when isDisabled is true', () => {
    render(<Button isDisabled>Disabled Button</Button>);
    const buttonElement = screen.getByRole('button', {
      name: /disabled button/i
    });
    // Check if the button is disabled via its disabled property
    expect(buttonElement.disabled).toBe(true);
  });

  test('calls onClick handler when the button is clicked', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Clickable Button</Button>);
    const buttonElement = screen.getByRole('button', {
      name: /clickable button/i
    });
    fireEvent.click(buttonElement);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  test('renders with the correct type attribute', () => {
    render(<Button type='submit'>Submit Button</Button>);
    const buttonElement = screen.getByRole('button', {
      name: /submit button/i
    });
    // Check the type attribute by reading it directly
    expect(buttonElement.getAttribute('type')).toBe('submit');
  });

  test('renders with different Material UI variants correctly', () => {
    const { rerender } = render(<Button variant="contained">Contained Button</Button>);
    let buttonElement = screen.getByRole('button', { name: /contained button/i });
    expect(buttonElement.className).toContain('MuiButton-contained');

    rerender(<Button variant="outlined">Outlined Button</Button>);
    buttonElement = screen.getByRole('button', { name: /outlined button/i });
    expect(buttonElement.className).toContain('MuiButton-outlined');

    rerender(<Button variant="text">Text Button</Button>);
    buttonElement = screen.getByRole('button', { name: /text button/i });
    expect(buttonElement.className).toContain('MuiButton-text');
  });

  test('applies correct color classes and handles custom sx props', () => {
    const { rerender } = render(
      <Button color="secondary" sx={{ marginTop: 2 }}>
        Secondary Button
      </Button>
    );
    let buttonElement = screen.getByRole('button', { name: /secondary button/i });
    expect(buttonElement.className).toContain('MuiButton-colorSecondary');

    rerender(<Button color="error">Error Button</Button>);
    buttonElement = screen.getByRole('button', { name: /error button/i });
    expect(buttonElement.className).toContain('MuiButton-colorError');

    rerender(<Button color="success">Success Button</Button>);
    buttonElement = screen.getByRole('button', { name: /success button/i });
    expect(buttonElement.className).toContain('MuiButton-colorSuccess');
  });
});
