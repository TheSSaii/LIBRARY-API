import { listBooks, listCategories } from "@/lib/data/books";
import { parseQuery, route } from "@/lib/http";
import { bookQuerySchema } from "@/lib/schemas";

/**
 * GET /api/books?q=&category=&updatedSince=
 * Versión de la semana 9: SIN autenticación (se agrega en la semana 10).
 * `serverTime` se toma ANTES de consultar para no perder cambios concurrentes.
 */
export const GET = route(async (request) => {
  const filter = parseQuery(request, bookQuerySchema);
  const serverTime = new Date().toISOString();
  const [books, categories] = await Promise.all([listBooks(filter), listCategories()]);
  return Response.json({ books, categories, serverTime });
});
