import React from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { User, LogOut, Settings } from "lucide-react";
import { useGetMe } from "@workspace/api-client-react";

export function Navbar() {
  const { isAuthenticated, logout } = useAuth();
  const { data: user } = useGetMe({
    query: {
      enabled: isAuthenticated,
      retry: false,
    },
  });

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 max-w-screen-2xl items-center justify-between px-4 md:px-8">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex flex-col">
            <span className="text-2xl font-bold tracking-tight">
              <span className="text-primary">Eki</span>
              <span className="text-accent">Eco</span>
            </span>
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold -mt-1">
              Биржа отходов
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-4">
          {isAuthenticated ? (
            <div className="flex items-center gap-4">
              <Link href="/profile">
                <Button variant="ghost" size="sm" className="gap-2">
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
    </header>
  );
}
