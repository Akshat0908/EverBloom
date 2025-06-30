import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import AuthForm from './components/AuthForm';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Relationships from './pages/Relationships';
import AIStudio from './pages/AIStudio';
import Messages from './pages/Messages';
import Settings from './pages/Settings';

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-soft-pink via-soft-cream to-soft-lavender flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 bg-gradient-to-r from-primary-400 to-primary-600 rounded-full flex items-center justify-center mb-4 mx-auto">
          <span className="text-2xl animate-pulse">💖</span>
        </div>
        <div className="space-y-2">
          <div className="w-32 h-2 bg-primary-200 rounded-full mx-auto overflow-hidden">
            <div className="w-full h-full bg-gradient-to-r from-primary-400 to-primary-600 rounded-full animate-pulse"></div>
          </div>
          <p className="text-gray-600 text-sm">Loading EverBloom...</p>
        </div>
      </div>
    </div>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <LoadingScreen />;
  }
  
  return user ? <>{children}</> : <Navigate to="/auth" replace />;
}

function AppContent() {
  const { user, loading } = useAuth();

  // Show loading screen only briefly
  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <Router
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true
      }}
    >
      <Routes>
        <Route 
          path="/auth" 
          element={user ? <Navigate to="/" replace /> : <AuthForm />} 
        />
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <Layout>
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/relationships" element={<Relationships />} />
                  <Route path="/ai-studio" element={<AIStudio />} />
                  <Route path="/messages" element={<Messages />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </Layout>
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(236, 72, 153, 0.2)',
            borderRadius: '12px',
            padding: '12px',
          },
          success: {
            iconTheme: {
              primary: '#EC4899',
              secondary: '#FFFFFF',
            },
          },
          error: {
            iconTheme: {
              primary: '#EF4444',
              secondary: '#FFFFFF',
            },
          },
        }}
      />
    </AuthProvider>
  );
}