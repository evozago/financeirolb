// src/config/featureFlags.ts
/**
 * Central de feature flags (controladas via variáveis VITE_*)
 * - VITE_FEATURE_SALES=1 -> módulo de Vendas ATIVO
 * - VITE_FEATURE_SALES=0 -> módulo de Vendas OCULTO
 */
export const features = {
  sales: String(import.meta.env.VITE_FEATURE_SALES ?? "0") === "1",
};
