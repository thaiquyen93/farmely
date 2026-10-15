import React from 'react';
import { describe, expect, it } from 'vitest';
import ReactDOM from 'react-dom/client';
import { act } from 'react';
import { MemoryRouter } from 'react-router-dom';
import Home from './pages/public/Home';
import Login from './pages/public/Login';
import Register from './pages/public/Register';
import SiteVisitBooking from './pages/public/SiteVisitBooking';
import Marketplace from './pages/public/Marketplace';
import PlotDetail from './pages/public/PlotDetail';
import BookPlot from './pages/public/BookPlot';
import ForgotPassword from './pages/public/ForgotPassword';
import About from './pages/public/About';
import Terms from './pages/public/Terms';
import RentalTerms from './pages/public/RentalTerms';
import CustomerDashboard from './pages/customer/CustomerDashboard';
import AdminDashboard from './pages/admin/AdminDashboard';
import ExpertDashboard from './pages/expert/ExpertDashboard';
import FieldWorkerDashboard from './pages/staff/FieldWorkerDashboard';
import { useAuthStore } from './stores/authStore';

const customer = { id: '1', userId: '1', role: 'CUSTOMER', fullName: 'Test customer', email: 'customer@farmely.vn' };
const expert = { id: '5', userId: '5', role: 'EXPERT', fullName: 'Test expert', email: 'expert@farmely.vn' };
const staff = { id: '8', userId: '8', role: 'STAFF', fullName: 'Test staff', email: 'worker@farmely.vn' };
const admin = { id: '11', userId: '11', role: 'ADMIN', fullName: 'Test admin', email: 'admin@farmely.vn' };

const cases = [
  ['home', '/', null, Home], ['login', '/login', null, Login], ['register', '/register', null, Register],
  ['visit', '/site-visit/book', null, SiteVisitBooking], ['marketplace', '/marketplace', null, Marketplace],
  ['plot', '/marketplace/plot/P-01', null, PlotDetail], ['book plot', '/marketplace/plot/P-01/book', null, BookPlot],
  ['forgot password', '/forgot-password', null, ForgotPassword], ['about', '/about', null, About], ['terms', '/terms', null, Terms], ['rental terms', '/terms/rental', null, RentalTerms],
  ['customer overview', '/customer/dashboard', customer, CustomerDashboard], ['customer services', '/customer/dashboard?view=services', customer, CustomerDashboard],
  ['customer diary', '/customer/dashboard?view=diary', customer, CustomerDashboard], ['customer process', '/customer/dashboard?view=process', customer, CustomerDashboard],
  ['customer harvest', '/customer/dashboard?view=harvest', customer, CustomerDashboard], ['expert', '/expert/dashboard', expert, ExpertDashboard],
  ['staff', '/staff/dashboard', staff, FieldWorkerDashboard], ['admin', '/admin/dashboard', admin, AdminDashboard]
];

describe('all application routes mount', () => {
  it.each(cases)('%s', async (_name, entry, user, Page) => {
    useAuthStore.setState({ user, isAuthenticated: Boolean(user) });
    const host = document.createElement('div');
    document.body.appendChild(host);
    const root = ReactDOM.createRoot(host);
    await act(async () => root.render(<MemoryRouter initialEntries={[entry]}><Page /></MemoryRouter>));
    expect(host.textContent).toBeTruthy();
    await act(async () => root.unmount());
    host.remove();
  });
});
