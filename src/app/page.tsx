"use client";

import { useGameStore } from "@/lib/store";
import { PokemonCard } from "../components/game/PokemonCard";
import { PokemonPlaceholder } from "../components/game/PokemonPlaceholder";
import { PokemonDetailModal } from "../components/game/PokemonDetailModal";
import Link from "next/link";
import { useEffect, useState, useMemo } from "react";
import { Rarity, Pokemon } from "@/types";
import { Filter, ArrowUpDown, Eye, EyeOff } from "lucide-react";

export default function Home() {
  const pokemonList = useGameStore((state) => state.pokemonList);
  const totalPacks = useGameStore((state) => state.totalPacksOpened);
  const [mounted, setMounted] = useState(false);

  // Filters
  const [showMissing, setShowMissing] = useState(false);
  const [rarityFilter, setRarityFilter] = useState<Rarity | 'ALL'>('ALL');
  const [sortBy, setSortBy] = useState<'ID' | 'RARITY' | 'LEVEL'>('ID');

  // Modal
  const [selectedPokemon, setSelectedPokemon] = useState<Pokemon | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Derived Collection
  const collection = useMemo(() => {
    let list: Array<{ type: 'owned' | 'missing', data: any }> = [];

    // 1. Build Base List
    if (showMissing) {
      // Generate 1-151 list
      for (let i = 1; i <= 151; i++) {
        const owned = pokemonList.find(p => p.id === i);
        if (owned) {
          list.push({ type: 'owned', data: owned });
        } else {
          list.push({ type: 'missing', data: { id: i } });
        }
      }
    } else {
      list = pokemonList.map(p => ({ type: 'owned', data: p }));
    }

    // 2. Filter 
    if (rarityFilter !== 'ALL') {
      list = list.filter(item => item.type === 'owned' && item.data.rarity === rarityFilter);
    }

    // 3. Sort
    list.sort((a, b) => {
      if (sortBy === 'ID') {
        return (a.data.id || 0) - (b.data.id || 0);
      }
      if (sortBy === 'LEVEL') {
        const lA = a.type === 'owned' ? a.data.level : 0;
        const lB = b.type === 'owned' ? b.data.level : 0;
        return lB - lA; // Descending
      }
      if (sortBy === 'RARITY') {
        const rVal = (r: string) => {
          if (r === 'LEGENDARY') return 5;
          if (r === 'EPIC') return 4;
          if (r === 'SUPER_RARE') return 3;
          if (r === 'RARE') return 2;
          return 1;
        }
        const rA = a.type === 'owned' ? rVal(a.data.rarity) : 0;
        const rB = b.type === 'owned' ? rVal(b.data.rarity) : 0;
        return rB - rA; // Descending
      }
      return 0;
    });

    return list;

  }, [pokemonList, showMissing, rarityFilter, sortBy]);


  if (!mounted) return <div className="text-center p-10">Loading Collection...</div>;

  return (
    <div className="space-y-6 pb-20">

      {/* Header & stats */}
      <div className="flex flex-col md:flex-row justify-between items-center bg-white p-6 rounded-3xl shadow-sm border border-gray-100 gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-800 tracking-tight">POKÉDEX</h1>
          <p className="text-gray-500 font-medium">
            <span className="text-blue-600 font-bold">{pokemonList.length}</span> / 151 Collected • <span className="text-purple-600 font-bold">{totalPacks}</span> Packs
          </p>
        </div>
        <Link
          href="/shop"
          className="bg-black text-white hover:scale-105 active:scale-95 transition-all font-bold py-3 px-8 rounded-full shadow-lg"
        >
          Open Packs +
        </Link>
      </div>

      {/* Controls Bar */}
      <div className="flex flex-col md:flex-row gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100 overflow-x-auto">

        {/* View Toggle */}
        <button
          onClick={() => setShowMissing(!showMissing)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-colors whitespace-nowrap ${showMissing ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}
        >
          {showMissing ? <Eye size={16} /> : <EyeOff size={16} />}
          {showMissing ? 'Show Owned Only' : 'Show Missing'}
        </button>

        <div className="w-px bg-gray-200 hidden md:block"></div>

        {/* Sort */}
        <div className="flex items-center gap-2">
          <ArrowUpDown size={16} className="text-gray-400" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-gray-50 border border-gray-200 rounded-lg py-2 px-3 text-sm font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="ID">Sort: Number</option>
            <option value="RARITY">Sort: Rarity</option>
            <option value="LEVEL">Sort: Level</option>
          </select>
        </div>

        {/* Rarity Filter */}
        <div className="flex items-center gap-2 flex-1">
          <Filter size={16} className="text-gray-400" />
          <div className="flex gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-hide">
            {['ALL', 'COMMON', 'RARE', 'SUPER_RARE', 'EPIC', 'LEGENDARY'].map(r => (
              <button
                key={r}
                onClick={() => setRarityFilter(r as any)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${rarityFilter === r
                  ? 'bg-black text-white shadow-md'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}
              >
                {r.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

      </div>

      {/* Grid */}
      {collection.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-20 bg-white rounded-3xl border-dashed border-2 border-gray-200 opacity-50">
          <p className="text-gray-400 font-bold text-lg mb-2">No Pokémon found</p>
          <p className="text-gray-400 text-sm">Try changing filters or open more packs!</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {collection.map((item, i) => (
            item.type === 'owned' ? (
              <PokemonCard
                key={`owned-${item.data.id}`}
                pokemon={item.data}
                onClick={() => setSelectedPokemon(item.data)} // Click to open modal
              />
            ) : (
              <PokemonPlaceholder key={`missing-${item.data.id}`} id={item.data.id} />
            )
          ))}
        </div>
      )}

      {/* Modal */}
      {selectedPokemon && (
        <PokemonDetailModal
          pokemon={selectedPokemon}
          onClose={() => setSelectedPokemon(null)}
        />
      )}
    </div>
  );
}
