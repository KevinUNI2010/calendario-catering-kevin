import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { CalendarApp } from './CalendarApp';
import { HonorCalendarApp } from './HonorCalendarApp';
import { PinLogin } from './components/PinLogin';
import { AdminLogin } from './components/AdminLogin';
import { UserSession } from './types';
import { getSupabase } from './lib/supabase';
import toast from 'react-hot-toast';

export default function App() {
  const [session, setSession] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const initSession = async () => {
      // 1. Check local storage for PIN session (Viewer)
      const savedPin = localStorage.getItem('calendario_session');
      if (savedPin) {
        try {
          const parsed = JSON.parse(savedPin);
          if (parsed && parsed.role === 'viewer') {
            setSession(parsed);
            setLoading(false);
            return;
          }
        } catch (e) {}
      }

      // 2. Check Supabase Auth for Google Admin
      const supabase = getSupabase();
      if (supabase) {
        const { data: { session: supaSession } } = await supabase.auth.getSession();
        if (supaSession?.user) {
          const email = supaSession.user.email;
          console.log('Init Session Email:', email);
          if (email) {
            // Check if email is in admin_emails
            const { data: adminData, error: adminError } = await supabase
              .from('admin_emails')
              .select('email')
              .ilike('email', email)
              .maybeSingle();
              
            console.log('Init Session Admin Data:', adminData);
              
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
          console.log('Auth event:', event, 'Session:', currentSession);
          if (event === 'SIGNED_IN' && currentSession?.user) {
            const email = currentSession.user.email;
            console.log('Email from Google:', email);
            if (email) {
              const { data: adminData, error: adminError } = await supabase
                .from('admin_emails')
                .select('email')
                .ilike('email', email)
                .maybeSingle();
                
              console.log('Admin Data from DB:', adminData, 'Error:', adminError);
                
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
    setSession(newSession);
    localStorage.setItem('calendario_session', JSON.stringify(newSession));
    navigate('/');
  };

  const handleLogout = async () => {
    const supabase = getSupabase();
    if (session?.role === 'admin' && supabase) {
      await supabase.auth.signOut();
    } else {
      localStorage.removeItem('calendario_session');
    }
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
      <Routes>
        {/* PUBLIC / VIEWER ROUTE */}
        <Route 
          path="/" 
          element={
            session && session.role === 'viewer' ? (
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
            ) : session && session.role === 'viewer' ? (
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
            ) : session && session.role === 'viewer' ? (
              <Navigate to="/" replace />
            ) : (
              <AdminLogin />
            )
          } 
        />
        
        {/* Fallback route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
