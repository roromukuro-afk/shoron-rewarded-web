// app/api/link/create/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "../../_supabase";

function pad6(n: number) {
  return n.toString().padStart(6, "0");
}

async function getAuthUserId(req: NextRequest): Promise<string | null> {
  const auth = req.headers.get("authorization") || "";
  if (!auth.startsWith("Bearer ")) return null;
  const token = auth.slice("Bearer ".length);

  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data?.user?.id) return null;
  return data.user.id;
}

export async function POST(req: NextRequest) {
  const userId = await getAuthUserId(req);
  if (!userId) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  // 10分有効
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

  // 重複しない6桁コードを数回トライ
  for (let i = 0; i < 10; i++) {
    const code = pad6(Math.floor(Math.random() * 1_000_000));

    const { error } = await supabaseAdmin.from("link_codes").insert({
      code,
      user_id: userId,
      expires_at: expiresAt,
    });

    if (!error) {
      return NextResponse.json({ ok: true, code, expiresAt });
    }
  }

  return NextResponse.json(
    { ok: false, error: "code_generation_failed" },
    { status: 500 }
  );
}