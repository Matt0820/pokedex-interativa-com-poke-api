"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Contrast,
  MapPin,
  Moon,
  Package,
  Search,
  SlidersHorizontal,
  Sparkles,
  Sun,
  Target,
} from "lucide-react";
import {
  translateDescription,
  translateDescriptionToPortuguese,
  translateMoveMethod,
  translatePokeName,
} from "@/lib/pokeapi-translations";

type PokemonSummary = { name: string; url: string };
type ThemeMode = "light" | "dark" | "contrast";

const GENERATION_RANGES = [
  [1, 151],
  [152, 251],
  [252, 386],
  [387, 493],
  [494, 649],
  [650, 721],
  [722, 809],
  [810, 905],
  [906, 1025],
];
function pokemonId(item: PokemonSummary) {
  return Number(item.url.split("/").filter(Boolean).pop());
}
function generationForId(id: number) {
  return (
    GENERATION_RANGES.findIndex(([start, end]) => id >= start && id <= end) + 1
  );
}
type Pokemon = {
  id: number;
  name: string;
  height: number;
  weight: number;
  types: { type: { name: string } }[];
  sprites: {
    front_default: string | null;
    front_shiny?: string | null;
    other?: {
      "official-artwork"?: {
        front_default: string | null;
        front_shiny?: string | null;
      };
    };
  };
  location_area_encounters?: string;
  stats: { base_stat: number; stat: { name: string } }[];
  abilities: { ability: { name: string }; is_hidden: boolean }[];
  held_items: { item: { name: string } }[];
  moves: {
    move: { name: string };
    version_group_details: {
      move_learn_method: { name: string };
      level_learned_at: number;
    }[];
  }[];
  species?: { url: string };
};
type PokemonVariety = { name: string; url: string; informational?: boolean };
type SpeciesInfo = {
  capture_rate: number;
  evolution_chain?: { url: string };
  flavor_text_entries: {
    flavor_text: string;
    language: { name: string };
    version: { name: string };
  }[];
};
type EncounterLocation = {
  location_area: { name: string };
  version_details: { version: { name: string } }[];
};
type EvolutionDetail = {
  trigger: { name: string };
  item?: { name: string } | null;
  min_level?: number | null;
  min_happiness?: number | null;
  time_of_day?: string;
  known_move?: { name: string } | null;
  location?: { name: string } | null;
};
type EvolutionNode = {
  species: { name: string };
  evolution_details: EvolutionDetail[];
  evolves_to: EvolutionNode[];
};

const TYPE_LABELS: Record<string, string> = {
  normal: "Normal",
  fire: "Fogo",
  water: "Água",
  electric: "Elétrico",
  grass: "Planta",
  ice: "Gelo",
  fighting: "Lutador",
  poison: "Veneno",
  ground: "Terrestre",
  flying: "Voador",
  psychic: "Psíquico",
  bug: "Inseto",
  rock: "Pedra",
  ghost: "Fantasma",
  dragon: "Dragão",
  dark: "Sombrio",
  steel: "Aço",
  fairy: "Fada",
};
const TYPE_COLORS: Record<string, string> = {
  normal: "bg-stone-400",
  fire: "bg-orange-500",
  water: "bg-blue-500",
  electric: "bg-yellow-400",
  grass: "bg-emerald-500",
  ice: "bg-cyan-400",
  fighting: "bg-red-700",
  poison: "bg-purple-500",
  ground: "bg-amber-600",
  flying: "bg-indigo-400",
  psychic: "bg-pink-500",
  bug: "bg-lime-600",
  rock: "bg-stone-600",
  ghost: "bg-violet-700",
  dragon: "bg-indigo-700",
  dark: "bg-slate-700",
  steel: "bg-slate-500",
  fairy: "bg-pink-300",
};
const TYPE_IDS: Record<string, number> = {
  normal: 1,
  fighting: 2,
  flying: 3,
  poison: 4,
  ground: 5,
  rock: 6,
  bug: 7,
  ghost: 8,
  steel: 9,
  fire: 10,
  water: 11,
  grass: 12,
  electric: 13,
  psychic: 14,
  ice: 15,
  dragon: 16,
  dark: 17,
  fairy: 18,
};
const generations = [
  "Todas as gerações",
  "Geração I",
  "Geração II",
  "Geração III",
  "Geração IV",
  "Geração V",
  "Geração VI",
  "Geração VII",
  "Geração VIII",
  "Geração IX",
];

