"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { ShoppingBag, Swords, User, Menu } from "lucide-react";
import { useGameStore } from "@/lib/store";
import { useEffect, useState } from "react";

export function Navbar() {
    const pathname = usePathname();
    const money = useGameStore((state) => state.money);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const links = [
        { href: "/", label: "Pokédex", icon: User },
        { href: "/shop", label: "Shop", icon: ShoppingBag },
        { href: "/battle", label: "Battle", icon: Swords },
    ];

    return (
        <nav className="fixed bottom-0 left-0 right-0 md:top-0 md:bottom-auto bg-white/80 backdrop-blur-md border-t md:border-b md:border-t-0 border-gray-200 z-50 shadow-sm">
            <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">

                {/* Mobile: Space out. Desktop: Left align logo, Right align links */}
                <div className="hidden md:flex items-center gap-2 font-black text-xl tracking-tighter text-blue-600">
                    <span>PokéCollection</span>
                </div>

                <div className="flex w-full md:w-auto justify-around md:gap-8">
                    {links.map((link) => {
                        const Icon = link.icon;
                        const isActive = pathname === link.href;
                        return (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={cn(
                                    "flex flex-col md:flex-row items-center gap-1 md:gap-2 p-2 rounded-xl transition-all duration-200",
                                    isActive
                                        ? "text-blue-600 bg-blue-50/50 scale-105"
                                        : "text-gray-400 hover:text-gray-600 hover:bg-gray-50"
                                )}
                            >
                                <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                                <span className={cn("text-[10px] md:text-sm font-bold", isActive ? "opacity-100" : "opacity-70")}>
                                    {link.label}
                                </span>
                            </Link>
                        );
                    })}
                </div>

                <div className="hidden md:flex items-center bg-yellow-100 text-yellow-800 px-4 py-1.5 rounded-full font-bold shadow-sm border border-yellow-200">
                    <span className="mr-2">💰</span>
                    {mounted ? money : "..."}
                </div>
            </div>
        </nav>
    );
}
