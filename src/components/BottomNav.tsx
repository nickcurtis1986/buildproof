"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookmarkIcon, ChartIcon, HomeIcon, SearchIcon, UserIcon } from "./icons";

export default function BottomNav({ isContractor }: { isContractor: boolean }) {
  const path = usePathname();
  const dark = path.startsWith("/feed");
  const tabs = [
    { href: "/feed", label: "Feed", Icon: HomeIcon },
    { href: "/search", label: "Search", Icon: SearchIcon },
    { href: "/saved", label: "Saved", Icon: BookmarkIcon },
    isContractor ? { href: "/account", label: "Dashboard", Icon: ChartIcon } : { href: "/account", label: "Profile", Icon: UserIcon },
  ];
  return (
    <nav
      aria-label="Main"
      className={`fixed inset-x-0 bottom-0 z-40 border-t backdrop-blur-xl pb-[env(safe-area-inset-bottom)] ${
        dark ? "border-white/10 bg-black/75" : "border-rule bg-canvas/95"
      }`}
    >
      <ul className="mx-auto grid max-w-lg grid-cols-4">
        {tabs.map(({ href, label, Icon }) => {
          const active = path === href || path.startsWith(href + "/");
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={`flex min-h-14 flex-col items-center justify-center gap-0.5 text-[11px] font-semibold ${
                  active ? (dark ? "text-orange" : "text-orange-text") : dark ? "text-white/70" : "text-ink-3"
                }`}
              >
                <Icon size={22} />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
