/**
 * Build-time ingestion of upstream Pokopia reference data.
 *
 * Reads from data/upstream/ (git submodule -> JEschete/PokopiaPlanning) and
 * writes typed JSON into src/data/generated/ that the app consumes at runtime.
 *
 * Also downloads Pokemon sprites from PokeAPI's public sprite repo into
 * public/sprites/pokemon/{dex}.png so the app can render Pokemon images
 * offline. Sprites that already exist on disk are skipped.
 *
 * Run with: npm run ingest
 */
import { existsSync } from "node:fs";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import Papa from "papaparse";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = resolve(__dirname, "..");

const UPSTREAM = join(ROOT, "data", "upstream");
const REFERENCE = join(UPSTREAM, "reference");
const PLANNING = join(UPSTREAM, "planning");
const FAV_DIR = join(REFERENCE, "Items By Favorite");
const CURATED = join(ROOT, "data", "curated");
const OUT = join(ROOT, "src", "data", "generated");
const SPRITES = join(ROOT, "public", "sprites", "pokemon");

// -----------------------------------------------------------------------------
// Shared types
// -----------------------------------------------------------------------------

type RegionId =
  | "witheredWasteland"
  | "bleakBeach"
  | "rockyRidges"
  | "sparklingSkylands"
  | "paletteTown";

const REGION_LABEL_TO_ID: Record<string, RegionId> = {
  "Withered Wastelands": "witheredWasteland",
  "Bleak Beach": "bleakBeach",
  "Rocky Ridges": "rockyRidges",
  "Sparkling Skylands": "sparklingSkylands",
  "Palette Town": "paletteTown",
};

type HabitatType = "Bright" | "Cool" | "Dark" | "Dry" | "Humid" | "Warm";

interface PokemonHabitat {
  name: string;
  available: Partial<Record<RegionId, boolean>>;
  rarity?: string;
  timesOfDay?: string[];
  weathers?: string[];
}

interface PokemonEntry {
  number: number;
  numberStr: string;
  name: string;
  /** PokeAPI species slug used to resolve sprites. */
  slug: string;
  /**
   * Official National Pokedex number (PokeAPI species id), used for sprite
   * lookups. `null` when the species could not be resolved via PokeAPI.
   * Pokopia's `number` is its own internal ordering and does NOT match the
   * National Pokedex, so sprites must use this field instead.
   */
  nationalDex: number | null;
  primaryLocation: string;
  specialties: string[];
  idealHabitat: HabitatType | string;
  favorites: string[];
  habitats: PokemonHabitat[];
}

interface Habitat {
  id: string;
  number: number;
  name: string;
  description: string;
  isEvent: boolean;
}

interface ItemEntry {
  name: string;
  category: string;
  description: string;
  locations: string[];
}

interface FavoriteCategoryEntry {
  category: string;
  items: { name: string; description: string }[];
}

interface LocationRegion {
  region: RegionId | "dreamIsland";
  name: string;
  description: string;
  objective: string;
  materials: string[];
  plantsAndBlocks: string[];
}

interface Specialty {
  name: string;
  description: string;
}

interface HouseGroupPokemon {
  number: number;
  numberStr: string;
  name: string;
  favorites: string[];
}

interface HouseGroup {
  region: RegionId;
  habitatType: HabitatType | string;
  number: number;
  title: string;
  pokemon: HouseGroupPokemon[];
  shared: string[];
  suggestedItems: { favorite: string; items: string[] }[];
}

// -----------------------------------------------------------------------------
// Filesystem helpers
// -----------------------------------------------------------------------------

async function ensureUpstream(): Promise<void> {
  if (!existsSync(UPSTREAM)) {
    console.error(
      "data/upstream is missing. Run: git submodule update --init --recursive",
    );
    process.exit(1);
  }
}

async function ensureDir(path: string): Promise<void> {
  await mkdir(path, { recursive: true });
}

