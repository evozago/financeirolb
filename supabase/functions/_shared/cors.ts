// Pequeno helper para CORS
export function corsHeaders(req: Request) {
  const origin = req.headers.get("origin") ?? "*";
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-entity-id",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  };
}
