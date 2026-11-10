// One-off script — not run at build or request time. Rasterizes
// public/icon.svg into the PNG icons a home-screen install needs: Chrome
// only offers "Install app" with 192px and 512px icons in the manifest, and
// iOS ignores SVG touch icons. Re-run with `node scripts/generate-app-icons.mjs`
// (needs the `sharp` devDependency) after replacing public/icon.svg.
import path from "node:path";
import { fileURLToPath } from "node:url";
import { readFile } from "node:fs/promises";
import sharp from "sharp";

const rootDir = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const publicDir = path.join(rootDir, "public");
const BACKGROUND = "#fffaf0";

async function main() {
  const svg = await readFile(path.join(publicDir, "icon.svg"));

  // Flattened onto the background: the SVG's rounded corners are
  // transparent, which iOS would fill with black. Both platforms apply
  // their own corner mask anyway.
  await Promise.all(
    [
      ["icon-192.png", 192],
      ["icon-512.png", 512],
      ["apple-touch-icon.png", 180],
    ].map(([filename, size]) =>
      sharp(svg).resize(size, size).flatten({ background: BACKGROUND }).png().toFile(path.join(publicDir, filename)),
    ),
  );

  // Android "maskable" icon: launchers crop to a circle/squircle, so the
  // mark must sit inside the central 80% safe zone.
  const mark = await sharp(svg).resize(384, 384).flatten({ background: BACKGROUND }).png().toBuffer();
  await sharp({ create: { width: 512, height: 512, channels: 4, background: BACKGROUND } })
    .composite([{ input: mark, gravity: "center" }])
    .png()
    .toFile(path.join(publicDir, "icon-maskable-512.png"));

  console.log(`Wrote app icons to ${publicDir}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