async function writeJson(name: string, data: unknown): Promise<void> {
  const path = join(OUT, `${name}.json`);
  await writeFile(path, JSON.stringify(data, null, 2) + "\n", "utf8");
  const size = JSON.stringify(data).length;
  const count = Array.isArray(data) ? data.length : Object.keys(data as object).length;
  console.log(`  ${name}.json: ${count} entries (${(size / 1024).toFixed(1)} KB)`);
}

async function readUpstream(...parts: string[]): Promise<string> {
  return readFile(join(UPSTREAM, ...parts), "utf8");
}

// -----------------------------------------------------------------------------
// Pokemon dex (curated Nintendo Life list + JEschete CSV for rich data)
// -----------------------------------------------------------------------------

interface CuratedPokemon {
  number: number;
  name: string;
}

interface JEschetePokemon {
  name: string;
  primaryLocation: string;
  specialties: string[];
  idealHabitat: string;
  favorites: string[];
  habitats: PokemonHabitat[];
}

/**
 * Read the JEschete/PokopiaPlanning CSV. Its numbering is unreliable (typos,
 * fan-fic extras like Peakychu/Mosslax, dex=0 entries), so we discard the
 * `Number` column and key everything by normalized name. Only the rich data
 * (favorites, habitats, specialties) is consumed.
 */
async function parseJEscheteCsv(): Promise<JEschetePokemon[]> {
  const csv = await readUpstream("reference", "Pokopia.csv");
  const result = Papa.parse<Record<string, string>>(csv, {
    header: true,
    skipEmptyLines: true,
  });
  if (result.errors.length > 0) {
    console.warn(`  pokemon.csv: ${result.errors.length} parse warnings`);
  }

  const csvRegionLabels: Array<{ label: string; id: RegionId }> = [
    { label: "Withered Wastelands", id: "witheredWasteland" },
    { label: "Bleak Beach", id: "bleakBeach" },
    { label: "Rocky Ridges", id: "rockyRidges" },
    { label: "Sparkling Skylands", id: "sparklingSkylands" },
    { label: "Palette Town", id: "paletteTown" },
  ];

  const splitList = (value: string | undefined): string[] => {
    if (!value) return [];
    return value.split(",").map((v) => v.trim()).filter(Boolean);
  };

  const entries: JEschetePokemon[] = [];
  for (const row of result.data) {
    const name = (row["Name"] || "").trim();
    if (!name) continue;
    const habitats: PokemonHabitat[] = [];
    for (let h = 1; h <= 3; h++) {
      const habName = (row[`Habitat ${h}`] || "").trim();
      if (!habName) continue;
      const available: Partial<Record<RegionId, boolean>> = {};
      for (const { label, id } of csvRegionLabels) {
        const cell = (row[`Habitat ${h} ${label}`] || "").trim();
        if (cell) available[id] = /yes/i.test(cell);
      }
      habitats.push({
        name: habName,
        available,
        rarity: (row[`Habitat ${h} Rarity`] || "").trim() || undefined,
        timesOfDay: splitList(row[`Habitat ${h} Time`]),
        weathers: splitList(row[`Habitat ${h} Weather`]),
      });
    }
    entries.push({
      name,
      primaryLocation: (row["Primary Location"] || "").trim(),
      specialties: [row["Specialty 1"], row["Specialty 2"]]
        .map((s) => (s || "").trim())
        .filter(Boolean),
      idealHabitat: (row["Ideal Habitat"] || "").trim(),
      favorites: [
        row["Favorite 1"],
        row["Favorite 2"],
        row["Favorite 3"],
        row["Favorite 4"],
        row["Favorite 5"],
        row["Favorite 6"],
      ]
        .map((s) => (s || "").trim())
        .filter(Boolean),
      habitats,
    });
  }
  return entries;
}

/**
 * Normalize a Pokemon display name to a key that collapses regional/form
 * variants to the base species, so we can look up rich JEschete data by the
 * canonical Nintendo Life name. Also handles JEschete's NPC nickname
 * "Stereo Rotom" -> "rotom".
 */
