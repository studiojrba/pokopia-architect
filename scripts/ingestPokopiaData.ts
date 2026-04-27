/**
 * Build-time ingestion of upstream Pokopia reference data.
 *
 * Reads from data/upstream/ (git submodule -> JEschete/PokopiaPlanning) and
 * writes typed JSON into src/data/generated/ that the app consumes at runtime.
 *
 * Run with: npm run ingest
 *
 * This script is intentionally simple and re-runnable. The generated JSON is
 * committed so consumers do not need to clone the submodule to run the app.
 */
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = resolve(__dirname, "..");

const UPSTREAM = join(ROOT, "data", "upstream");
const OUT = join(ROOT, "src", "data", "generated");

async function ensureUpstream(): Promise<void> {
  if (!existsSync(UPSTREAM)) {
    console.error(
      "data/upstream is missing. Run: git submodule update --init --recursive",
    );
    process.exit(1);
  }
}

async function ensureOut(): Promise<void> {
  await mkdir(OUT, { recursive: true });
}

async function writeJson(name: string, data: unknown): Promise<void> {
  const path = join(OUT, `${name}.json`);
  await writeFile(path, JSON.stringify(data, null, 2) + "\n", "utf8");
  console.log(`wrote ${path}`);
}

// TODO: implement parsers in subsequent commits:
//   - parsePokemonCsv()        from reference/Pokopia.csv
//   - parseHabitatsMd()        from reference/Habitats.md
//   - parseItemList()          from reference/Item List.txt
//   - parseItemsByFavorite()   from reference/Items By Favorite.md
//   - parseLocations()         from reference/Locations.md
//   - parseSpecialties()       from reference/Specialties.txt
//   - parseHouseGroups()       from planning/*.md
async function main(): Promise<void> {
  await ensureUpstream();
  await ensureOut();
  // Placeholder so the pipeline is wired up; real parsers land in the next
  // commit alongside the parser unit tests.
  await writeJson("manifest", {
    generatedAt: new Date().toISOString(),
    source: "JEschete/PokopiaPlanning",
    note: "Stub manifest; real parsed data lands once parsers are implemented.",
  });
  // Read the upstream README purely as a smoke test that the submodule is
  // initialized correctly.
  const upstreamReadme = await readFile(join(UPSTREAM, "README.md"), "utf8");
  console.log(
    `upstream README ok (${upstreamReadme.length} chars) — submodule is initialized.`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
