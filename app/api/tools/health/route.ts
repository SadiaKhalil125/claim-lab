import { runAllToolsHealthCheck } from "@/lib/tools";

export async function GET() {
  const results = await runAllToolsHealthCheck();
  const allOk = results.every((r) => r.ok);
  return Response.json(
    { ok: allOk, checkedAt: new Date().toISOString(), results },
    { status: allOk ? 200 : 207 },
  );
}