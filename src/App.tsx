import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { LanguageProvider } from './contexts/LanguageContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import Login from './components/Login/Login';
import SignUp from './components/SignUp/SignUp';
import Home from './pages/Home';
import Instances from './pages/Instances';
import Dispatches from './pages/Dispatches';
import CRM from './pages/CRM';
import MindClerky from './pages/MindClerky';
import Integration from './pages/Integration';
import AIAgentPage from './pages/AIAgent';
import Documentation from './pages/Documentation';
import Settings from './pages/Settings';
import { usePageTitle } from './hooks/usePageTitle';

function AppContent() {
  usePageTitle();

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<SignUp />} />
      <Route
        path="/inicio"
        element={
          <ProtectedRoute>
            <Home />
          </ProtectedRoute>
        }
      />
      <Route
        path="/gerenciador-conexoes"
        element={
          <ProtectedRoute>
            <Instances />
          </ProtectedRoute>
        }
      />
      <Route
        path="/disparos"
        element={
          <ProtectedRoute>
            <Dispatches />
          </ProtectedRoute>
        }
      />
      <Route
        path="/crm"
        element={
          <ProtectedRoute>
            <CRM />
          </ProtectedRoute>
        }
      />
      <Route
        path="/mindclerky"
        element={
          <ProtectedRoute>
            <MindClerky />
          </ProtectedRoute>
        }
      />
      <Route
        path="/integracao"
        element={
          <ProtectedRoute>
            <Integration />
          </ProtectedRoute>
        }
      />
      <Route
        path="/agente-ia"
        element={
          <ProtectedRoute>
            <AIAgentPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/documentacao"
        element={
          <ProtectedRoute>
            <Documentation />
          </ProtectedRoute>
        }
      />
      <Route
        path="/configuracoes"
        element={
          <ProtectedRoute>
            <Settings />
          </ProtectedRoute>
        }
      />
      <Route path="/" element={<Login />} />
    </Routes>
  );
}

function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <BrowserRouter
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true,
          }}
        >
          <AuthProvider>
            <AppContent />
          </AuthProvider>
        </BrowserRouter>
      </LanguageProvider>
    </ThemeProvider>
  );
}

export default App;

