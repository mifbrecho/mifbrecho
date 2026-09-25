"use client";

import Link from "next/link";
import { ShoppingBag, Heart, User, Menu } from "lucide-react";
import { useCart } from "@/store/cart";
import { useState } from "react";

export function Header() {
  const totalItems = useCart((s) => s.totalItems());
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-primary-light shadow-sm">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <span className="text-2xl font-bold text-primary tracking-tight">
            MIF BRECHO
          </span>
        </Link>

        {/* Nav desktop */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-text">
          <Link href="/" className="hover:text-primary transition">
            Início
          </Link>
          <Link href="/produtos" className="hover:text-primary transition">
            Peças
          </Link>
          <Link href="/categorias" className="hover:text-primary transition">
            Categorias
          </Link>
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <Link
            href="/favoritos"
            className="p-2 rounded-full hover:bg-secondary transition"
            aria-label="Favoritos"
          >
            <Heart className="w-5 h-5 text-primary" />
          </Link>

          <Link
            href="/carrinho"
            className="relative p-2 rounded-full hover:bg-secondary transition"
            aria-label="Carrinho"
          >
            <ShoppingBag className="w-5 h-5 text-primary" />
            {totalItems > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-primary text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                {totalItems}
              </span>
            )}
          </Link>

          <Link
            href="/conta"
            className="p-2 rounded-full hover:bg-secondary transition"
            aria-label="Minha conta"
          >
            <User className="w-5 h-5 text-primary" />
          </Link>

          <button
            className="md:hidden p-2"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Menu"
          >
            <Menu className="w-5 h-5 text-primary" />
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-primary-light bg-white px-4 py-3 flex flex-col gap-2">
          <Link href="/" onClick={() => setMenuOpen(false)}>
            Início
          </Link>
          <Link href="/produtos" onClick={() => setMenuOpen(false)}>
            Peças
          </Link>
          <Link href="/categorias" onClick={() => setMenuOpen(false)}>
            Categorias
          </Link>
        </div>
      )}
    </header>
  );
}
