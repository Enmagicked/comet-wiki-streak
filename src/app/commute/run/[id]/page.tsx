import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import { CommuteQueuePlayer } from "@/components/commute/CommuteQueuePlayer";

export const dynamic = "force-dynamic";

type QueueItem = { title: string; pageid: number; est_minutes: number; extract?: string };

export default async function RunPage(props: PageProps<"/commute/run/[id]">) {
  const { id } = await props.params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");
  const { data: run } = await supabase
    .from("commute_runs").select("*").eq("id", id).eq("user_id", user.id).single();
  if (!run) notFound();
  const queue = (run.queue as QueueItem[]) ?? [];
  return <CommuteQueuePlayer runId={run.id} queue={queue} category={run.category ?? "Surprise me"} target={run.target_minutes} />;
}
