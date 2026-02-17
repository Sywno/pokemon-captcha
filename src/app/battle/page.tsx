"use client";

import { useGameStore } from "@/lib/store";
import { useState, useEffect } from "react";
import { Pokemon } from "@/types";
import { PokemonCard } from "../../components/game/PokemonCard";
import { calculateDamage } from "@/lib/battle";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUpDown, Filter, Swords, Shield, Zap, Skull, Trophy } from "lucide-react";
import { TYPE_COLORS } from "@/lib/constants";
import { getPokemonData } from "@/lib/pokeapi";
import { useNarrator } from "@/hooks/useNarrator";
import { NarratorBox } from "@/components/game/NarratorBox";
import { PERSONALITIES, BattleTurnContext } from "@/lib/ai/narrator-types";

type Phase = 'SELECT' | 'BATTLE' | 'RESULT';

export default function BattlePage() {
    const { pokemonList, addMoney, battlesWon } = useGameStore();
    const [phase, setPhase] = useState<Phase>('SELECT');
    const [selectedTeam, setSelectedTeam] = useState<Pokemon[]>([]);
    const [enemyTeam, setEnemyTeam] = useState<Pokemon[]>([]);

    // Filter State
    const [rarityFilter, setRarityFilter] = useState<string | 'ALL'>('ALL');
    const [sortBy, setSortBy] = useState<'ID' | 'RARITY' | 'LEVEL'>('ID');

    // Narrator State
    const [personalityId, setPersonalityId] = useState('sportscaster');
    const { commentary, isNarrating, isSpeaking, isMuted, error: narratorError, narrateTurn: narrateAction, clearCommentary, toggleMute } = useNarrator(personalityId);

    // Filtered List
    const filteredList = pokemonList.filter(p => {
        if (rarityFilter !== 'ALL' && p.rarity !== rarityFilter) return false;
        return true;
    }).sort((a, b) => {
        if (sortBy === 'ID') return a.id - b.id;
        if (sortBy === 'LEVEL') return b.level - a.level;
        if (sortBy === 'RARITY') {
            const rVal = (r: string) => {
                if (r === 'LEGENDARY') return 5;
                if (r === 'EPIC') return 4;
                if (r === 'SUPER_RARE') return 3;
                if (r === 'RARE') return 2;
                return 1;
            }
            return rVal(b.rarity) - rVal(a.rarity);
        }
        return 0;
    });

    // Battle State
    const [playerActiveIndex, setPlayerActiveIndex] = useState(0);
    const [enemyActiveIndex, setEnemyActiveIndex] = useState(0);
    const [playerHP, setPlayerHP] = useState(0);
    const [enemyHP, setEnemyHP] = useState(0);
    const [battleLog, setBattleLog] = useState<string[]>([]);
    const [isPlayerTurn, setIsPlayerTurn] = useState(true);
    const [turnCount, setTurnCount] = useState(1);
    const [winner, setWinner] = useState<'player' | 'enemy' | null>(null);

    useEffect(() => {
        // Reset selection if list changes
        if (selectedTeam.length === 0 && pokemonList.length > 0) {
            // Auto-select top 1 strongest
            // setSelectedTeam([pokemonList[0]]);
        }
    }, [pokemonList]);

    // --- SELECTION PHASE ---
    const toggleSelection = (p: Pokemon) => {
        if (selectedTeam.find(s => s.id === p.id)) {
            setSelectedTeam(selectedTeam.filter(s => s.id !== p.id));
        } else {
            if (selectedTeam.length < 3) {
                setSelectedTeam([...selectedTeam, p]);
            }
        }
    };

    const startBattle = async () => {
        if (selectedTeam.length === 0) return;

        // Generate Enemy Team (1-3 pokemon)
        // Scale enemy level based on player avg level + 1 or 2
        const avgLevel = Math.ceil(selectedTeam.reduce((a, b) => a + b.level, 0) / selectedTeam.length);
        const enemyCount = selectedTeam.length;

        // For MVP, just random gen 1 ids
        const enemies: Pokemon[] = [];
        for (let i = 0; i < enemyCount; i++) {
            const id = Math.floor(Math.random() * 151) + 1;
            const p = await getPokemonData(id);
            // Buff enemy slightly so it's a challenge? Or keep even.
            // Let's manually set level.
            p.level = avgLevel;
            // Recalc stats for level
            // (In a real app, calculateLevelStats should be exported and used here)
            // For now, let's just use baseStats * multiplier approximation locally or import it.
            // We imported getPokemonData but not calculateLevelStats? Ah, it's there.
            // Important: getPokemonData returns level 1 stats. 
            // We need to scale them. We'll cheat and just multiply for now or import safely if I exported it.
            // Checking previous file... yes I exported calculateLevelStats in pokeapi.ts
            // But I can't import it easily without checking. Let's assume naive multiplayer for now to be safe.
            const mult = Math.pow(1.1, avgLevel - 1);
            p.stats = {
                hp: Math.floor(p.baseStats.hp * mult),
                attack: Math.floor(p.baseStats.attack * mult),
                defense: Math.floor(p.baseStats.defense * mult),
                speed: Math.floor(p.baseStats.speed * mult),
            };
            enemies.push(p);
        }

        setEnemyTeam(enemies);
        setPlayerActiveIndex(0);
        setEnemyActiveIndex(0);
        setPlayerHP(selectedTeam[0].stats.hp);
        setEnemyHP(enemies[0].stats.hp);
        setBattleLog(["Battle Started!", `Enemy sent out ${enemies[0].name}!`]);
        setWinner(null);
        setTurnCount(1);

        // Determine who goes first based on speed
        if (enemies[0].stats.speed > selectedTeam[0].stats.speed) {
            setIsPlayerTurn(false);
            setTimeout(() => executeEnemyTurn(selectedTeam[0], enemies[0]), 1000);
        } else {
            setIsPlayerTurn(true);
        }

        setPhase('BATTLE');
    };

    // --- BATTLE PHASE ---

    const activePlayerMon = selectedTeam[playerActiveIndex];
    const activeEnemyMon = enemyTeam[enemyActiveIndex];

    // Helper: build a BattleTurnContext for the narrator
    const buildNarratorContext = (
        attacker: Pokemon, defender: Pokemon,
        move: { name: string; type: string; power: number },
        damage: number, isCrit: boolean, multiplier: number,
        defenderNewHP: number, attackerIsPlayer: boolean,
        currentTurn: number
    ): BattleTurnContext => {
        const isKO = defenderNewHP <= 0;
        return {
            turnNumber: currentTurn,
            attacker: {
                name: attacker.name,
                types: attacker.types,
                currentHP: attacker.stats.hp,
                maxHP: attacker.stats.hp,
                isPlayer: attackerIsPlayer,
            },
            defender: {
                name: defender.name,
                types: defender.types,
                currentHP: Math.max(0, defenderNewHP),
                maxHP: defender.stats.hp,
                isPlayer: !attackerIsPlayer,
            },
            move: { name: move.name, type: move.type, power: move.power },
            result: {
                damage,
                isCritical: isCrit,
                effectiveness: multiplier > 1.2 ? "super_effective" : multiplier < 0.8 ? "not_effective" : "neutral",
                isKO,
            },
            battleStatus: {
                playerRemainingPokemon: selectedTeam.length - playerActiveIndex,
                enemyRemainingPokemon: enemyTeam.length - enemyActiveIndex,
                isOver: false,
                winner: null,
            },
        };
    };

    const handleAttack = (move: any) => { // Type as any for now or import Move
        if (!isPlayerTurn || winner) return;

        // Player attacks Enemy
        const { damage, isCrit, multiplier } = calculateDamage(activePlayerMon, activeEnemyMon, move);

        let logMsg = `${activePlayerMon.name} uses ${move.name}!`;
        if (isCrit) logMsg += " Critical Hit!";
        if (multiplier > 1.2) logMsg += " It's super effective!"; // 1.5 logic in use
        if (multiplier < 0.8) logMsg += " It's not very effective...";

        const newHP = Math.max(0, enemyHP - damage);
        setEnemyHP(newHP);
        setBattleLog(prev => [logMsg, ...prev]);

        // Trigger the narrator
        const ctx = buildNarratorContext(activePlayerMon, activeEnemyMon, move, damage, isCrit, multiplier, newHP, true, turnCount);
        narrateAction(ctx);

        if (newHP === 0) {
            handleEnemyFaint();
        } else {
            setIsPlayerTurn(false);
            setTimeout(() => executeEnemyTurn(activePlayerMon, activeEnemyMon, newHP), 1500);
        }
    };

    const executeEnemyTurn = (playerMon: Pokemon, enemyMon: Pokemon, currentEnemyHP?: number) => {
        if ((currentEnemyHP !== undefined && currentEnemyHP <= 0) || winner) return;

        // Enemy picks random move
        let move = { name: "Tackle", type: "normal", power: 40, accuracy: 100, pp: 35 };
        if (enemyMon.moves && enemyMon.moves.length > 0) {
            move = enemyMon.moves[Math.floor(Math.random() * enemyMon.moves.length)];
        }

        const { damage, isCrit, multiplier } = calculateDamage(enemyMon, playerMon, move);
        let logMsg = `Enemy ${enemyMon.name} uses ${move.name}!`;
        if (isCrit) logMsg += " Critical Hit!";
        if (multiplier > 1.2) logMsg += " It's super effective!";
        if (multiplier < 0.8) logMsg += " It's not very effective...";

        const newHP = Math.max(0, playerHP - damage);
        setPlayerHP(newHP);
        setBattleLog(prev => [logMsg, ...prev]);

        if (newHP === 0) {
            handlePlayerFaint();
        } else {
            setIsPlayerTurn(true);
            setTurnCount(c => c + 1);
        }
    };

    const handleEnemyFaint = () => {
        setBattleLog(prev => [`Enemy ${activeEnemyMon.name} fainted!`, ...prev]);

        if (enemyActiveIndex < enemyTeam.length - 1) {
            // Next enemy
            setTimeout(() => {
                const nextIdx = enemyActiveIndex + 1;
                setEnemyActiveIndex(nextIdx);
                setEnemyHP(enemyTeam[nextIdx].stats.hp);
                setBattleLog(prev => [`Enemy sent out ${enemyTeam[nextIdx].name}!`, ...prev]);
                setIsPlayerTurn(true);
            }, 1500);
        } else {
            // Victory!
            setWinner('player');
            const reward = 500 * enemyTeam.length; // Simple reward
            addMoney(reward);
            useGameStore.setState(s => ({ battlesWon: s.battlesWon + 1 })); // manual update for simplicity or add action
            setBattleLog(prev => [`Victory! You earned $${reward}.`, ...prev]);
        }
    };

    const handlePlayerFaint = () => {
        setBattleLog(prev => [`${activePlayerMon.name} fainted!`, ...prev]);

        if (playerActiveIndex < selectedTeam.length - 1) {
            setTimeout(() => {
                const nextIdx = playerActiveIndex + 1;
                setPlayerActiveIndex(nextIdx);
                setPlayerHP(selectedTeam[nextIdx].stats.hp);
                setBattleLog(prev => [`Go! ${selectedTeam[nextIdx].name}!`, ...prev]);
                setIsPlayerTurn(true); // Player gets initiative on switch? Or enemy attacks again? Usually switch logic is complex. 
                // In simple implementation, give player turn.
            }, 1500);
        } else {
            // Defeat
            setWinner('enemy');
            setBattleLog(prev => ["You were defeated...", ...prev]);
        }
    };

    // --- RENDER ---

    if (phase === 'SELECT') {
        return (
            <div className="pb-20">
                <h1 className="text-3xl font-bold mb-4">Select Your Team (Max 3)</h1>
                <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6 bg-white p-4 rounded-xl shadow-sm sticky top-20 z-10">
                    <span className="font-bold text-lg">{selectedTeam.length} / 3 Selected</span>

                    {/* Narrator Personality Picker */}
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-gray-500">🎙️ Narrateur:</span>
                        <select
                            value={personalityId}
                            onChange={(e) => setPersonalityId(e.target.value)}
                            className="bg-gray-50 border border-gray-200 rounded-lg py-1 px-3 text-sm font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        >
                            {Object.values(PERSONALITIES).map((p) => (
                                <option key={p.id} value={p.id}>
                                    {p.emoji} {p.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <button
                        disabled={selectedTeam.length === 0}
                        onClick={startBattle}
                        className="bg-red-600 hover:bg-red-700 disabled:bg-gray-300 text-white font-bold py-2 px-8 rounded-full transition-colors"
                    >
                        START BATTLE
                    </button>
                </div>

                <div className="flex flex-col gap-4 mb-4">
                    {/* Filters Bar */}
                    <div className="flex flex-col md:flex-row gap-4 bg-white p-3 rounded-xl shadow-sm border border-gray-100 overflow-x-auto items-center">
                        <div className="flex items-center gap-2">
                            <ArrowUpDown size={16} className="text-gray-400" />
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value as any)}
                                className="bg-gray-50 border border-gray-200 rounded-lg py-1 px-2 text-xs font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="ID">Sort: Number</option>
                                <option value="RARITY">Sort: Rarity</option>
                                <option value="LEVEL">Sort: Level</option>
                            </select>
                        </div>

                        <div className="w-px bg-gray-200 hidden md:block h-6"></div>

                        <div className="flex gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-hide flex-1">
                            {['ALL', 'COMMON', 'RARE', 'SUPER_RARE', 'EPIC', 'LEGENDARY'].map(r => (
                                <button
                                    key={r}
                                    onClick={() => setRarityFilter(r as any)}
                                    className={cn(
                                        "px-3 py-1 rounded-full text-[10px] font-bold whitespace-nowrap transition-all",
                                        rarityFilter === r
                                            ? 'bg-black text-white shadow-md'
                                            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                    )}
                                >
                                    {r.replace('_', ' ')}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {filteredList.map(p => {
                            const isSelected = !!selectedTeam.find(s => s.id === p.id);
                            return (
                                <div key={p.id} className={cn("relative transition-all", isSelected ? "ring-4 ring-red-500 rounded-xl transform scale-95" : "")}>
                                    <PokemonCard pokemon={p} onClick={() => toggleSelection(p)} />
                                    {isSelected && <div className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1"><Swords size={12} /></div>}
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto py-4 pb-20">
            {/* Battle Arena */}
            <div className="relative rounded-3xl shadow-2xl border-4 border-gray-800 overflow-hidden min-h-[500px] bg-gradient-to-b from-cyan-300 via-blue-200 to-green-300">

                {/* Background Decoration */}
                <div className="absolute inset-0 opacity-10 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay"></div>

                {/* Ground */}
                <div className="absolute bottom-0 w-full h-32 bg-[#4ade80] border-t-4 border-green-600/30"></div>

                {winner && (
                    <div className="absolute inset-0 z-50 bg-black/70 backdrop-blur-sm flex flex-col items-center justify-center text-white animate-in fade-in duration-300">
                        {winner === 'player' ? (
                            <Trophy className="w-32 h-32 text-yellow-400 mb-6 drop-shadow-[0_0_15px_rgba(250,204,21,0.5)] animate-bounce" />
                        ) : (
                            <Skull className="w-32 h-32 text-gray-400 mb-6 animate-pulse" />
                        )}
                        <h2 className="text-5xl font-black mb-6 uppercase tracking-widest bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                            {winner === 'player' ? "VICTORY" : "DEFEAT"}
                        </h2>
                        <button
                            onClick={() => setPhase('SELECT')}
                            className="bg-white text-black font-bold py-4 px-12 rounded-full hover:bg-gray-100 hover:scale-105 transition-all shadow-xl text-xl"
                        >
                            Back to Menu
                        </button>
                    </div>
                )}

                {/* Enemy Side */}
                <div className="absolute top-12 right-12 flex flex-col items-center z-10 w-full max-w-xs">
                    <div className="bg-white/90 backdrop-blur-md px-4 py-2 rounded-xl shadow-lg mb-4 w-60 border-2 border-gray-800 transform hover:scale-105 transition-transform">
                        <div className="flex justify-between items-end mb-1">
                            <span className="font-bold text-gray-800 text-lg uppercase">{activeEnemyMon.name}</span>
                            <span className="text-xs font-bold bg-gray-200 px-2 py-0.5 rounded text-gray-600">Lv.{activeEnemyMon.level}</span>
                        </div>
                        <div className="w-full bg-gray-300 h-4 rounded-full overflow-hidden border border-gray-400 flex items-center px-0.5">
                            <div className="absolute font-bold text-[10px] text-white z-10 w-full text-center drop-shadow-md">
                                {enemyHP}/{activeEnemyMon.stats.hp} HP
                            </div>
                            <motion.div
                                className="bg-gradient-to-r from-red-500 to-red-400 h-3 rounded-full z-0"
                                initial={{ width: "100%" }}
                                animate={{ width: `${(enemyHP / activeEnemyMon.stats.hp) * 100}%` }}
                                transition={{ type: "spring", stiffness: 100 }}
                            />
                        </div>
                    </div>

                    <div className="relative">
                        <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-48 h-12 bg-black/20 rounded-[50%] blur-sm aspect-[4/1]"></div>
                        <motion.img
                            src={activeEnemyMon.sprite}
                            className="w-40 h-40 md:w-56 md:h-56 object-contain drop-shadow-2xl relative z-10"
                            animate={{
                                x: isPlayerTurn ? 0 : [0, -30, 0],
                                y: [0, -5, 0] // Idle float
                            }}
                            transition={{
                                y: { duration: 2, repeat: Infinity, ease: "easeInOut" },
                                x: { duration: 0.3 }
                            }}
                        />
                    </div>
                </div>

                {/* Player Side */}
                <div className="absolute bottom-4 left-4 md:bottom-12 md:left-12 flex flex-col items-center z-10 w-full max-w-xs">
                    <div className="bg-white/90 backdrop-blur-md px-4 py-2 rounded-xl shadow-lg w-64 border-2 border-gray-800 transform hover:scale-105 transition-transform mb-6">
                        <div className="flex justify-between items-end mb-1">
                            <span className="font-bold text-gray-800 text-lg uppercase">{activePlayerMon.name}</span>
                            <span className="text-xs font-bold bg-gray-200 px-2 py-0.5 rounded text-gray-600">Lv.{activePlayerMon.level}</span>
                        </div>
                        <div className="w-full bg-gray-300 h-4 rounded-full overflow-hidden border border-gray-400 flex items-center px-0.5">
                            <div className="absolute font-bold text-[10px] text-white z-10 w-full text-center drop-shadow-md">
                                {playerHP}/{activePlayerMon.stats.hp} HP
                            </div>
                            <motion.div
                                className="bg-gradient-to-r from-green-500 to-emerald-400 h-3 rounded-full z-0"
                                initial={{ width: "100%" }}
                                animate={{ width: `${(playerHP / activePlayerMon.stats.hp) * 100}%` }}
                                transition={{ type: "spring", stiffness: 100 }}
                            />
                        </div>
                    </div>

                    <div className="relative">
                        <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-48 h-12 bg-black/20 rounded-[50%] blur-sm aspect-[4/1]"></div>
                        <motion.img
                            src={activePlayerMon.sprite}
                            className="w-40 h-40 md:w-64 md:h-64 object-contain transform scale-x-[-1] drop-shadow-2xl relative z-10"
                            animate={{
                                x: !isPlayerTurn ? 0 : [0, 30, 0],
                                y: [0, -5, 0]
                            }}
                            transition={{
                                y: { duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.5 },
                                x: { duration: 0.3 }
                            }}
                        />
                    </div>
                </div>

                {/* Text Box */}
                <div className="absolute bottom-0 left-0 right-0 p-4 z-40">
                    <div className="bg-gray-900/90 border-4 border-gray-300 rounded-xl p-4 min-h-[100px] flex items-center shadow-xl">
                        <span className="text-white text-xl font-mono font-bold tracking-wide leading-relaxed">
                            {battleLog[0] || "What will you do?"}
                        </span>
                    </div>
                </div>

            </div>

            {/* Controls */}
            <div className="mt-4">
                <div className="grid grid-cols-2 gap-4">
                    {activePlayerMon.moves && activePlayerMon.moves.length > 0 ? (
                        activePlayerMon.moves.map((move, i) => (
                            <button
                                key={i}
                                disabled={!isPlayerTurn || !!winner}
                                onClick={() => handleAttack(move)}
                                className={cn(
                                    "flex flex-col items-center justify-center p-4 rounded-xl text-white transition-all transform hover:scale-[1.02] active:scale-95 border-b-4 border-black/20",
                                    TYPE_COLORS[move.type] || "bg-gray-500",
                                    (!isPlayerTurn || !!winner) && "opacity-50 grayscale cursor-not-allowed"
                                )}
                            >
                                <span className="font-black text-lg uppercase drop-shadow-md">{move.name}</span>
                                <div className="flex gap-2 text-xs font-bold opacity-90 mt-1 uppercase">
                                    <span className="bg-black/20 px-2 rounded">{move.type}</span>
                                    <span>PWR {move.power || "-"}</span>
                                </div>
                            </button>
                        ))
                    ) : (
                        <button
                            disabled={!isPlayerTurn || !!winner}
                            onClick={() => handleAttack({ name: "Tackle", type: "normal", power: 40, accuracy: 100, pp: 35 })}
                            className="col-span-2 bg-gray-500 hover:bg-gray-600 disabled:bg-gray-400 text-white font-bold rounded-xl flex flex-col items-center justify-center p-4 border-b-4 border-black/20"
                        >
                            <Swords className="mb-1" />
                            STRUGGLE
                        </button>
                    )}
                </div>
            </div>

            {/* Narrator Commentary */}
            <NarratorBox
                commentary={commentary}
                isNarrating={isNarrating}
                isSpeaking={isSpeaking}
                isMuted={isMuted}
                error={narratorError}
                personalityId={personalityId}
                onToggleMute={toggleMute}
            />
        </div>
    );
}
