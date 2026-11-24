import { ClaimLabApp } from "@/components/claim-lab/ClaimLabApp";

export default function Home() {
  return (
    <>
      <ClaimLabApp />
      <footer className="relative z-10 border-t border-slate-800/80 bg-[#06080d] px-4 py-4 text-center font-mono text-[10px] uppercase tracking-widest text-slate-600">
        Research landscape only
      </footer>
    </>
  );
}