import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type Body = {
  id?: string;
  article_title: string;
  article_pageid?: number;
  category?: string;
  seconds_read: number;
  scroll_pct: number;
  completed?: boolean;
  source?: "streak" | "commute";
};

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = (await req.json()) as Body;

  if (body.id) {
    const { data, error } = await supabase
      .from("reading_sessions")
      .update({
        seconds_read: body.seconds_read,
        scroll_pct: body.scroll_pct,
        completed: body.completed ?? false,
        ended_at: new Date().toISOString(),
      })
      .eq("id", body.id)
      .eq("user_id", user.id)
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ session: data });
  }

  const { data, error } = await supabase
    .from("reading_sessions")
    .insert({
      user_id: user.id,
      article_title: body.article_title,
      article_pageid: body.article_pageid ?? null,
      category: body.category ?? null,
      seconds_read: body.seconds_read,
      scroll_pct: body.scroll_pct,
      completed: body.completed ?? false,
      source: body.source ?? "streak",
    })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ session: data });
}
