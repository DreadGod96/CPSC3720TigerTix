import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter as Router } from 'react-router';
import LoginPage from './LoginPage';

describe('LoginPage', () => {
    it('renders login form', () => {
        render(<Router><LoginPage /></Router>);
        expect(screen.getByText('Login to TigerTix')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Email')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Password')).toBeInTheDocument();
    });
});
