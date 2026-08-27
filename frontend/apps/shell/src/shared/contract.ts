// Expuesto vía MF como 'shell/contract' (design.md §5). Regla de evolución:
// solo cambios aditivos. Quitar o renombrar un miembro de 'shell/session' o
// 'shell/apiClient' exige bumpear esta constante y actualizar los 3 remotes
// en el mismo commit. RemoteHealthCard la muestra: si un remote quedó
// buildeado contra v1 y el shell ya está en v2, se ve a simple vista.
export const SHELL_CONTRACT_VERSION = 1;
