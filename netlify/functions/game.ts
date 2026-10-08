// Netlify Functions (v2 style). Blobs storage works automatically here; no connectLambda needed.
import { handler } from "../../lib/engine";

export default async (req: Request) => {
  const url = new URL(req.url);
  const out = await handler({
    httpMethod: req.method,
    body: req.method === "GET" ? "" : await req.text(),
    queryStringParameters: Object.fromEntries(url.searchParams),
  });
  return new Response(out.body, { status: out.statusCode, headers: out.headers });
};
