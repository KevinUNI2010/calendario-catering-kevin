import React, { useState, useEffect, useRef, useCallback, Suspense, lazy } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { UserSession } from './types';
import { getSupabase } from './lib/supabase';
import toast from 'react-hot-toast';
import {
  clearPinSession,
  getStoredSignedToken,
  isLocalInactivityExpired,
  parseSignedTokenPayload,
  PIN_TOKEN_REFRESH_INTERVAL_MS,
  saveSignedPinSession,
  touchLocalActivity,
  verifyStoredPinSession,
} from './utils/pinSession';

// Route-level code splitting for fast initial load
const CalendarApp = lazy(() => import('./CalendarApp').then(m => ({ default: m.CalendarApp })));
const HonorCalendarApp = lazy(() => import('./HonorCalendarApp').then(m => ({ default: m.HonorCalendarApp })));
const PinLogin = lazy(() => import('./components/PinLogin').then(m => ({ default: m.PinLogin })));
const AdminLogin = lazy(() => import('./components/AdminLogin').then(m => ({ default: m.AdminLogin })));
const ModernEventCardLab = lazy(() => import('./components/modern-cards/ModernEventCardLab').then(m => ({ default: m.ModernEventCardLab })));
const FichasCocinaPublicView = lazy(() => import('./components/FichasCocinaPublicView').then(m => ({ default: m.FichasCocinaPublicView })));

