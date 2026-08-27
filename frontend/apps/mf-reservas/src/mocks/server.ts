// Servidor MSW compartido por toda la suite (design.md §9). Un path mal
// escrito debe fallar el test (`onUnhandledRequest: "error"`), no devolver
// silencio: es exactamente la clase de bug del `/mias` inexistente que
// motivó esta change.
import { setupServer } from "msw/node";
import { handlers } from "./handlers";

export const server = setupServer(...handlers);
