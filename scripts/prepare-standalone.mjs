import { cpSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";

const root = process.cwd();
const copies = [
  [join(root, "public"), join(root, ".next", "standalone", "public")],
  [join(root, ".next", "static"), join(root, ".next", "standalone", ".next", "static")],
];

for (const [source, destination] of copies) {
  mkdirSync(dirname(destination), { recursive: true });
  cpSync(source, destination, { recursive: true });
}
