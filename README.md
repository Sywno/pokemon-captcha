# 🎮 Pokémon Pack & Battle

Un jeu web Pokémon original combinant l'ouverture de packs, la collection, et les combats stratégiques au tour par tour. Construit avec Next.js, React et la [PokéAPI](https://pokeapi.co/).

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4-06B6D4?logo=tailwindcss)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)

---

## ✨ Fonctionnalités

### 📦 Système de Packs
- Plusieurs types de packs avec différentes raretés (Common, Rare, Super Rare, Epic, Legendary)
- Animation d'ouverture immersive avec effets visuels
- Système de monnaie intégré pour l'achat de packs

### 📖 Pokédex & Collection
- Vue complète des 151 Pokémon de la 1ère génération
- Filtrage par rareté et tri (numéro, rareté, niveau)
- Mode "Show Missing" pour voir les Pokémon non collectés
- Fiche détaillée de chaque Pokémon avec stats et attaques

### ⚔️ Combats au Tour par Tour
- Sélection d'équipe (jusqu'à 3 Pokémon)
- Système de combat avec types, coups critiques et efficacité
- Ennemis générés dynamiquement adaptés à votre niveau
- Arena de combat animée avec barres de vie et log de combat
- Récompenses en monnaie après chaque victoire

### 📈 Système de Progression
- **Leveling par duplication** : les doublons augmentent le niveau de vos Pokémon (formule log₂)
- Les stats évoluent avec le niveau
- Économie de jeu équilibrée entre packs et combats

---

## 🛠️ Stack Technique

| Technologie | Rôle |
|---|---|
| **Next.js 16** | Framework React avec App Router |
| **React 19** | UI réactive et composants |
| **TailwindCSS 4** | Styling utilitaire |
| **Zustand** | State management (persisté en localStorage) |
| **Framer Motion** | Animations fluides (combats, ouverture de packs) |
| **Lucide React** | Icônes |
| **PokéAPI** | Données Pokémon (sprites, stats, attaques, types) |
| **TypeScript** | Typage statique |

---

## 📁 Structure du Projet

```
pokemon/
├── src/
│   ├── app/
│   │   ├── page.tsx          # Pokédex / Collection
│   │   ├── shop/page.tsx     # Boutique de packs
│   │   ├── battle/page.tsx   # Arène de combat
│   │   ├── layout.tsx        # Layout principal avec navbar
│   │   └── globals.css       # Styles globaux
│   ├── components/
│   │   ├── game/
│   │   │   ├── PokemonCard.tsx         # Carte Pokémon
│   │   │   ├── PokemonDetailModal.tsx  # Modal détail Pokémon
│   │   │   ├── PokemonPlaceholder.tsx  # Placeholder (non collecté)
│   │   │   └── PackCard.tsx            # Carte de pack en boutique
│   │   └── layout/                     # Composants layout (navbar)
│   ├── lib/
│   │   ├── store.ts          # State Zustand (inventaire, argent, progression)
│   │   ├── pokeapi.ts        # Client PokéAPI
│   │   ├── packs.ts          # Logique d'ouverture de packs
│   │   ├── battle.ts         # Calculs de combat (dégâts, critiques, types)
│   │   ├── constants.ts      # Constantes (couleurs des types, etc.)
│   │   └── utils.ts          # Utilitaires
│   └── types/
│       └── index.ts          # Types TypeScript (Pokemon, Rarity, etc.)
├── public/                   # Assets statiques
├── package.json
├── tsconfig.json
└── next.config.ts
```

---

## 🚀 Installation & Lancement

### Prérequis
- [Node.js](https://nodejs.org/) (v18+)
- npm ou yarn

### Installation

```bash
# Cloner le repo
git clone https://github.com/<ton-username>/pokemon.git
cd pokemon

# Installer les dépendances
npm install

# Lancer en mode développement
npm run dev
```

L'application sera accessible sur [http://localhost:3000](http://localhost:3000).

### Build de production

```bash
npm run build
npm start
```

---

## 🎮 Comment Jouer

1. **Ouvre des packs** dans la boutique pour obtenir tes premiers Pokémon
2. **Consulte ta collection** dans le Pokédex et découvre les stats de chaque Pokémon
3. **Lance des combats** en sélectionnant jusqu'à 3 Pokémon de ton équipe
4. **Gagne de l'argent** en remportant des combats pour acheter plus de packs
5. **Collectionne des doublons** pour faire monter le niveau de tes Pokémon !

---

## 📝 Licence

Ce projet est un fan-game à but éducatif. Pokémon est une marque déposée de Nintendo / Game Freak / The Pokémon Company. Toutes les données proviennent de la [PokéAPI](https://pokeapi.co/).

---

Développé avec ❤️ et Next.js
