import '@testing-library/jest-dom/vitest';
import { afterAll, afterEach, beforeAll } from 'vitest';
import { server } from './src/mocks/server';

// Ciclo de vida único del servidor MSW para toda la suite (design.md §7,
// copiado textual de mf-administracion/setupTests.ts):
// - listen en beforeAll con onUnhandledRequest:"error" — un path mal escrito
//   falla el test en vez de devolver silencio.
// - resetHandlers en afterEach — los overrides de un test (server.use(...))
//   no se filtran al siguiente archivo/test.
// - close en afterAll.
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
