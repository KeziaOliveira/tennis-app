import React from "react";
import { createBrowserRouter, RouterProvider, Navigate } from "react-router";
import { useAuth } from "../contexts/AuthContext";
import Auth from "../views/Auth";
import App from "../App";
import EventForm from "../views/EventForm";
import TournamentAdmin from "../views/TournamentAdmin";

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ 
        display: "flex", 
        justifyContent: "center", 
        alignItems: "center", 
        minHeight: "100vh" 
      }}>
        <p>Carregando...</p>
      </div>
    );
  }

  return user ? <>{children}</> : <Navigate to="/login" replace />;
};

const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ 
        display: "flex", 
        justifyContent: "center", 
        alignItems: "center", 
        minHeight: "100vh" 
      }}>
        <p>Carregando...</p>
      </div>
    );
  }

  return user ? <Navigate to="/" replace /> : <>{children}</>;
};

const router = createBrowserRouter([
  {
    path: "/login",
    element: (
      <PublicRoute>
        <Auth />
      </PublicRoute>
    ),
  },
  {
    path: "/register",
    element: (
      <PublicRoute>
        <Auth />
      </PublicRoute>
    ),
  },
  {
    path: "/",
    element: (
      <ProtectedRoute>
        <App />
      </ProtectedRoute>
    ),
  },
  {
    path: "/new-event",
    element: (
      <ProtectedRoute>
        <EventForm />
      </ProtectedRoute>
    ),
  },
  {
    path: "/tournament/:eventId",
    element: (
      <ProtectedRoute>
        <TournamentAdmin />
      </ProtectedRoute>
    ),
  },
]);

const AppRouter = () => {
  return <RouterProvider router={router} />;
};

export default AppRouter;

