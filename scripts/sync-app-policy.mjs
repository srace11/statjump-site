// Builds src/generated/appPolicy.json from the app's privacyPolicy.ts (the single source).
// Override the path with APP_POLICY_SRC. If the app repo isn't there, the committed JSON is kept.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
const src = process.env.APP_POLICY_SRC ?? new URL('../../statjump-app/app/src/legal/privacyPolicy.ts', import.meta.url).pathname;
const out = new URL('../src/generated/appPolicy.json', import.meta.url);
if (!existsSync(src)) { console.warn(`sync-app-policy: ${src} not found, keeping committed JSON`); process.exit(0); }
// shortcut: strips TS by regex, so the file must stay a plain object literal; upgrade to a real parser if it grows types.
const js = readFileSync(src, 'utf8')
  .replace(/^import .*$/gm, '')
  .replace(/export const (\w+)(: \w+)? =/g, 'const $1 =')
  + '\nreturn privacyPolicy;';
const policy = new Function(js)();
if (!policy.sections?.length || /\[[A-Z][^\]]*\]/.test(JSON.stringify(policy))) throw new Error('app policy empty or has [placeholder] text');
writeFileSync(out, JSON.stringify(policy, null, 2) + '\n');
console.log(`sync-app-policy: ${policy.sections.length} sections, updated ${policy.updated}`);