function formatName(name: string) {
  return translatePokeName(name);
}
function padId(id: number) {
  return `#${String(id).padStart(3, "0")}`;
}
function TypePill({ name }: { name: string }) {
  return (
    <span
      title={TYPE_LABELS[name] || formatName(name)}
      aria-label={`Tipo ${TYPE_LABELS[name] || formatName(name)}`}
      className="inline-flex h-7 w-20 items-center justify-center"
    >
      {TYPE_IDS[name] && <img src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/types/generation-viii/sword-shield/${TYPE_IDS[name]}.png`} alt={TYPE_LABELS[name] || formatName(name)} className="h-7 w-20 object-contain" />}
    </span>
  );
}
function artUrl(pokemon: Pokemon) {
  return (
    pokemon.sprites.front_default ||
    pokemon.sprites.other?.["official-artwork"]?.front_default ||
    ""
  );
}
function shinyArtUrl(pokemon: Pokemon) {
  return (
    pokemon.sprites.front_shiny ||
    pokemon.sprites.other?.["official-artwork"]?.front_shiny ||
    ""
  );
}
function formatLocation(name: string) {
  return name
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
const EVOLUTION_ITEM_LABELS: Record<string, string> = {
  "fire-stone": "Pedra do Fogo",
  "water-stone": "Pedra da Água",
  "thunder-stone": "Pedra do Trovão",
  "leaf-stone": "Pedra da Folha",
  "ice-stone": "Pedra do Gelo",
  "moon-stone": "Pedra da Lua",
  "sun-stone": "Pedra do Sol",
  "shiny-stone": "Pedra do Brilho",
  "dawn-stone": "Pedra do Amanhecer",
  "dusk-stone": "Pedra do Crepúsculo",
  "oval-stone": "Pedra Oval",
  "linking-cord": "Corda de Ligação",
};
function evolutionMethod(detail: EvolutionDetail) {
  if (detail.trigger.name === "trade") return "Troca";
  if (detail.item)
    return `Use ${EVOLUTION_ITEM_LABELS[detail.item.name] || formatName(detail.item.name)}`;
  if (detail.trigger.name === "level-up") {
    if (detail.min_happiness)
      return `Suba de nível com felicidade ${detail.min_happiness}`;
    if (detail.time_of_day)
      return `Suba de nível durante ${detail.time_of_day === "day" ? "o dia" : "a noite"}`;
    if (detail.known_move)
      return `Suba de nível sabendo ${formatName(detail.known_move.name)}`;
    if (detail.location)
      return `Suba de nível em ${formatLocation(detail.location.name)}`;
    return detail.min_level ? `Nível ${detail.min_level}` : "Suba de nível";
  }
  return formatName(detail.trigger.name);
}
function evolutionEdges(
  node: EvolutionNode,
  target: string,
): { from: string; to: string; method: string }[] {
  const nextNodes = node.evolves_to || [];
  const edges = nextNodes.flatMap((next) =>
    (next.evolution_details || []).map((detail) => ({
      from: node.species.name,
      to: next.species.name,
      method: evolutionMethod(detail),
    })),
  );
  return edges.concat(
    nextNodes.flatMap((next) => evolutionEdges(next, target)),
  );
}
function fallbackList() {
  return Array.from({ length: 1025 }, (_, index) => ({
    name: `pokemon-${index + 1}`,
    url: `https://pokeapi.co/api/v2/pokemon/${index + 1}/`,
  }));
}
async function fetchWithTimeout(url: string, timeout = 12000) {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeout);
  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    window.clearTimeout(timer);
  }
}
const ZYGARDE_FORMS = new Set(["zygarde-10", "zygarde-50", "zygarde-complete"]);
const ZYGARDE_INFORMATIONAL_FORMS: PokemonVariety[] = [
  { name: "zygarde-1-percent", url: "", informational: true },
  { name: "zygarde-cell", url: "", informational: true },
];
function uniquePokedexEntries(entries: PokemonSummary[]) {
  const seen = new Set<string>();
  return entries.filter((entry) => {
    const key = entry.name.startsWith("zygarde-")
      ? entry.name
      : String(pokemonId(entry));
    if (entry.name.startsWith("zygarde-") && !ZYGARDE_FORMS.has(entry.name))
      return false;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export default function Pokedex() {
  const [list, setList] = useState<PokemonSummary[]>([]);
  const [selected, setSelected] = useState<Pokemon | null>(null);
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("Todos os tipos");
  const [generation, setGeneration] = useState("Todas as gerações");
  const [tab, setTab] = useState<
    | "overview"
    | "moves"
    | "tms"
    | "description"
    | "abilities"
    | "items"
    | "locations"
    | "shiny"
    | "balls"
    | "capture"
  >("overview");
  const [loadingList, setLoadingList] = useState(true);
  const [loadingPokemon, setLoadingPokemon] = useState(false);
  const [typeNames, setTypeNames] = useState<Set<string> | null>(null);
  const [varieties, setVarieties] = useState<PokemonVariety[]>([]);
  const [speciesInfo, setSpeciesInfo] = useState<SpeciesInfo | null>(null);
  const [evolutionChain, setEvolutionChain] = useState<EvolutionNode | null>(
    null,
  );
  const [description, setDescription] = useState("");
  const [locations, setLocations] = useState<EncounterLocation[]>([]);
  const [loadingVarieties, setLoadingVarieties] = useState(false);
  const requestId = useRef(0);
  const [theme, setTheme] = useState<ThemeMode>(() => {
    if (typeof window === "undefined") return "light";
    const savedTheme = window.localStorage.getItem("pokedex-theme") as ThemeMode | null;
    return savedTheme && ["light", "dark", "contrast"].includes(savedTheme) ? savedTheme : "light";
  });

  useEffect(() => {
    window.localStorage.setItem("pokedex-theme", theme);
  }, [theme]);

  const themeInfo = {
    light: { label: "Modo claro", next: "Modo escuro", Icon: Sun },
    dark: { label: "Modo escuro", next: "Alto contraste", Icon: Moon },
    contrast: { label: "Alto contraste", next: "Modo claro", Icon: Contrast },
  }[theme];
  const ThemeIcon = themeInfo.Icon;
  const cycleTheme = () => setTheme(theme === "light" ? "dark" : theme === "dark" ? "contrast" : "light");

  useEffect(() => {
    fetchWithTimeout("https://pokeapi.co/api/v2/pokemon?limit=2000")
      .then((r) => {
        if (!r.ok) throw new Error("Falha ao carregar a Pokédex");
        return r.json();
      })
      .then((data) => {
        setList(
          uniquePokedexEntries(
            data.results.filter(
              (item: PokemonSummary) =>
                pokemonId(item) <= 1025 || item.name.startsWith("zygarde-"),
            ),
          ),
        );
        setLoadingList(false);
      })
      .catch(() => {
        setList(fallbackList());
        setLoadingList(false);
      });
  }, []);
  useEffect(() => {
    if (typeFilter === "Todos os tipos") {
      setTypeNames(null);
      return;
    }
    const type = Object.entries(TYPE_LABELS).find(
      ([, label]) => label === typeFilter,
    )?.[0];
    if (!type) return;
    fetch(`https://pokeapi.co/api/v2/type/${type}`)
      .then((r) => r.json())
      .then((data) =>
        setTypeNames(
          new Set(
            data.pokemon.map(
              (entry: { pokemon: PokemonSummary }) => entry.pokemon.name,
            ),
          ),
        ),
      )
      .catch(() => setTypeNames(new Set()));
  }, [typeFilter]);
  useEffect(() => {
    if (!list.length) return;
    const first = list.find((item) => item.name === "bulbasaur") || list[0];
    loadPokemon(first.url);
  }, [list]);
  useEffect(() => {
    if (!selected?.location_area_encounters) {
      setLocations([]);
      return;
    }
    fetchWithTimeout(selected.location_area_encounters)
      .then((response) => (response.ok ? response.json() : []))
      .then((data: EncounterLocation[]) => setLocations(data))
      .catch(() => setLocations([]));
  }, [selected]);

  async function loadPokemon(url: string) {
    const currentRequest = ++requestId.current;
    setLoadingPokemon(true);
    setLoadingVarieties(true);
    setDescription("");
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error("Falha ao carregar o Pokémon");
      const data = await response.json();
      if (currentRequest !== requestId.current) return;
      setSelected(data);
      setTab("overview");
      const speciesResponse = await fetch(
        data.species?.url ||
          `https://pokeapi.co/api/v2/pokemon-species/${data.id}`,
      );
      if (!speciesResponse.ok) throw new Error("Falha ao carregar a espécie");
      const species = await speciesResponse.json();
      if (currentRequest !== requestId.current) return;
      const originalDescription = translateDescription(
        species.flavor_text_entries,
      );
      setDescription(originalDescription);
      translateDescriptionToPortuguese(originalDescription).then(
        setDescription,
      );
      setSpeciesInfo(species);
      if (species.evolution_chain?.url) {
        const evolutionResponse = await fetchWithTimeout(
          species.evolution_chain.url,
        );
          const evolutionData = evolutionResponse.ok ? await evolutionResponse.json() : null;
          setEvolutionChain(evolutionData?.chain || evolutionData);
      } else {
        setEvolutionChain(null);
      }
      const nextVarieties = (species.varieties || [])
        .map((entry: { pokemon: PokemonVariety }) => entry.pokemon)
        .filter((entry: PokemonVariety) => entry.name !== data.name);
      setVarieties(
        data.name.startsWith("zygarde-")
          ? [...nextVarieties, ...ZYGARDE_INFORMATIONAL_FORMS]
          : nextVarieties,
      );
    } catch {
      if (currentRequest !== requestId.current) return;
      setSelected(null);
      setSpeciesInfo(null);
      setEvolutionChain(null);
      setDescription("");
      setVarieties([]);
    } finally {
      if (currentRequest === requestId.current) {
        setLoadingPokemon(false);
        setLoadingVarieties(false);
      }
    }
  }

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const generationNumber = generations.indexOf(generation);
    return list.filter((item) => {
      const id = pokemonId(item);
      const matchesQuery =
        item.name.includes(normalizedQuery) ||
        formatName(item.name).toLowerCase().includes(normalizedQuery) ||
        String(id) === normalizedQuery;
      const matchesType = !typeNames || typeNames.has(item.name);
      const matchesGeneration =
        generationNumber <= 0 || generationForId(id) === generationNumber;
      return matchesQuery && matchesType && matchesGeneration;
    });
  }, [list, query, typeNames, generation]);
  const selectedIndex = selected
    ? list.findIndex((item) => item.name === selected.name)
    : -1;
  const moves =
    selected?.moves.filter((move) =>
      move.version_group_details.some(
        (detail) => detail.move_learn_method.name === "level-up",
      ),
    ) || [];
  const tms =
    selected?.moves.filter((move) =>
      move.version_group_details.some((detail) =>
        ["machine", "tutor"].includes(detail.move_learn_method.name),
      ),
    ) || [];
  const ballEstimates = [
    { name: "Poké Bola", modifier: 1, color: "bg-red-500" },
    { name: "Super Bola", modifier: 1.5, color: "bg-blue-500" },
    { name: "Ultra Bola", modifier: 2, color: "bg-yellow-400" },
  ];
  const captureRate = speciesInfo?.capture_rate || 0;
  const locationGroups = locations.reduce<Record<string, string[]>>(
    (groups, location) => {
      const name = formatLocation(location.location_area.name);
      const versions = location.version_details.map((detail) =>
        formatName(detail.version.name),
      );
      groups[name] = Array.from(
        new Set([...(groups[name] || []), ...versions]),
      );
      return groups;
    },
    {},
  );
  const evolutionMethods = evolutionChain
    ? evolutionEdges(evolutionChain, selected?.name || "").filter(
        (edge) => edge.from === selected?.name,
      )
    : [];
  const evolutionItems = Array.from(
    new Set(
      evolutionMethods
        .map((edge) => edge.method.match(/^Use (.+)$/)?.[1])
        .filter((item): item is string => Boolean(item)),
    ),
  );
  const extraEeveeStones =
    selected?.name === "eevee"
      ? [
          "Pedra do Fogo",
          "Pedra da Água",
          "Pedra do Trovão",
          "Pedra da Folha",
          "Pedra do Gelo",
        ]
      : [];
  const allEvolutionItems = Array.from(
    new Set([...evolutionItems, ...extraEeveeStones]),
  );
  const formLabel = (name: string) =>
    name === "zygarde-1-percent"
      ? "Zygarde 1%"
      : name === "zygarde-cell"
        ? "Zygarde Cell"
        : name.includes("zygarde-10")
      ? "Zygarde 10%"
      : name.includes("zygarde-50")
        ? "Zygarde 50%"
        : name.includes("zygarde-complete")
          ? "Zygarde 100%"
          : name.includes("gmax") || name.includes("gigantamax")
            ? "Gigantamax"
            : name.includes("mega")
              ? "Mega"
              : "Forma alternativa";

  return (
    <main className={`rotom-app theme-${theme} min-h-screen bg-[#f5f7fb] text-slate-900`}>
      <header className="border-b border-slate-200/80 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between px-5 py-4 lg:px-10">
          <div className="flex items-center gap-3">
            <div className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-[#18233f] shadow-lg shadow-indigo-950/20">
              <div className="h-5 w-5 rounded-full border-[3px] border-white bg-[#f7c948]" />
              <div className="absolute inset-x-0 top-1/2 h-[3px] bg-white" />
            </div>
            <div>
              <div className="text-lg font-black tracking-tight text-[#192441]">
                POKÉDEX
              </div>
              <div className="text-[9px] font-bold uppercase tracking-[.26em] text-slate-400">
                Guia de treinamento
              </div>
            </div>
          </div>
          <div className="hidden items-center gap-8 text-sm font-semibold text-slate-500 md:flex">
            <span className="text-[#f1b92b]">Explorar</span>
            <span>Tipos</span>
            <span>Regiões</span>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={cycleTheme} aria-label={`Ativar ${themeInfo.next}`} title={`Ativar ${themeInfo.next}`} className="theme-toggle">
              <ThemeIcon className="h-4 w-4" />
              <span>{themeInfo.label}</span>
            </button>
            <button className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-600 shadow-sm hover:bg-slate-50">
              Sobre a Pokédex
            </button>
          </div>
        </div>
      </header>
      <section className="relative overflow-hidden bg-[#17223e] px-5 pb-16 pt-14 text-white lg:px-10 lg:pb-20">
        <div className="absolute -right-24 -top-32 h-96 w-96 rounded-full border-[42px] border-white/5" />
        <div className="absolute bottom-[-100px] left-[38%] h-72 w-72 rounded-full border-[30px] border-[#f5c84b]/10" />
        <div className="relative mx-auto max-w-[1440px]">
          <p className="mb-3 text-xs font-bold uppercase tracking-[.3em] text-[#f5c84b]">
            Banco de dados do treinador
          </p>
          <h1 className="max-w-2xl text-4xl font-black leading-tight tracking-tight md:text-6xl">
            Conheça todos os Pokémon.
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-6 text-slate-300 md:text-base">
            Explore habilidades, tipos, movimentos e muito mais em um só lugar.
          </p>
          <div className="mt-8 flex max-w-2xl items-center gap-3 rounded-xl bg-white p-2 shadow-2xl shadow-black/20">
            <Search className="ml-3 h-5 w-5 text-slate-400" />
            <input
              aria-label="Buscar Pokémon"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Busque por nome ou número..."
              className="min-w-0 flex-1 bg-transparent px-1 py-3 text-sm font-medium text-slate-800 outline-none placeholder:text-slate-400"
            />
            <kbd className="hidden rounded bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-400 sm:block">
              ⌘ K
            </kbd>
            <button className="rounded-lg bg-[#f4c542] px-4 py-3 text-sm font-black text-[#1b2644] hover:bg-[#ffd85c]">
              Buscar
            </button>
          </div>
        </div>
      </section>
      <div className="mx-auto grid max-w-[1440px] gap-8 px-5 py-8 lg:grid-cols-[420px_1fr] lg:px-10">
        <aside>
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black text-[#192441]">Pokémon</h2>
              <p className="mt-1 text-xs text-slate-400">
                {filtered.length || 0} resultados encontrados
              </p>
            </div>
            <button className="rounded-lg border border-slate-200 bg-white p-2.5 text-slate-500">
              <SlidersHorizontal className="h-4 w-4" />
            </button>
          </div>
          <div className="mb-5 grid grid-cols-2 gap-2">
            <label className="relative">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full appearance-none rounded-lg border border-slate-200 bg-white px-3 py-3 text-xs font-semibold text-slate-500 outline-none"
              >
                <option>Todos os tipos</option>
                {Object.values(TYPE_LABELS).map((label) => (
                  <option key={label}>{label}</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-3.5 h-3.5 text-slate-400" />
            </label>
            <label className="relative">
              <select
                value={generation}
                onChange={(e) => setGeneration(e.target.value)}
                className="w-full appearance-none rounded-lg border border-slate-200 bg-white px-3 py-3 text-xs font-semibold text-slate-500 outline-none"
              >
                {generations.map((g) => (
                  <option key={g}>{g}</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-3.5 h-3.5 text-slate-400" />
            </label>
          </div>
          <div className="dex-card-grid lg:max-h-[610px] lg:overflow-y-auto lg:pr-2">
            {loadingList ? (
              <div className="rounded-xl bg-white p-5 text-sm text-slate-400">
                Carregando Pokédex...
              </div>
            ) : (
              filtered.map((item) => (
                <button
                  key={item.name}
                  onClick={() => loadPokemon(item.url)}
                  data-selected={selected?.name === item.name || undefined}
                  className={`dex-pokemon-card flex w-full items-center gap-3 rounded-xl border p-3 text-left transition ${selected?.name === item.name ? "border-[#f1c243] bg-[#fff9e8] shadow-sm" : "border-transparent bg-white hover:border-slate-200"}`}
                >
                  <span className="w-8 text-xs font-bold text-slate-400">
                    {padId(pokemonId(item))}
                  </span>
                  <img
                    src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemonId(item)}.png`}
                    alt=""
                    className="h-12 w-12 object-contain"
                  />
                  <span className="flex-1 text-sm font-black text-[#24304e]">
                    {formatName(item.name)}
                  </span>
                  <ChevronRight className="h-4 w-4 text-slate-300" />
                </button>
              ))
            )}
          </div>
        </aside>
        <section className="min-w-0">
          {selected && (
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              {(varieties.length > 0 || loadingVarieties) && (
                <div className="border-b border-slate-100 bg-white px-6 py-5 md:px-10">
                  <div className="mb-3 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[.2em] text-[#f1b92b]">
                        Formas especiais
                      </p>
                      <h3 className="mt-1 text-lg font-black text-[#192441]">
                        Todas as formas alternativas
                      </h3>
                    </div>
                    {loadingVarieties && (
                      <span className="text-xs font-semibold text-slate-400">
                        Consultando PokéAPI...
                      </span>
                    )}
                  </div>
                  <div className="flex gap-3 overflow-x-auto pb-1">
                    {varieties.map((variant) => (
                      <button
                        key={variant.name}
                        type="button"
                        disabled={variant.informational}
                        onClick={() => variant.url && loadPokemon(variant.url)}
                        className={`flex min-w-[148px] items-center gap-3 rounded-xl border border-slate-200 bg-[#f8f9fd] p-2 text-left transition ${variant.informational ? "cursor-default opacity-80" : "hover:border-[#f1c243] hover:bg-[#fff9e8]"}`}
                      >
                        {variant.url ? <img src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${variant.url.split("/").filter(Boolean).pop()}.png`} alt="" className="h-12 w-12 object-contain" /> : <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#18233f] text-lg font-black text-[#f4c542]">Z</span>}
                        <span>
                          <strong className="block text-xs font-black text-[#24304e]">
                            {formLabel(variant.name)}
                          </strong>
                          <span className="mt-1 block text-[10px] font-semibold text-slate-400">
                            {formatName(variant.name)}
                          </span>
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div className="grid gap-6 bg-gradient-to-br from-[#eef2ff] to-[#fffaf0] p-6 md:grid-cols-[minmax(240px,340px)_1fr] md:p-10">
                <div className="relative flex min-h-[240px] items-center justify-center rounded-2xl bg-[#e4e9fa] before:absolute before:bottom-4 before:h-6 before:w-48 before:rounded-[50%] before:bg-[#9aa8cf]/20">
                  <div className="absolute left-5 top-5 text-5xl font-black text-[#cbd3ef]">{padId(selected.id)}</div>
                  {loadingPokemon ? <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#f1c243] border-t-transparent" /> : <img src={artUrl(selected)} alt={formatName(selected.name)} className="live-dex-sprite relative z-10 h-56 w-56 object-contain" />}
                </div>
                <div className="flex flex-col justify-center">
                  <div className="mb-3 flex items-center gap-2">
                    <span className="rounded-md bg-[#18233f] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
                      #{selected.id}
                    </span>
                    {selected.types.map(({ type }) => (
                      <TypePill key={type.name} name={type.name} />
                    ))}
                  </div>
                  <h2 className="text-4xl font-black tracking-tight text-[#192441] md:text-5xl">
                    {formatName(selected.name)}
                  </h2>
                  <p className="mt-3 max-w-lg text-sm leading-6 text-slate-500">
                    Dados oficiais da PokéAPI, incluindo informações de batalha
                    e aprendizado de movimentos.
                  </p>
                  <div className="mt-7 grid max-w-md grid-cols-2 gap-3">
                    <div className="rounded-xl border border-white bg-white/70 p-3">
                      <span className="block text-[10px] font-bold uppercase tracking-widest text-slate-400">
                        Altura
                      </span>
                      <strong className="mt-1 block text-lg text-[#24304e]">
                        {(selected.height / 10).toFixed(1)} m
                      </strong>
                    </div>
                    <div className="rounded-xl border border-white bg-white/70 p-3">
                      <span className="block text-[10px] font-bold uppercase tracking-widest text-slate-400">
                        Peso
                      </span>
                      <strong className="mt-1 block text-lg text-[#24304e]">
                        {(selected.weight / 10).toFixed(1)} kg
                      </strong>
                    </div>
                  </div>
                </div>
              </div>
              <div className="legacy-tabs border-b border-slate-100 px-6 md:px-10">
                <div className="flex gap-6 overflow-auto">
                  <button
                    onClick={() => setTab("overview")}
                    className={`border-b-2 py-4 text-sm font-bold whitespace-nowrap ${tab === "overview" ? "border-[#f1c243] text-[#192441]" : "border-transparent text-slate-400"}`}
                  >
                    Visão geral
                  </button>
                  <button
                    onClick={() => setTab("moves")}
                    className={`border-b-2 py-4 text-sm font-bold whitespace-nowrap ${tab === "moves" ? "border-[#f1c243] text-[#192441]" : "border-transparent text-slate-400"}`}
                  >
                    Movesets base
                  </button>
                  <button
                    onClick={() => setTab("tms")}
                    className={`border-b-2 py-4 text-sm font-bold whitespace-nowrap ${tab === "tms" ? "border-[#f1c243] text-[#192441]" : "border-transparent text-slate-400"}`}
                  >
                    TMs compatíveis
                  </button>
                </div>
              </div>
              <div className="p-6 md:p-10">
                {tab === "overview" && (
                  <div className="grid gap-8 lg:grid-cols-2">
                    <div>
                      <h3 className="mb-5 text-sm font-black uppercase tracking-widest text-[#192441]">
                        Status base
                      </h3>
                      <div className="space-y-4">
                        {selected.stats.map((stat) => (
                          <div
                            key={stat.stat.name}
                            className="grid grid-cols-[105px_34px_1fr] items-center gap-3"
                          >
                            <span className="text-xs font-semibold capitalize text-slate-500">
                              {stat.stat.name
                                .replace("special-attack", "atq. especial")
                                .replace("special-defense", "def. especial")
                                .replace("speed", "velocidade")
                                .replace("attack", "ataque")
                                .replace("defense", "defesa")
                                .replace("hp", "vida")}
                            </span>
                            <span className="text-right text-xs font-black text-[#24304e]">
                              {stat.base_stat}
                            </span>
                            <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                              <div
                                className="h-full rounded-full bg-gradient-to-r from-[#f4c542] to-[#f59e0b]"
                                style={{
                                  width: `${Math.min(stat.base_stat / 2, 100)}%`,
                                }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h3 className="mb-5 text-sm font-black uppercase tracking-widest text-[#192441]">
                        Informações de treino
                      </h3>
                      <div className="rounded-xl bg-[#f7f8fc] p-5">
                        <div className="flex items-center gap-3 border-b border-slate-200 pb-4">
                          <Sparkles className="h-5 w-5 text-[#f1b92b]" />
                          <div>
                            <p className="text-xs font-bold text-slate-400">
                              Ataque característico
                            </p>
                            <p className="mt-1 text-sm font-black capitalize text-[#24304e]">
                              {formatName(
                                selected.moves[0]?.move.name || "Overgrow",
                              )}
                            </p>
                          </div>
                        </div>
                        <p className="mt-4 text-xs leading-5 text-slate-500">
                          Um ataque marcante desta forma. Consulte as abas acima
                          para ver todos os movimentos aprendidos.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                {(tab === "moves" || tab === "tms") && (
                  <div>
                    <div className="mb-5 flex items-end justify-between">
                      <div>
                        <h3 className="text-lg font-black text-[#192441]">
                          {tab === "moves"
                            ? "Movimentos por nível"
                            : "Máquinas Técnicas"}
                        </h3>
                        <p className="mt-1 text-xs text-slate-400">
                          {tab === "moves"
                            ? "Movesets base aprendidos naturalmente."
                            : "TMs e tutoriais compatíveis com este Pokémon."}
                        </p>
                      </div>
                      <span className="rounded-full bg-[#fff6d9] px-3 py-1 text-[10px] font-black uppercase tracking-wider text-[#a87800]">
                        {tab === "moves" ? moves.length : tms.length}{" "}
                        encontrados
                      </span>
                    </div>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {(tab === "moves" ? moves : tms).map((move, i) => (
                        <div
                          key={`${move.move.name}-${i}`}
                          className="flex items-center justify-between rounded-xl border border-slate-100 bg-[#fafbfe] p-4"
                        >
                          <div>
                            <p className="text-sm font-black capitalize text-[#24304e]">
                              {formatName(move.move.name)}
                            </p>
                            <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                              {tab === "moves"
                                ? `Nível ${move.version_group_details.find((d) => d.move_learn_method.name === "level-up")?.level_learned_at || 1}`
                                : "Machine / tutor"}
                            </p>
                          </div>
                          <span className="rounded-md bg-white px-2 py-1 text-[10px] font-black text-slate-400">
                            {tab === "moves"
                              ? `L${move.version_group_details.find((d) => d.move_learn_method.name === "level-up")?.level_learned_at || 1}`
                              : `TM${String(i + 1).padStart(2, "0")}`}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
          {!selected && !loadingList && (
            <div className="rounded-2xl bg-white p-10 text-center text-slate-400">
              Selecione um Pokémon para começar.
            </div>
          )}
          <div className="mt-5 flex items-center justify-between text-xs text-slate-400">
            <button
              disabled={selectedIndex <= 0}
              onClick={() =>
                selectedIndex > 0 && loadPokemon(list[selectedIndex - 1].url)
              }
              className="flex items-center gap-2 font-bold disabled:opacity-30"
            >
              <ChevronLeft className="h-4 w-4" /> Anterior
            </button>
            <span>Dados fornecidos pela PokéAPI</span>
            <button
              disabled={selectedIndex >= list.length - 1}
              onClick={() =>
                selectedIndex < list.length - 1 &&
                loadPokemon(list[selectedIndex + 1].url)
              }
              className="flex items-center gap-2 font-bold disabled:opacity-30"
            >
              Próximo <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </section>
        {selected && (
          <>
            <nav
              aria-label="Informações do Pokémon"
              className="mt-4 flex gap-1 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-sm"
            >
              {(
                [
                  ["overview", "Resumo"],
                  ["description", "Descrição"],
                  ["abilities", "Habilidades"],
                  ["items", "Itens"],
                  ["moves", "Moves"],
                  ["tms", "TMs"],
                  ["locations", "Onde encontrar"],
                  ["shiny", "Shiny"],
                  ["balls", "% Pokébola"],
                  ["capture", "Taxa de captura"],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  onClick={() => setTab(value)}
                  className={`whitespace-nowrap rounded-xl px-4 py-2.5 text-xs font-black transition ${tab === value ? "bg-[#192441] text-white shadow-sm" : "text-slate-500 hover:bg-slate-50"}`}
                >
                  {label}
                </button>
              ))}
            </nav>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {(tab === "overview" || tab === "description") && (
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:col-span-2">
                  <p className="text-[10px] font-black uppercase tracking-[.2em] text-[#f1b92b]">
                    Entrada da Pokédex
                  </p>
                  <p className="mt-3 text-sm leading-7 text-slate-600">
                    {description || "Traduzindo a descrição oficial..."}
                  </p>
                  <p className="mt-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Descrição traduzida • PokéAPI
                  </p>
                </div>
              )}
              {(tab === "overview" || tab === "abilities") && (
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <p className="text-[10px] font-black uppercase tracking-[.2em] text-[#f1b92b]">
                    Habilidades
                  </p>
                  <div className="mt-4 space-y-2">
                    {selected.abilities.map((entry) => (
                      <div
                        key={entry.ability.name}
                        className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2"
                      >
                        <span className="text-sm font-bold text-slate-700">
                          {formatName(entry.ability.name)}
                        </span>
                        <span className="text-[10px] font-black uppercase text-slate-400">
                          {entry.is_hidden ? "Oculta" : "Normal"}
                        </span>
                      </div>
                    ))}
                  </div>
                  <p className="mt-4 text-xs leading-5 text-slate-500">
                    <strong>Z-Moves:</strong> movimentos de uso único ativados
                    por cristais Z; a PokéAPI lista compatibilidade por
                    movimentos aprendíveis.
                  </p>
                </div>
              )}
              {(tab === "overview" || tab === "items") && (
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[.2em] text-[#f1b92b]">
                        Itens carregados
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        Equipamentos encontrados para esta forma
                      </p>
                    </div>
                    <Package className="h-5 w-5 text-[#f1b92b]" />
                  </div>
                  {selected.held_items.length || allEvolutionItems.length ? (
                    <div className="mt-5 grid gap-2 sm:grid-cols-2">
                      {selected.held_items.map((entry) => (
                        <div
                          key={entry.item.name}
                          className="flex min-w-0 items-center gap-3 rounded-xl border border-[#f3e7b5] bg-[#fffaf0] px-3 py-3"
                        >
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-[#b28700] shadow-sm">
                            <Package className="h-4 w-4" />
                          </div>
                          <span className="truncate text-xs font-black text-[#6f5700]">
                            {formatName(entry.item.name)}
                          </span>
                        </div>
                      ))}
                      {allEvolutionItems.map((item) => (
                        <div
                          key={`evolution-${item}`}
                          className="flex min-w-0 items-center gap-3 rounded-xl border border-[#f3e7b5] bg-[#fffaf0] px-3 py-3"
                        >
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-[#b28700] shadow-sm">
                            <Sparkles className="h-4 w-4" />
                          </div>
                          <span className="truncate text-xs font-black text-[#6f5700]">
                            {item}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="mt-5 rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-center text-sm text-slate-500">
                      Nenhum item registrado na PokéAPI.
                    </div>
                  )}
                  {evolutionMethods.length > 0 && (
                    <div className="mt-6 border-t border-slate-100 pt-5">
                      <p className="text-[10px] font-black uppercase tracking-[.2em] text-[#f1b92b]">
                        Método de evolução
                      </p>
                      <div className="mt-3 space-y-2">
                        {evolutionMethods.map((evolution) => (
                          <div
                            key={`${evolution.to}-${evolution.method}`}
                            className="flex items-center justify-between gap-3 rounded-xl bg-[#f7f8fc] px-3 py-3"
                          >
                            <span className="text-xs font-bold text-slate-600">
                              {evolution.method}
                            </span>
                            <span className="text-xs font-black text-[#24304e]">
                              {formatName(evolution.to)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <p className="mt-4 text-xs leading-5 text-slate-500">
                    Itens carregados e condições de evolução registradas na
                    PokéAPI.
                  </p>
                </div>
              )}
              {tab === "locations" && (
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:col-span-2">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[.2em] text-[#f1b92b]">
                        Onde encontrar
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        Áreas registradas na PokéAPI
                      </p>
                    </div>
                    <MapPin className="h-5 w-5 text-[#f1b92b]" />
                  </div>
                  {Object.keys(locationGroups).length ? (
                    <div className="mt-5 grid gap-3 sm:grid-cols-2">
                      {Object.entries(locationGroups).map(
                        ([location, versions]) => (
                          <div
                            key={location}
                            className="rounded-xl border border-slate-100 bg-[#fafbfe] p-4"
                          >
                            <p className="text-sm font-black text-[#24304e]">
                              {location}
                            </p>
                            <p className="mt-2 text-xs leading-5 text-slate-500">
                              {versions.join(" · ")}
                            </p>
                          </div>
                        ),
                      )}
                    </div>
                  ) : (
                    <div className="mt-5 rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-center text-sm text-slate-500">
                      Este Pokémon não possui locais de encontro registrados.
                    </div>
                  )}
                </div>
              )}
              {tab === "shiny" && (
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:col-span-2">
                  <p className="text-[10px] font-black uppercase tracking-[.2em] text-[#f1b92b]">
                    Shiny form
                  </p>
                  <div className="mt-5 grid gap-4 sm:grid-cols-2">
                    <div className="rounded-2xl bg-[#f7f8fc] p-5 text-center">
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        Forma normal
                      </p>
                      <img
                        src={artUrl(selected)}
                        alt={`${formatName(selected.name)} normal`}
                        className="mx-auto mt-3 h-44 w-44 object-contain"
                      />
                    </div>
                    <div className="rounded-2xl bg-[#fffaf0] p-5 text-center">
                      <p className="text-xs font-bold uppercase tracking-wider text-[#a87800]">
                        Forma shiny
                      </p>
                      {shinyArtUrl(selected) ? (
                        <img
                          src={shinyArtUrl(selected)}
                          alt={`${formatName(selected.name)} shiny`}
                          className="mx-auto mt-3 h-44 w-44 object-contain"
                        />
                      ) : (
                        <p className="mt-20 text-sm text-slate-500">
                          Sprite shiny não disponível.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
              {tab === "balls" && (
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:col-span-2">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[.2em] text-[#f1b92b]">
                        Porcentagem de Pokébola
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        Estimativa base usando a taxa oficial, sem bônus de HP
                        ou status
                      </p>
                    </div>
                    <Target className="h-5 w-5 text-[#f1b92b]" />
                  </div>
                  <div className="mt-5 grid gap-3 sm:grid-cols-3">
                    {ballEstimates.map((ball) => {
                      const chance = Math.min(
                        100,
                        ((captureRate * ball.modifier) / 255) * 100,
                      );
                      return (
                        <div
                          key={ball.name}
                          className="rounded-xl border border-slate-100 bg-[#fafbfe] p-4"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-sm font-black text-[#24304e]">
                              {ball.name}
                            </span>
                            <span
                              className={`h-3 w-3 rounded-full ${ball.color}`}
                            />
                          </div>
                          <strong className="mt-4 block text-2xl font-black text-[#192441]">
                            {chance.toFixed(1)}%
                          </strong>
                          <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                            <div
                              className={`h-full rounded-full ${ball.color}`}
                              style={{ width: `${chance}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              {tab === "capture" && (
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:col-span-2">
                  <p className="text-[10px] font-black uppercase tracking-[.2em] text-[#f1b92b]">
                    Taxa de captura
                  </p>
                  <div className="mt-5 flex flex-col gap-5 sm:flex-row sm:items-center">
                    <div className="flex h-28 w-28 shrink-0 items-center justify-center rounded-full border-[10px] border-[#f4c542] bg-[#fffaf0]">
                      <strong className="text-3xl font-black text-[#192441]">
                        {captureRate}
                      </strong>
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-[#192441]">
                        {captureRate}/255
                      </h3>
                      <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
                        Quanto maior o valor, mais fácil é capturar. A chance
                        real varia com a Pokébola, HP atual, condições de status
                        e turno da batalha.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
      <footer className="border-t border-slate-200 bg-white px-5 py-6 text-center text-xs text-slate-400">
        Pokédex interativa • Dados públicos da{" "}
        <span className="font-bold text-slate-500">PokéAPI</span>
      </footer>
    </main>
  );
}
