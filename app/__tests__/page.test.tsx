// Tests for home page
import { render, screen } from '@testing-library/react';
import HomePage from '../page';

describe('HomePage', () => {
  it('should render heading', () => {
    render(<HomePage />);
    expect(screen.getByText('Collaborative Whiteboard')).toBeInTheDocument();
  });

  it('should render description', () => {
    render(<HomePage />);
    expect(
      screen.getByText(/Free whiteboard for students and teachers/)
    ).toBeInTheDocument();
  });

  it('should render create whiteboard button', () => {
    render(<HomePage />);
    const button = screen.getByRole('link', { name: /Create Whiteboard/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute('href', '/board');
  });

  it('should render feature list', () => {
    render(<HomePage />);
    expect(screen.getByText(/No account required/)).toBeInTheDocument();
    expect(screen.getByText(/Real-time collaboration/)).toBeInTheDocument();
    expect(screen.getByText(/Educational templates & prompts/)).toBeInTheDocument();
  });
});
