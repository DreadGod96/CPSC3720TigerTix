import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router';
import ProtectedRoute from './ProtectedRoute';

describe('ProtectedRoute', () => {
    it('renders child component when authenticated', () => {
        render(
            <MemoryRouter initialEntries={['/protected']}>
                <Routes>
                    <Route element={<ProtectedRoute isAuthenticated={true} />}>
                        <Route path="/protected" element={<div>Protected Content</div>} />
                    </Route>
                </Routes>
            </MemoryRouter>
        );
        expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });
});
