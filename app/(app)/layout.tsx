import { AppHeader } from "@/components/ui/AppHeader";
import { BottomNav } from "@/components/ui/BottomNav";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="w-full max-w-[480px] mx-auto min-h-dvh bg-background flex flex-col relative">
      <AppHeader />
      {/*
        pt-[52px]: clears the fixed header (px-5 pt-1.5 pb-3 with 23px logo ≈ 52px)
        pb-[78px]: clears the fixed nav bar (64px content + 14px safe padding)
      */}
      <main className="flex-1 pt-[52px] pb-[96px]">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
