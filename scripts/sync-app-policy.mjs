// Builds src/generated/appPolicy.json and appTerms.json from the app's privacyPolicy.ts and terms.ts (the single sources).
// Override the paths with APP_POLICY_SRC / APP_TERMS_SRC. If a source isn't there, the committed JSON is kept.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
const legal = (f) => new URL(`../../statjump-app/app/src/legal/${f}`, import.meta.url).pathname;
for (const [src, outName, name] of [
  [process.env.APP_POLICY_SRC ?? legal('privacyPolicy.ts'), 'appPolicy.json', 'privacyPolicy'],
  [process.env.APP_TERMS_SRC ?? legal('terms.ts'), 'appTerms.json', 'terms'],
]) {
  if (!existsSync(src)) { console.warn(`sync-app-policy: ${src} not found, keeping committed JSON`); continue; }
  // shortcut: strips TS by regex, so the file must stay a plain object literal; upgrade to a real parser if it grows types.
  const js = readFileSync(src, 'utf8')
    .replace(/^import .*$/gm, '')
    .replace(/export const (\w+)(: \w+)? =/g, 'const $1 =')
    + `\nreturn ${name};`;
  const doc = new Function(js)();
  if (!doc.sections?.length || doc.draftNotice || /\[[A-Z][^\]]*\]/.test(JSON.stringify(doc))) throw new Error(`${name} empty, draft, or has [placeholder] text`);
  writeFileSync(new URL(`../src/generated/${outName}`, import.meta.url), JSON.stringify(doc, null, 2) + '\n');
  console.log(`sync-app-policy: ${name} ${doc.sections.length} sections, updated ${doc.updated}`);
}
