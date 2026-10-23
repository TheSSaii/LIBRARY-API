import { getBook } from "@/lib/data/books";
import { route } from "@/lib/http";

export const GET = route(async (_request, ctx: RouteContext<"/api/books/[id]">) => {
  const { id } = await ctx.params;
  return Response.json({ book: await getBook(id) });
});
