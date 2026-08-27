// Fallback manual de tipos (design.md §5.3, task 2.4.6): si el `dts` de MF
// 2.0 falla o los remotes todavía no generaron sus tipos, este archivo evita
// que `tsc` rompa por `import('mf_reservas/App')` etc. Estructuralmente
// equivalente al `export default` de cada `src/App.tsx` de los remotes.
declare module "mf_reservas/App" {
  import type { ComponentType } from "react";
  const App: ComponentType;
  export default App;
}

declare module "mf_administracion/App" {
  import type { ComponentType } from "react";
  const App: ComponentType;
  export default App;
}

declare module "mf_reportes/App" {
  import type { ComponentType } from "react";
  const App: ComponentType;
  export default App;
}
