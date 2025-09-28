// src/utils/isSeller.ts
export const isSeller = (roles: string[] = []) =>
  roles.some((r) => {
    const n = r?.toLowerCase();
    return n === "vendedora" || n === "vendedor" || n?.startsWith("vendedor");
  });
