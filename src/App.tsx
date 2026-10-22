import React, { useState, useEffect, Suspense, lazy } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { UserSession } from './types';
import { getSupabase } from './lib/supabase';
import toast from 'react-hot-toast';

// Route-level code splitting for fast initial load
const CalendarApp = lazy(() => import('./CalendarApp').then(m => ({ default: m.CalendarApp })));
const HonorCalendarApp = lazy(() => import('./HonorCalendarApp').then(m => ({ default: m.HonorCalendarApp })));
const PinLogin = lazy(() => import('./components/PinLogin').then(m => ({ default: m.PinLogin })));
const AdminLogin = lazy(() => import('./components/AdminLogin').then(m => ({ default: m.AdminLogin })));

export default function App() {
  const [session, setSession] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const initSession = async () => {
      // 1. Check local storage for PIN session (Viewer, Dueño, Cocinero, Mozo)
      // SEGURIDAD: 'admin' NUNCA se restaura desde localStorage. Requiere Google OAuth / Supabase Auth.
      const savedPin = localStorage.getItem('calendario_session');
      if (savedPin) {
        try {
          const parsed = JSON.parse(savedPin);
          if (parsed && ['viewer', 'dueño', 'cocinero', 'mozo'].includes(parsed.role)) {
            setSession(parsed);
            setLoading(false);
            return;
          } else if (parsed && parsed.role === 'admin') {
            // Limpiar clave manipulada o sesión caducada
            localStorage.removeItem('calendario_session');
          }
        } catch (e) {
          localStorage.removeItem('calendario_session');
        }
      }

      // 2. Check Supabase Auth for Google Admin
      const supabase = getSupabase();
      if (supabase) {
        const { data: { session: supaSession } } = await supabase.auth.getSession();
        if (supaSession?.user) {
          const email = supaSession.user.email;
          if (email) {
            // Check if email is in admin_emails
            const { data: adminData, error: adminError } = await supabase
              .from('admin_emails')
              .select('email')
              .ilike('email', email)
              .maybeSingle();
              
            if (adminError) {
              console.error('Error verifying admin:', adminError);
            }
              
            if (adminData) {
              setSession({ role: 'admin', name: email });
            } else {
              // Not an admin, logout
              await supabase.auth.signOut();
              toast.error('Acceso denegado. Tu correo no está en la Lista Blanca.');
            }
          }
        }

        // Listen for auth changes (Login/Logout)
        supabase.auth.onAuthStateChange(async (event, currentSession) => {
          if (event === 'SIGNED_IN' && currentSession?.user) {
            const email = currentSession.user.email;
            if (email) {
              const { data: adminData, error: adminError } = await supabase
                .from('admin_emails')
                .select('email')
                .ilike('email', email)
                .maybeSingle();
                
              if (adminError) {
                console.error('Error verifying admin on sign in:', adminError);
              }
                
              if (adminData) {
                setSession({ role: 'admin', name: email });
                // Only navigate if we are not already on an admin-allowed route
                const currentPath = window.location.pathname;
                if (currentPath !== '/calendario-honor' && currentPath !== '/admin') {
                  navigate('/admin');
                }
              } else {
                await supabase.auth.signOut();
                toast.error('Acceso denegado. Tu correo no está en la Lista Blanca.');
              }
            }
          } else if (event === 'SIGNED_OUT') {
            setSession((prev) => prev?.role === 'admin' ? null : prev);
          }
        });
      }
      
      setLoading(false);
    };

    initSession();
  }, [navigate]);

  const handlePinLogin = (newSession: UserSession) => {
    if (newSession.role === 'admin') {
      toast.error('Acceso de administrador requiere inicio de sesión con Google.');
      return;
    }
    setSession(newSession);
    localStorage.setItem('calendario_session', JSON.stringify(newSession));
    navigate('/');
  };

  const handleLogout = async () => {
    const supabase = getSupabase();
    if (session?.role === 'admin' && supabase) {
      await supabase.auth.signOut();
    }
    localStorage.removeItem('calendario_session');
    setSession(null);
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <>
      <Toaster position="top-right" />
      <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      }>
        <Routes>
          {/* PUBLIC / VIEWER ROUTE */}
          <Route 
            path="/" 
            element={
              session && ['viewer', 'dueño', 'cocinero', 'mozo'].includes(session.role) ? (
                <HonorCalendarApp session={session} onLogout={handleLogout} />
              ) : session && session.role === 'admin' ? (
                <Navigate to="/admin" replace />
              ) : (
                <PinLogin onLogin={handlePinLogin} />
              )
            } 
          />
          
          {/* ADMIN ROUTE */}
          <Route 
            path="/admin" 
            element={
              session && session.role === 'admin' ? (
                <CalendarApp session={session} onLogout={handleLogout} />
              ) : session && ['viewer', 'dueño', 'cocinero', 'mozo'].includes(session.role) ? (
                <Navigate to="/" replace />
              ) : (
                <AdminLogin />
              )
            } 
          />
          
          {/* HONOR CALENDAR ROUTE (EXPERIMENTAL) */}
          <Route 
            path="/calendario-honor" 
            element={
              session && session.role === 'admin' ? (
                <HonorCalendarApp session={session} onLogout={handleLogout} />
              ) : session && ['viewer', 'dueño', 'cocinero', 'mozo'].includes(session.role) ? (
                <Navigate to="/" replace />
              ) : (
                <AdminLogin />
              )
            } 
          />
          
          {/* Fallback route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </>
  );
}
