export async function GET() {
  const key = process.env.POLYGON_API_KEY;
  if (!key) {
    return new Response(JSON.stringify({ error: "Missing POLYGON_API_KEY" }), {
      status: 500,
    });
  }
}

const snapshotRes = await fetch(
  `https://api.polygon.io/v3/snapshot/options/I:SPX?apiKey=${key}`
);

if (!snapshotRes.ok) {
  const err = await snapshotRes.text();
  return new Response(err, { status: snapshotRes.status });
}
