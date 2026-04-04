import React from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { User, LogOut, Plus, Home, List } from "lucide-react";
import { useGetMe } from "@workspace/api-client-react";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/", label: "Главная", icon: Home },
  { href: "/listings", label: "Объявления", icon: List },
  { href: "/listings/new", label: "Добавить", icon: Plus },
];

export function Navbar() {
  const { isAuthenticated, logout } = useAuth();
  const [location] = useLocation();
  const { data: user } = useGetMe({
    query: {
      enabled: isAuthenticated,
      retry: false,
    },
  });

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 max-w-screen-2xl items-center justify-between px-4 md:px-8">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex flex-col">
              <span className="text-2xl font-bold tracking-tight leading-none">
                <span className="text-primary">Eki</span>
                <span className="text-accent">Eco</span>
              </span>
              <span className="text-[9px] uppercase tracking-widest text-muted-foreground font-semibold">
                Биржа отходов
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map(({ href, label, icon: Icon }) => (
              <Link key={href} href={href}>
                <button
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                    location === href
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </button>
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <div className="flex items-center gap-2">
              <Link href="/profile">
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "gap-2",
                    location === "/profile" && "bg-primary/10 text-primary"
                  )}
                >
                  <User className="h-4 w-4" />
                  <span className="hidden sm:inline">{user?.phone || "Профиль"}</span>
                </Button>
              </Link>
              <Button variant="ghost" size="icon" onClick={logout} title="Выход">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <Link href="/auth">
              <Button variant="default" className="bg-primary text-primary-foreground hover:bg-primary/90">
                Войти
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Mobile nav */}
      <div className="md:hidden border-t border-border/40 bg-background flex items-center justify-around py-1">
        {NAV_LINKS.map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href}>
            <button
              className={cn(
                "flex flex-col items-center gap-0.5 px-4 py-1 text-[10px] font-medium transition-colors",
                location === href ? "text-primary" : "text-muted-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          </Link>
        ))}
        <Link href="/profile">
          <button
            className={cn(
              "flex flex-col items-center gap-0.5 px-4 py-1 text-[10px] font-medium transition-colors",
              location === "/profile" ? "text-primary" : "text-muted-foreground"
            )}
          >
            <User className="h-4 w-4" />
            Профиль
          </button>
        </Link>
      </div>
    </header>
  );
}
