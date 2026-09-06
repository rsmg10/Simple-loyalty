// One-off script — not run at build or request time. Rasterizes the app's
// existing public/icon.svg into the placeholder PNGs Apple and Google
// Wallet passes require. Run it once with `node scripts/generate-wallet-images.mjs`
// after `npm install` (needs the `sharp` devDependency). A café can swap the
// generated files in public/wallet/ for real branded artwork later — nothing
// else in the app depends on how these were produced.
import { mkdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const rootDir = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const outDir = path.join(rootDir, "public", "wallet");
const svgPath = path.join(rootDir, "public", "icon.svg");

const BACKGROUND = "#fffaf0";

async function main() {
  await mkdir(outDir, { recursive: true });
  const svg = await readFile(svgPath);

  // Apple Wallet icon — square, shown on the lock screen. 29pt is the
  // required minimum; @2x/@3x are the standard Retina/Super Retina variants.
  await Promise.all(
    [
      ["icon.png", 29],
      ["icon@2x.png", 58],
      ["icon@3x.png", 87],
    ].map(([filename, size]) =>
      sharp(svg).resize(size, size).png().toFile(path.join(outDir, filename)),
    ),
  );

  // Apple Wallet logo — rectangular, shown top-left of the pass. Composite
  // the square icon centered on a background-colored canvas at the required
  // 160x50 (@1x) / 320x100 (@2x) dimensions.
  await Promise.all(
    [
      ["logo.png", 160, 50, 40],
      ["logo@2x.png", 320, 100, 80],
    ].map(async ([filename, width, height, iconSize]) => {
      const icon = await sharp(svg).resize(iconSize, iconSize).png().toBuffer();
      await sharp({
        create: { width, height, channels: 4, background: BACKGROUND },
      })
        .composite([{ input: icon, gravity: "center" }])
        .png()
        .toFile(path.join(outDir, filename));
    }),
  );

  // Google Wallet logo — square, Google recommends a plain square mark
  // (it composites its own rounded-corner frame around it).
  await sharp(svg)
    .resize(300, 300)
    .png()
    .toFile(path.join(outDir, "google-logo.png"));

  console.log(`Wrote placeholder wallet images to ${outDir}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
