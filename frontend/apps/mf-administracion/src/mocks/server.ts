// Servidor MSW compartido por toda la suite (design.md §7, copiado de
// mf-reservas). Un path mal escrito debe fallar el test
// (`onUnhandledRequest: "error"`), no devolver silencio.
import { setupServer } from "msw/node";
import { handlers } from "./handlers";

export const server = setupServer(...handlers);
