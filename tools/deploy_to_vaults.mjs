// Deploy built plugin artifacts into each vault listed in tools/vaults.json.
// Reads the plugin id from manifest.json so the target folder always matches.
import { readFileSync, existsSync, mkdirSync, copyFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const toolsDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(toolsDir, "..");

function fail(msg) {
	console.error(`\n[deploy] ERROR: ${msg}\n`);
	process.exit(1);
}

// --- Load vault config ---
const configPath = join(toolsDir, "vaults.json");
if (!existsSync(configPath)) {
	fail(
		`tools/vaults.json not found.\n` +
		`        Copy tools/vaults.example.json to tools/vaults.json and set your vault root path(s).`
	);
}

let config;
try {
	config = JSON.parse(readFileSync(configPath, "utf8"));
} catch (e) {
	fail(`tools/vaults.json is not valid JSON: ${e.message}`);
}

const vaults = Array.isArray(config?.vaults) ? config.vaults : null;
if (!vaults || vaults.length === 0) {
	fail(`tools/vaults.json must contain a non-empty "vaults" array of vault root paths.`);
}

// --- Read plugin id from manifest ---
const manifestPath = join(repoRoot, "manifest.json");
if (!existsSync(manifestPath)) fail(`manifest.json not found at repo root.`);
const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
const pluginId = manifest.id;
if (!pluginId) fail(`manifest.json has no "id" field.`);

// --- Require a build ---
const mainJs = join(repoRoot, "main.js");
if (!existsSync(mainJs)) {
	fail(`main.js not found. Run "npm run build" first (the .bat does this automatically).`);
}

// --- Artifacts to copy (styles.css optional) ---
const artifacts = ["main.js", "manifest.json"];
if (existsSync(join(repoRoot, "styles.css"))) artifacts.push("styles.css");

console.log(`[deploy] Plugin "${pluginId}" v${manifest.version} -> ${vaults.length} vault(s)\n`);

let ok = 0;
let errors = 0;

for (const vaultRoot of vaults) {
	const dest = join(vaultRoot, ".obsidian", "plugins", pluginId);
	try {
		if (!existsSync(join(vaultRoot, ".obsidian"))) {
			console.error(`  SKIP  ${vaultRoot}  (no .obsidian folder — is this a vault root?)`);
			errors++;
			continue;
		}
		mkdirSync(dest, { recursive: true });
		for (const file of artifacts) {
			copyFileSync(join(repoRoot, file), join(dest, file));
		}
		console.log(`  OK    ${dest}`);
		console.log(`        copied: ${artifacts.join(", ")}`);
		ok++;
	} catch (e) {
		console.error(`  FAIL  ${dest}  (${e.message})`);
		errors++;
	}
}

console.log(`\n[deploy] Done. ${ok} succeeded, ${errors} failed.`);
process.exit(errors > 0 ? 1 : 0);
