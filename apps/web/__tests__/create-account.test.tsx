import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CreateAccountPage from '../app/create-account/page';

// Tests written by Jordan Henderson
// These tests check that the create account page renders correctly,
// validates user input, and handles success/failure responses from the API.

const mockPush = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

global.fetch = jest.fn();

describe('CreateAccountPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.alert = jest.fn();
  });

  // Checks that all form fields and the submit button are visible on the page
  it('renders all form fields', () => {
    render(<CreateAccountPage />);
    expect(screen.getByPlaceholderText('First Name')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Last Name')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('name@example.com')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
  });

  // Checks that typing into the fields actually updates their values
  it('updates fields when typed into', () => {
    render(<CreateAccountPage />);
    fireEvent.change(screen.getByPlaceholderText('First Name'), { target: { value: 'Jordan' } });
    fireEvent.change(screen.getByPlaceholderText('Last Name'), { target: { value: 'Henderson' } });
    fireEvent.change(screen.getByPlaceholderText('name@example.com'), { target: { value: 'jordan@test.com' } });
    expect(screen.getByPlaceholderText('First Name')).toHaveValue('Jordan');
    expect(screen.getByPlaceholderText('Last Name')).toHaveValue('Henderson');
    expect(screen.getByPlaceholderText('name@example.com')).toHaveValue('jordan@test.com');
  });

  // Checks that submitting with a badly formatted email shows the right alert
  it('shows alert when email is invalid', async () => {
    render(<CreateAccountPage />);
    fireEvent.change(screen.getByPlaceholderText('name@example.com'), { target: { value: 'notanemail' } });
    fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'password123' } });
    fireEvent.submit(screen.getByRole('button', { name: /create account/i }).closest('form')!);
    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith(
        'Please enter a valid email address (like name@example.com).'
      );
    });
  });

  // Checks that submitting with a password under 6 characters shows the right alert
  it('shows alert when password is too short', async () => {
    render(<CreateAccountPage />);
    fireEvent.change(screen.getByPlaceholderText('name@example.com'), { target: { value: 'jordan@test.com' } });
    fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: '123' } });
    fireEvent.submit(screen.getByRole('button', { name: /create account/i }).closest('form')!);
    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith('Password must be at least 6 characters.');
    });
  });

  // Checks that when the API returns an error, the user sees the error message
  it('shows alert when account creation fails', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ message: 'Email already in use' }),
    });
    render(<CreateAccountPage />);
    fireEvent.change(screen.getByPlaceholderText('First Name'), { target: { value: 'Jordan' } });
    fireEvent.change(screen.getByPlaceholderText('name@example.com'), { target: { value: 'jordan@test.com' } });
    fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'password123' } });
    fireEvent.submit(screen.getByRole('button', { name: /create account/i }).closest('form')!);
    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith('Email already in use');
    });
  });

  // Checks that a successful account creation sends the user to the dashboard
  it('redirects to dashboard on success', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: 1, firstName: 'Jordan', email: 'jordan@test.com' }),
    });
    render(<CreateAccountPage />);
    fireEvent.change(screen.getByPlaceholderText('First Name'), { target: { value: 'Jordan' } });
    fireEvent.change(screen.getByPlaceholderText('name@example.com'), { target: { value: 'jordan@test.com' } });
    fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'password123' } });
    fireEvent.submit(screen.getByRole('button', { name: /create account/i }).closest('form')!);
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/dashboard');
    });
  });

  // Checks that the back to login button is present on the page
  it('has a back to login button', () => {
    render(<CreateAccountPage />);
    expect(screen.getByRole('button', { name: /back to login/i })).toBeInTheDocument();
  });
});
