// Tabla de rutas del shell (design.md §4). Los loaders de los 3 remotes son
// inyectables (`remoteLoaders`) para poder testear sin depender del runtime
// real de Module Federation; en producción usan los imports federados
// default, tipados por `../remotes.d.ts` (fallback de task 2.4.6).
import type { ComponentType } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { AccesoDenegadoPage } from "../auth/AccesoDenegadoPage";
import { LoginPage } from "../auth/LoginPage";
import { RegisterPage } from "../auth/RegisterPage";
import { RequireAuth } from "../auth/RequireAuth";
import { RequireRole } from "../auth/RequireRole";
import { useSession } from "../session/useSession";
import { NotFoundPage } from "./NotFoundPage";
import { RemoteBoundary } from "./RemoteBoundary";
import { RootLayout } from "./RootLayout";

type RemoteLoader = () => Promise<{ default: ComponentType }>;

export interface AppRouterRemoteLoaders {
  reservas?: RemoteLoader;
  administracion?: RemoteLoader;
  reportes?: RemoteLoader;
}

const DEFAULT_LOADERS: Required<AppRouterRemoteLoaders> = {
  reservas: () => import("mf_reservas/App"),
  administracion: () => import("mf_administracion/App"),
  reportes: () => import("mf_reportes/App"),
};

/** '/login' es público, pero redirige a /reservas si ya hay sesión (design.md §4). */
function RedirectIfAuthenticated({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useSession();
  if (isAuthenticated) return <Navigate to="/reservas" replace />;
  return <>{children}</>;
}

export function AppRouter({ remoteLoaders = {} }: { remoteLoaders?: AppRouterRemoteLoaders } = {}) {
  const loaders = { ...DEFAULT_LOADERS, ...remoteLoaders };

  return (
    <Routes>
      <Route
        path="/login"
        element={
          <RedirectIfAuthenticated>
            <LoginPage />
          </RedirectIfAuthenticated>
        }
      />

      <Route
        path="/registro"
        element={
          <RedirectIfAuthenticated>
            <RegisterPage />
          </RedirectIfAuthenticated>
        }
      />

      <Route path="/" element={<Navigate to="/reservas" replace />} />

      <Route element={<RootLayout />}>
        <Route element={<RequireAuth />}>
          <Route
            path="/reservas/*"
            element={<RemoteBoundary name="mf-reservas" loader={loaders.reservas} />}
          />

          <Route element={<RequireRole rol="administrador" />}>
            <Route
              path="/administracion/*"
              element={<RemoteBoundary name="mf-administracion" loader={loaders.administracion} />}
            />
            <Route
              path="/reportes/*"
              element={<RemoteBoundary name="mf-reportes" loader={loaders.reportes} />}
            />
          </Route>

          <Route path="/acceso-denegado" element={<AccesoDenegadoPage />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
