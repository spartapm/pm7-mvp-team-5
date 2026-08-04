import { ReactNode } from "react";

export function MobileShell({
  children,
  className = "",
  bg = "bg-white",
}: {
  children: ReactNode;
  className?: string;
  bg?: string;
}) {
  return (
    <div className="min-h-screen flex justify-center bg-[#cfcfcf]">
      <div
        className={`relative w-full max-w-mobile min-h-screen ${bg} shadow-2xl overflow-x-hidden ${className}`}
      >
        {children}
      </div>
    </div>
  );
}