export default function App() {
  const [session, setSession] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const lastTokenRefreshRef = useRef<number>(Date.now());
  const lastActivityTouchRef = useRef<number>(0);
  const offlineFallbackPendingVerifyRef = useRef<boolean>(false);

  const expirePinSession = useCallback((message: string) => {
    clearPinSession();
    offlineFallbackPendingVerifyRef.current = false;
    setSession((prev) => (prev && prev.role !== 'admin' ? null : prev));
    toast.error(message);
    navigate('/');
  }, [navigate]);

  useEffect(() => {
    let isMounted = true;

    const initSession = async () => {
      // 1. Validar sesión PIN firmada (Viewer, Dueño, Cocinero, Mozo) contra servidor y regla de 30 días
      // SEGURIDAD: 'admin' NUNCA se restaura desde localStorage. Requiere Google OAuth / Supabase Auth.
      const existingToken = getStoredSignedToken();
      if (existingToken) {
        const result = await verifyStoredPinSession();
        if (!isMounted) return;

        if (result.valid && result.session) {
          lastTokenRefreshRef.current = Date.now();
          lastActivityTouchRef.current = Date.now();
          offlineFallbackPendingVerifyRef.current = Boolean(result.offlineFallback);
          setSession(result.session);
          setLoading(false);
          return;
        }

        if (result.reason === 'inactivity_expired') {
          toast.error('Tu sesión expiró por 30 días de inactividad. Ingresa tu PIN nuevamente.');
        } else if (result.reason === 'invalid_signature') {
          toast.error('Sesión inválida o modificada. Ingresa tu PIN nuevamente.');
        } else if (result.reason === 'network_blocked') {
          toast.error('No se pudo verificar tu sesión en el servidor. Conéctate e ingresa tu PIN.');
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
              const auditKey = `admin_audit_${email}`;
              if (!sessionStorage.getItem(auditKey)) {
                sessionStorage.setItem(auditKey, 'true');
                import('./lib/supabase').then(({ logLoginAttempt }) => {
                  logLoginAttempt({
                    client_name: email,
                    role: 'admin',
                    method: 'google',
                    status: 'success',
                  });
                });
              }
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
                const auditKey = `admin_audit_${email}`;
                if (!sessionStorage.getItem(auditKey)) {
                  sessionStorage.setItem(auditKey, 'true');
                  import('./lib/supabase').then(({ logLoginAttempt }) => {
                    logLoginAttempt({
                      client_name: email,
                      role: 'admin',
                      method: 'google',
                      status: 'success',
                    });
                  });
                }
                // Only navigate if we are not already on an admin-allowed route
                const currentPath = window.location.pathname;
                if (currentPath !== '/calendario-honor' && currentPath !== '/admin') {
                  navigate('/admin');
                }
              } else {
                await supabase.auth.signOut();
                toast.error('Acceso denegado. Tu correo no está en la Lista Blanca.');
                import('./lib/supabase').then(({ logLoginAttempt }) => {
                  logLoginAttempt({
                    client_name: email,
                    role: 'admin',
                    method: 'google',
                    status: 'failed',
                    failure_reason: 'Correo no autorizado en lista blanca',
                  });
                });
              }
            }
          } else if (event === 'SIGNED_OUT') {
            setSession((prev) => prev?.role === 'admin' ? null : prev);
          }
        });
      }
      
      if (isMounted) {
        setLoading(false);
      }
    };

    initSession();
    return () => {
      isMounted = false;
    };
  }, [navigate]);

  // Vigilancia continua de inactividad (30 días), manipulación de localStorage y revalidación al reconectar
  useEffect(() => {
    if (!session || session.role === 'admin') return;

    const verifyActiveSession = async (forceServerCheck = false) => {
      const token = getStoredSignedToken();
      const payload = token ? parseSignedTokenPayload(token) : null;
      if (!token || !payload) {
        expirePinSession('Sesión inválida o manipulada. Ingresa tu PIN nuevamente.');
        return;
      }

      if (isLocalInactivityExpired(payload)) {
        expirePinSession('Tu sesión se cerró automáticamente tras 30 días de inactividad.');
        return;
      }

      const now = Date.now();
      const needsRefresh =
        forceServerCheck ||
        offlineFallbackPendingVerifyRef.current ||
        now - lastTokenRefreshRef.current >= PIN_TOKEN_REFRESH_INTERVAL_MS;

      if (navigator.onLine && needsRefresh) {
        const res = await verifyStoredPinSession();
        if (res.valid && res.session) {
          lastTokenRefreshRef.current = Date.now();
          offlineFallbackPendingVerifyRef.current = Boolean(res.offlineFallback);
          const sessionIdentityChanged =
            res.session.id !== session.id ||
            res.session.role !== session.role ||
            res.session.name !== session.name ||
            JSON.stringify(res.session.allowedLocales || []) !== JSON.stringify(session.allowedLocales || []);
          if (sessionIdentityChanged) {
            setSession(res.session);
          }
        } else if (res.reason === 'inactivity_expired') {
          expirePinSession('Tu sesión se cerró automáticamente tras 30 días de inactividad.');
        } else if (res.reason === 'invalid_signature' || res.reason === 'missing' || res.reason === 'network_blocked') {
          expirePinSession('Sesión inválida o manipulada. Ingresa tu PIN nuevamente.');
        }
      }
    };

    const handleActivity = () => {
      const now = Date.now();
      if (now - lastActivityTouchRef.current < 60_000) return;

      const token = getStoredSignedToken();
      const payload = token ? parseSignedTokenPayload(token) : null;
      if (!token || !payload) {
        expirePinSession('Sesión inválida o manipulada. Ingresa tu PIN nuevamente.');
        return;
      }

      if (isLocalInactivityExpired(payload, now)) {
        expirePinSession('Tu sesión se cerró automáticamente tras 30 días de inactividad.');
        return;
      }

      lastActivityTouchRef.current = now;
      touchLocalActivity(now);

      if (navigator.onLine && (offlineFallbackPendingVerifyRef.current || now - lastTokenRefreshRef.current >= PIN_TOKEN_REFRESH_INTERVAL_MS)) {
        verifyActiveSession();
      }
    };

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'calendario_session' || e.key === 'calendario_pin_last_activity') {
        verifyActiveSession(true);
      }
    };

    const handleVisibilityOrOnline = () => {
      if (document.visibilityState === 'visible' || navigator.onLine) {
        const now = Date.now();
        const staleOrPending =
          offlineFallbackPendingVerifyRef.current ||
          now - lastTokenRefreshRef.current >= 5 * 60 * 1000;
        verifyActiveSession(navigator.onLine && staleOrPending);
      }
    };

    const intervalId = window.setInterval(() => verifyActiveSession(false), 5 * 60 * 1000);
    window.addEventListener('pointerdown', handleActivity, { passive: true });
    window.addEventListener('keydown', handleActivity, { passive: true });
    window.addEventListener('touchstart', handleActivity, { passive: true });
    window.addEventListener('scroll', handleActivity, { passive: true });
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('online', handleVisibilityOrOnline);
    document.addEventListener('visibilitychange', handleVisibilityOrOnline);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener('pointerdown', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('touchstart', handleActivity);
      window.removeEventListener('scroll', handleActivity);
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('online', handleVisibilityOrOnline);
      document.removeEventListener('visibilitychange', handleVisibilityOrOnline);
    };
  }, [session, expirePinSession]);

  const handlePinLogin = (newSession: UserSession) => {
    if (newSession.role === 'admin' || !newSession.sessionToken) {
      toast.error('Acceso de administrador requiere inicio de sesión con Google.');
      return;
    }
    const now = Date.now();
    lastTokenRefreshRef.current = now;
    lastActivityTouchRef.current = now;
    offlineFallbackPendingVerifyRef.current = false;
    saveSignedPinSession(newSession.sessionToken, now);
    setSession(newSession);
    navigate('/');
  };

  const handleLogout = async () => {
    const supabase = getSupabase();
    if (session?.role === 'admin' && supabase) {
      await supabase.auth.signOut();
    }
    offlineFallbackPendingVerifyRef.current = false;
    clearPinSession();
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
          {/* Fichas de Cocina A4 (Ruta pública accesible desde móvil sin login) */}
          <Route path="/fichas-cocina" element={<FichasCocinaPublicView />} />
          <Route path="/fichas" element={<FichasCocinaPublicView />} />
          <Route path="/laboratorio-cards" element={<ModernEventCardLab />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </>
  );
}
