// app/api/result/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "../../_supabase";

function isUuid(v: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
}

async function getAuthUserId(req: NextRequest): Promise<string | null> {
  const auth = req.headers.get("authorization") || "";
  if (!auth.startsWith("Bearer ")) return null;
  const token = auth.slice("Bearer ".length);

  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data?.user?.id) return null;
  return data.user.id;
}

async function resolveUserId(req: NextRequest): Promise<{ userId: string | null; mode: "auth" | "linked" | "anon" | "none" }> {
  const authUserId = await getAuthUserId(req);
  if (authUserId) return { userId: authUserId, mode: "auth" };

  const anonId = req.cookies.get("anon_id")?.value ?? "";
  if (!anonId || !isUuid(anonId)) return { userId: null, mode: "none" };

  // スマホ連動（device_links）があるなら、そっちを優先
  const { data: linkRow } = await supabaseAdmin
    .from("device_links")
    .select("user_id")
    .eq("anon_id", anonId)
    .maybeSingle();

  if (linkRow?.user_id && isUuid(linkRow.user_id)) {
    return { userId: linkRow.user_id, mode: "linked" };
  }

  return { userId: anonId, mode: "anon" };
}

/**
 * ✅ Next.js 16 の型: context.params が Promise になっているため、
 * 第2引数は { params: Promise<{id:string}> } にする必要がある
 */
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { userId, mode } = await resolveUserId(req);
  if (!userId) {
    return NextResponse.json({ ok: false, error: "not_logged_in" }, { status: 401 });
  }

  const { id } = await context.params;

  // essayId は数値前提（/result/20 みたいな運用）
  const essayId = Number(id);
  if (!Number.isFinite(essayId) || essayId <= 0) {
    return NextResponse.json({ ok: false, error: "invalid_id" }, { status: 400 });
  }

  // 本人のessayのみ取得
  const { data: essay, error: e1 } = await supabaseAdmin
    .from("essays")
    .select("id,user_id,question,constraints,essay_text,char_count,created_at,request_id")
    .eq("id", essayId)
    .eq("user_id", userId)
    .maybeSingle();

  if (e1) return NextResponse.json({ ok: false, error: "db_error", detail: e1.message }, { status: 500 });
  if (!essay) return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });

  // 最新の採点結果（あれば）
  const { data: grading, error: e2 } = await supabaseAdmin
    .from("grading_results")
    .select("id,essay_id,score,result_json,created_at")
    .eq("essay_id", essayId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (e2) return NextResponse.json({ ok: false, error: "db_error", detail: e2.message }, { status: 500 });

  return NextResponse.json({
    ok: true,
    mode, // auth / linked / anon
    essay,
    grading: grading ?? null,
  });
}