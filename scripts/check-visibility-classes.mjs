// Fails when a string literal in core-ui's source shows or hides an element by screen width with a
// Tailwind display class. Such classes lose to a host app's own Tailwind build, which can emit
// .hidden / .flex / .block after core-ui's CSS. Use the solid-hide-* classes in solid-responsive.css.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', 'src');
const DISPLAY = 'hidden|flex|block|inline-flex|inline-block|grid|inline|table|contents';
const RESPONSIVE_DISPLAY = new RegExp(`(?<![\\w-])(?:sm|md|lg|xl|max-\\[\\d+px\\]):(?:${DISPLAY})(?![\\w-])`);
const BASE_HIDDEN = /(?<![\w:\[-])hidden(?![\w-])/;
const RESPONSIVE_HIDDEN = /(?<![\w-])(?:sm|md|lg|xl|max-\[\d+px\]):hidden(?![\w-])/;
const STRING = /"([^"\n]*)"|'([^'\n]*)'|`([^`]*)`/g;

function* files(dir) {
  for (const name of readdirSync(dir)) {
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) yield* files(full);
    else if (/\.(ts|tsx)$/.test(name)) yield full;
  }
}

export function findViolations(text) {
  const hits = [];
  for (const match of text.matchAll(STRING)) {
    const value = match[1] ?? match[2] ?? match[3] ?? '';
    if (!RESPONSIVE_DISPLAY.test(value)) continue;
    if (!BASE_HIDDEN.test(value) && !RESPONSIVE_HIDDEN.test(value)) continue;
    const line = text.slice(0, match.index).split('\n').length;
    hits.push({ line, value });
  }
  return hits;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  let count = 0;
  for (const file of files(ROOT)) {
    for (const hit of findViolations(readFileSync(file, 'utf8'))) {
      count += 1;
      console.log(`${path.relative(process.cwd(), file)}:${hit.line}: ${hit.value}`);
    }
  }
  if (count > 0) {
    console.error(`\n${count} string(s) show or hide by width with Tailwind display classes.`);
    console.error('Use solid-hide-below-<bp> / solid-hide-from-<bp> from src/resources/solid-responsive.css instead.');
    process.exit(1);
  }
  console.log('Visibility classes: ok.');
}
