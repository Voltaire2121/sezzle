import { render, screen } from '@testing-library/react';
import App from './App';

describe('App', () => {
  it('renders the single calculator page', () => {
    render(<App />);
    expect(screen.getByRole('main')).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Calculator' })).toBeInTheDocument();
    expect(screen.getByRole('status', { name: 'Calculator display' })).toHaveTextContent('0');
  });
});
