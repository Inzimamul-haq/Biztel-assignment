interface LogoProps {
  size?: "sm" | "md";
}

export function Logo({ size = "md" }: LogoProps) {
  const box = size === "sm" ? "h-8 w-8 text-xs" : "h-10 w-10 text-sm";
  return (
    <div className="flex items-center gap-2.5">
      <div
        className={`${box} flex items-center justify-center rounded-xl bg-gradient-to-br from-brand-400 to-violet-500 font-bold text-white shadow-lg shadow-brand-500/25`}
      >
        SF
      </div>
      <div className="leading-tight">
        <p className="text-sm font-semibold tracking-tight text-white">Shop-Floor Copilot</p>
        {size === "md" && <p className="text-xs text-zinc-500">Kaveri Precision · Hosur</p>}
      </div>
    </div>
  );
}

