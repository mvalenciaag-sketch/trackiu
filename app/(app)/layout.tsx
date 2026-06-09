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
      {/* pt-14: clears the fixed header (h-14 = 56px)
          pb-24: clears the fixed nav bar (h-16 = 64px) + FAB overhang */}
      <main className="flex-1 pt-14 pb-24">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
