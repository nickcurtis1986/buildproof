import { redirect } from "next/navigation";
import BottomNav from "@/components/BottomNav";
import { getViewer } from "@/lib/supabase/server";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, profile } = await getViewer();
  if (user && profile && !profile.role) redirect("/onboarding");
  return (
    <>
      {children}
      <BottomNav isContractor={profile?.role === "contractor"} />
    </>
  );
}
