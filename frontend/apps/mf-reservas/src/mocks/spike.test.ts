// Spike [BLOQUEANTE] (tasks.md 1.2): valida que MSW v2 (`setupServer`)
// funciona bajo `environment: "jsdom"` (vitest.config.ts) ANTES de construir
// el resto de la infraestructura de mocks. MSW v2 depende de globals de red
// (`Request`/`Response`/`TransformStream`/`BroadcastChannel`) que jsdom no
// siempre expone completos — ver design.md §9 "Riesgo abierto". Si este test
// falla, la resolución (polyfills en setupTests.ts o un `environment` custom)
// va ANTES de continuar con el resto de la Fase 1.
import { HttpResponse, http } from "msw";
import { describe, expect, it } from "vitest";
import { server } from "./server";

// Usa el server GLOBAL (setupTests.ts ya corre listen/resetHandlers/close
// para toda la suite): levantar un `setupServer` propio acá competiría con
// esa instancia por la interceptación de `fetch`.
describe("spike: MSW v2 sobre jsdom", () => {
  it("intercepta un fetch same-origin y devuelve el body mockeado", async () => {
    server.use(http.get("/spike/ping", () => HttpResponse.json({ ok: true })));

    const response = await fetch("/spike/ping");
    const body = await response.json();

    expect(response.ok).toBe(true);
    expect(body).toEqual({ ok: true });
  });
});
