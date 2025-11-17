import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter as Router } from 'react-router';
import RegisterPage from './RegisterPage';

describe('RegisterPage', () => {
    it('renders register form', () => {
        render(<Router><RegisterPage /></Router>);
        expect(screen.getByText('Create an Account')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Email')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Password')).toBeInTheDocument();
    });
});
