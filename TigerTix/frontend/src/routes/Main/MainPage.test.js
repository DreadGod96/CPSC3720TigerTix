import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter as Router } from 'react-router';
import MainPage from './MainPage';

describe('MainPage', () => {
    it('renders the main page with heading', () => {
        const credentials = { email: 'test@test.com' };
        render(<Router><MainPage credentials={credentials} /></Router>);
        expect(screen.getByText('TigerTix')).toBeInTheDocument();
        expect(screen.getByText('Current Available Events:')).toBeInTheDocument();
        expect(screen.getByText(`Logged in as ${credentials.email}`)).toBeInTheDocument();
    });
});
