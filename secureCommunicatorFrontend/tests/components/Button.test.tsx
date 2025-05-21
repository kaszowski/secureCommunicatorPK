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
});