function jeKey(name: string): string {
  let s = name.toLowerCase().trim();
  s = s.replace(/\s+(low key|amped|curly|droopy|stretchy)\s+form$/, "");
  s = s.replace(/\s+east\s+sea$/, "");
  // JEschete NPC nicknames that don't appear in Nintendo Life. We don't strip
  // "Paldean " here because Paldean Wooper is a distinct form in NL.
  if (s === "stereo rotom") s = "rotom";
  // Drop fan-fic JEschete entries (no canonical Pokemon).
  if (s === "peakychu" || s === "mosslax" || s === "professor tangrowth") {
    return ""; // empty key -> won't match anything
  }
  return s;
}

/**
 * Convert a canonical Pokemon name into a PokeAPI species slug. Handles
 * regional forms (Paldean prefix) and special punctuation (Mr. Mime,
 * Farfetch'd, Mime Jr.).
 */
function pokemonSlug(name: string): string {
  let s = name.toLowerCase().trim();
  s = s.replace(/^paldean\s+/, "");
  s = s.replace(/[.']/g, "");
  s = s.replace(/\s+/g, "-");
  return s;
}

/**
 * Build the final Pokemon list by walking the curated Nintendo Life pokedex
 * and merging in matching rich data from the JEschete CSV. Curated entries
 * with no JEschete match (Mime Jr., Mr. Mime, Farfetch'd) get empty rich data
 * but still appear with the correct Pokopia dex number and canonical name.
 */
async function buildPokemon(): Promise<PokemonEntry[]> {
  const curated = JSON.parse(
    await readFile(join(CURATED, "pokopia-pokedex.json"), "utf8"),
  ) as CuratedPokemon[];
  const je = await parseJEscheteCsv();

  // Index JEschete by normalized name. When multiple entries share a key
  // (e.g. Tatsugiri Curly/Droopy/Stretchy, Toxtricity Low Key/Amped), prefer
  // the entry with the most populated favorites list - JEschete sometimes
  // leaves form-specific rows empty (e.g. Tatsugiri Curly has no favorites).
  const jeMap = new Map<string, JEschetePokemon>();
  for (const e of je) {
    const key = jeKey(e.name);
    if (!key) continue;
    const existing = jeMap.get(key);
    if (!existing || e.favorites.length > existing.favorites.length) {
      jeMap.set(key, e);
    }
  }

  const entries: PokemonEntry[] = [];
  let matched = 0;
  let unmatched = 0;
  for (const c of curated) {
    const key = jeKey(c.name);
    const rich = jeMap.get(key);
    if (rich) matched++;
    else unmatched++;
    entries.push({
      number: c.number,
      numberStr: `#${String(c.number).padStart(3, "0")}`,
      name: c.name,
      slug: pokemonSlug(c.name),
      nationalDex: null,
      primaryLocation: rich?.primaryLocation ?? "",
      specialties: rich?.specialties ?? [],
      idealHabitat: rich?.idealHabitat ?? "",
      favorites: rich?.favorites ?? [],
      habitats: rich?.habitats ?? [],
    });
  }
  console.log(
    `  rich data: ${matched} matched JEschete entries, ${unmatched} curated-only`,
  );
  if (unmatched > 0) {
    const missing = entries.filter((e) => e.favorites.length === 0);
    for (const m of missing) {
      console.warn(`    no JEschete data: #${m.number} ${m.name}`);
    }
  }

  // Surface JEschete entries we deliberately skipped so the contributor knows
  // why their rich data didn't make it into the output.
  const usedKeys = new Set(curated.map((c) => jeKey(c.name)));
  const dropped = je.filter((e) => {
    const k = jeKey(e.name);
    return k === "" || !usedKeys.has(k);
  });
  if (dropped.length > 0) {
    console.log(`  dropped ${dropped.length} JEschete entries not in curated list:`);
    for (const d of dropped) console.log(`    - ${d.name}`);
  }

  return entries;
}

const SPECIES_URL = (slug: string) =>
  `https://pokeapi.co/api/v2/pokemon-species/${slug}/`;

async function resolveNationalDex(slug: string): Promise<number | null> {
  try {
    const res = await fetch(SPECIES_URL(slug));
    if (!res.ok) return null;
    const data = (await res.json()) as { id?: number };
    return typeof data.id === "number" ? data.id : null;
  } catch {
    return null;
  }
}

async function resolveAllNationalDex(pokemon: PokemonEntry[]): Promise<void> {
  const uniqueSlugs = Array.from(new Set(pokemon.map((p) => p.slug)));
  const cache = new Map<string, number | null>();
  const concurrency = 8;
  const queue = [...uniqueSlugs];
  await Promise.all(
    Array.from({ length: concurrency }, async () => {
      while (queue.length > 0) {
        const slug = queue.shift();
        if (slug === undefined) return;
        cache.set(slug, await resolveNationalDex(slug));
      }
    }),
  );
  let resolved = 0;
  let unresolved = 0;
  for (const p of pokemon) {
    p.nationalDex = cache.get(p.slug) ?? null;
    if (p.nationalDex == null) unresolved++;
    else resolved++;
  }
  console.log(
    `  national dex: ${resolved} resolved, ${unresolved} unresolved (across ${uniqueSlugs.length} unique slugs)`,
  );
  if (unresolved > 0) {
    const missing = pokemon.filter((p) => p.nationalDex == null);
    for (const p of missing) {
      console.warn(`    unresolved: ${p.name} (slug: ${p.slug})`);
    }
  }
}

// -----------------------------------------------------------------------------
// Habitats markdown (209 + 3)
// -----------------------------------------------------------------------------

async function parseHabitats(): Promise<Habitat[]> {
  const md = await readUpstream("reference", "Habitats.md");
  const lines = md.split(/\r?\n/);
  const habitats: Habitat[] = [];
  let inEventSection = false;
  for (const line of lines) {
    if (/^##\s+Event Habitats/i.test(line)) {
      inEventSection = true;
      continue;
    }
    const match = line.match(/^\|\s*(E?\d+)\s*\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|$/);
    if (!match) continue;
    const [, num, name, description] = match;
    if (/^-+$/.test(num) || num === "#") continue;
    const isEvent = num.startsWith("E");
    const number = parseInt(num.replace(/^E/, ""), 10);
    if (!Number.isFinite(number)) continue;
    habitats.push({
      id: isEvent ? `E${String(number).padStart(3, "0")}` : String(number).padStart(3, "0"),
      number,
      name: name.trim(),
      description: description.trim(),
      isEvent: isEvent || inEventSection,
    });
  }
  return habitats;
}

// -----------------------------------------------------------------------------
// Item List (parsed by category sections)
// -----------------------------------------------------------------------------

async function parseItems(): Promise<ItemEntry[]> {
  const txt = await readUpstream("reference", "Item List.txt");
  const lines = txt.split(/\r?\n/);
  const items: ItemEntry[] = [];
  let category: string | null = null;
  let pending: ItemEntry | null = null;

  const flush = () => {
    if (pending) items.push(pending);
    pending = null;
  };

  for (const raw of lines) {
    const line = raw;
    const trimmed = line.trim();

    const sectionMatch = trimmed.match(/^List of (.+?)\s*$/i);
    if (sectionMatch) {
      flush();
      category = sectionMatch[1].trim();
      continue;
    }

    // Skip the column header line that appears after each section heading.
    if (
      trimmed === "Picture \tName \tDescription \tLocations" ||
      /^Picture\s+Name\s+Description\s+Locations$/.test(trimmed)
    ) {
      continue;
    }

    if (!category) continue;
    if (!trimmed) {
      // Blank line breaks an item's location continuation block.
      flush();
      continue;
    }

    if (line.includes("\t")) {
      flush();
      const parts = line.split("\t");
      const [, name, description, firstLocation] = [
        parts[0] ?? "",
        parts[1] ?? "",
        parts[2] ?? "",
        parts[3] ?? "",
      ];
      const cleanName = (name || "").trim();
      if (!cleanName) continue;
      pending = {
        name: cleanName,
        category,
        description: (description || "").trim(),
        locations: [],
      };
      const firstLoc = (firstLocation || "").trim();
      if (firstLoc) pending.locations.push(firstLoc);
    } else if (pending) {
      // Continuation line for the current item's locations column.
      pending.locations.push(trimmed);
    }
  }
  flush();
  return items;
}

// -----------------------------------------------------------------------------
// Items By Favorite (43 categories, one md file each)
// -----------------------------------------------------------------------------

async function parseItemsByFavorite(): Promise<FavoriteCategoryEntry[]> {
  if (!existsSync(FAV_DIR)) {
    console.warn("  items by favorite dir missing");
    return [];
  }
  const files = (await readdir(FAV_DIR)).filter((f) => f.endsWith(".md")).sort();
  const out: FavoriteCategoryEntry[] = [];
  for (const file of files) {
    const md = await readFile(join(FAV_DIR, file), "utf8");
    const lines = md.split(/\r?\n/);
    const category = file.replace(/\.md$/, "");
    const items: { name: string; description: string }[] = [];
    for (const line of lines) {
      const m = line.match(/^\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|$/);
      if (!m) continue;
      const [, name, description] = m;
      const cleanName = name.trim();
      if (
        !cleanName ||
        cleanName.toLowerCase() === "name" ||
        /^-+$/.test(cleanName)
      ) {
        continue;
      }
      items.push({ name: cleanName, description: description.trim() });
    }
    out.push({ category, items });
  }
  return out;
}

// -----------------------------------------------------------------------------
// Locations (5 main regions + Dream Island)
// -----------------------------------------------------------------------------

async function parseLocations(): Promise<LocationRegion[]> {
  const md = await readUpstream("reference", "Locations.md");
  const sections = md.split(/^##\s+/m).slice(1);
  const out: LocationRegion[] = [];
  for (const section of sections) {
    const firstNl = section.indexOf("\n");
    const title = section.slice(0, firstNl).trim();
    const body = section.slice(firstNl + 1);

    const description =
      body.match(/\*\*Description:\*\*\s*(.*?)(?:\n\n|\n\*\*|$)/s)?.[1]?.trim() ?? "";
    const objective =
      body.match(/\*\*Objective:\*\*\s*(.*?)(?:\n\n|\n\*\*|$)/s)?.[1]?.trim() ?? "";

    const grabSection = (heading: string): string[] => {
      const re = new RegExp(`###\\s+${heading}\\s*\\n([\\s\\S]*?)(?=\\n###|\\n---|$)`);
      const block = body.match(re)?.[1] ?? "";
      const cells: string[] = [];
      for (const line of block.split(/\r?\n/)) {
        if (!line.trim().startsWith("|")) continue;
        if (/^\|\s*-/.test(line.trim())) continue;
        const items = line
          .split("|")
          .map((s) => s.trim())
          .filter((s) => s.length > 0);
        cells.push(...items);
      }
      return Array.from(new Set(cells));
    };

    const materials = grabSection("Materials");
    const plantsAndBlocks = grabSection("Plants & Blocks");

    const regionId =
      title === "Dream Island"
        ? ("dreamIsland" as const)
        : (REGION_LABEL_TO_ID[title] ?? null);
    if (!regionId) continue;
    out.push({
      region: regionId,
      name: title,
      description,
      objective,
      materials,
      plantsAndBlocks,
    });
  }
  return out;
}

// -----------------------------------------------------------------------------
// Specialties (tab-separated name<TAB>description)
// -----------------------------------------------------------------------------

async function parseSpecialties(): Promise<Specialty[]> {
  const txt = await readUpstream("reference", "Specialties.txt");
  const out: Specialty[] = [];
  for (const line of txt.split(/\r?\n/)) {
    if (!line.trim()) continue;
    const idx = line.indexOf("\t");
    if (idx === -1) continue;
    const name = line.slice(0, idx).trim();
    const description = line.slice(idx + 1).trim();
    out.push({ name, description });
  }
  return out;
}

// -----------------------------------------------------------------------------
// House Groups (5 markdown files, one per region)
// -----------------------------------------------------------------------------

async function parseHouseGroups(): Promise<HouseGroup[]> {
  const files: { region: RegionId; file: string }[] = [
    { region: "witheredWasteland", file: "Wasteland House Groups.md" },
    { region: "bleakBeach", file: "Beach House Groups.md" },
    { region: "rockyRidges", file: "Ridges House Groups.md" },
    { region: "sparklingSkylands", file: "Skylands House Groups.md" },
    { region: "paletteTown", file: "Pallet House Groups.md" },
  ];
  const groups: HouseGroup[] = [];

  for (const { region, file } of files) {
    const path = join(PLANNING, file);
    if (!existsSync(path)) {
      console.warn(`  house groups: missing ${path}`);
      continue;
    }
    const md = await readFile(path, "utf8");
    const lines = md.split(/\r?\n/);

    let currentHabitat: string | null = null;
    let currentGroup: HouseGroup | null = null;
    let inPokemonTable = false;
    let inSuggestedItems = false;

    const flush = () => {
      if (currentGroup && currentGroup.pokemon.length > 0) {
        groups.push(currentGroup);
      }
      currentGroup = null;
      inPokemonTable = false;
      inSuggestedItems = false;
    };

    for (const line of lines) {
      const habitatMatch = line.match(/^###\s+(\w+)\s+Habitat/i);
      if (habitatMatch) {
        flush();
        currentHabitat = habitatMatch[1];
        continue;
      }

      const houseMatch = line.match(
        /^\*\*House\s+(\d+):\s*([^*]+?)\*\*\s*[\u2014\u2013-]\s*(.*)$/,
      );
      if (houseMatch) {
        flush();
        const [, num, title] = houseMatch;
        currentGroup = {
          region,
          habitatType: currentHabitat ?? "Unknown",
          number: parseInt(num, 10),
          title: title.trim(),
          pokemon: [],
          shared: [],
          suggestedItems: [],
        };
        continue;
      }

      if (!currentGroup) continue;

      const sharedMatch = line.match(/^- (?:Shared|All share|3\/4 share):\s*(.*)$/i);
      if (sharedMatch) {
        const cleaned = sharedMatch[1]
          .replace(/\(.*?\)/g, "")
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
        currentGroup.shared.push(...cleaned);
        continue;
      }

      if (/^\|\s*#\s*\|\s*Name\s*\|/i.test(line)) {
        inPokemonTable = true;
        inSuggestedItems = false;
        continue;
      }
      if (/^\|\s*-/.test(line)) continue;

      if (inPokemonTable) {
        const m = line.match(/^\|\s*(#?\d+)\s*\|\s*([^|]+?)\s*\|(.+)\|$/);
        if (m) {
          const [, num, name, rest] = m;
          const favorites = rest
            .split("|")
            .map((s) => s.trim())
            .filter((s) => s.length > 0);
          const number = parseInt(num.replace(/^#/, ""), 10);
          if (Number.isFinite(number)) {
            currentGroup.pokemon.push({
              number,
              numberStr: `#${String(number).padStart(3, "0")}`,
              name: name.trim(),
              favorites,
            });
          }
          continue;
        } else if (line.trim() === "" || line.startsWith("**")) {
          inPokemonTable = false;
        }
      }

      if (/^\*\*Suggested Items:\*\*/i.test(line)) {
        inSuggestedItems = true;
        continue;
      }

      if (inSuggestedItems) {
        const itemLine = line.match(/^- \[([^\]]+)\][^:]*:\s*(.+)$/);
        if (itemLine) {
          const [, fav, list] = itemLine;
          const items = list
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean);
          currentGroup.suggestedItems.push({ favorite: fav.trim(), items });
          continue;
        }
      }

      if (line.trim() === "---") {
        flush();
      }
    }
    flush();
  }

  return groups;
}

// -----------------------------------------------------------------------------
// Pokemon sprites (download from PokeAPI sprite repo)
// -----------------------------------------------------------------------------

const SPRITE_URL = (dex: number) =>
  `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${dex}.png`;

async function downloadSprite(dex: number): Promise<"downloaded" | "skipped" | "missing"> {
  const path = join(SPRITES, `${dex}.png`);
  if (existsSync(path)) return "skipped";
  const res = await fetch(SPRITE_URL(dex));
  if (!res.ok) return "missing";
  const buf = Buffer.from(await res.arrayBuffer());
  await writeFile(path, buf);
  return "downloaded";
}

async function downloadSprites(pokemon: PokemonEntry[]): Promise<void> {
  await ensureDir(SPRITES);
  const dexNumbers = Array.from(
    new Set(
      pokemon
        .map((p) => p.nationalDex)
        .filter((d): d is number => typeof d === "number" && d > 0),
    ),
  ).sort((a, b) => a - b);
  let downloaded = 0;
  let skipped = 0;
  let missing = 0;
  const concurrency = 8;
  const queue = [...dexNumbers];
  await Promise.all(
    Array.from({ length: concurrency }, async () => {
      while (queue.length > 0) {
        const dex = queue.shift();
        if (dex === undefined) return;
        try {
          const status = await downloadSprite(dex);
          if (status === "downloaded") downloaded++;
          else if (status === "skipped") skipped++;
          else missing++;
        } catch (err) {
          missing++;
          console.warn(`  sprite #${dex} failed: ${(err as Error).message}`);
        }
      }
    }),
  );
  console.log(
    `  sprites: ${downloaded} downloaded, ${skipped} cached, ${missing} missing (national dex)`,
  );
}

// -----------------------------------------------------------------------------
// Main
// -----------------------------------------------------------------------------

async function main(): Promise<void> {
  await ensureUpstream();
  await ensureDir(OUT);

  console.log("Parsing upstream data...");

  const pokemon = await buildPokemon();
  console.log("Resolving National Pokedex numbers via PokeAPI...");
  await resolveAllNationalDex(pokemon);
  await writeJson("pokemon", pokemon);

  // Re-key house group pokemon numbers using the curated dex (JEschete's
  // numbering is stale and disagrees with the in-game Pokopia dex).
  const dexByName = new Map(pokemon.map((p) => [p.name.toLowerCase(), p.number]));

  const habitats = await parseHabitats();
  await writeJson("habitats", habitats);

  const items = await parseItems();
  await writeJson("items", items);

  const itemsByFavorite = await parseItemsByFavorite();
  await writeJson("itemsByFavorite", itemsByFavorite);

  const locations = await parseLocations();
  await writeJson("locations", locations);

  const specialties = await parseSpecialties();
  await writeJson("specialties", specialties);

  const houseGroups = await parseHouseGroups();
  // Sync house group pokemon numbers with the canonical curated dex so that
  // displayed numbers match the in-game Pokopia ordering.
  for (const g of houseGroups) {
    for (const p of g.pokemon) {
      const corrected = dexByName.get(p.name.toLowerCase());
      if (corrected != null && corrected !== p.number) {
        p.number = corrected;
        p.numberStr = `#${String(corrected).padStart(3, "0")}`;
      }
    }
  }
  await writeJson("houseGroups", houseGroups);

  await writeJson("manifest", {
    generatedAt: new Date().toISOString(),
    source: "JEschete/PokopiaPlanning + nintendolife.com",
    pokemon: pokemon.length,
    habitats: habitats.length,
    items: items.length,
    itemsByFavorite: itemsByFavorite.length,
    locations: locations.length,
    specialties: specialties.length,
    houseGroups: houseGroups.length,
  });

  console.log("Downloading Pokemon sprites...");
  await downloadSprites(pokemon);

  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
