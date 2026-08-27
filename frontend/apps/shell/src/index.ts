// Async boundary obligatorio para Module Federation (design.md §3, nota 1).
// Si `bootstrap` se importa de forma estática, los módulos de la app se
// evalúan antes de que exista el shared scope de MF y React se duplica.
import("./bootstrap");
