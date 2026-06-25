import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function readText(relativePath) {
  return readFileSync(resolve(repoRoot, relativePath), "utf8");
}

function readJson(relativePath) {
  return JSON.parse(readText(relativePath));
}

function exists(relativePath) {
  return existsSync(resolve(repoRoot, relativePath));
}

function isGitTracked(relativePath) {
  const result = spawnSync(
    "git",
    ["ls-files", "--error-unmatch", relativePath],
    {
      cwd: repoRoot,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    },
  );
  if (result.error) return null;
  return result.status === 0;
}

function hasAll(text, snippets) {
  return snippets.every((snippet) => text.includes(snippet));
}

function pagesProjectName(value, fallback) {
  return String(value || fallback || "").trim();
}

function envWasSet(name) {
  return (
    Object.prototype.hasOwnProperty.call(process.env, name) &&
    String(process.env[name] || "").trim() !== ""
  );
}

function validateProjectName(name, label, errors, warnings) {
  if (!name) {
    errors.push(`${label} is empty.`);
    return;
  }
  if (!/^[a-z0-9][a-z0-9-]{0,61}[a-z0-9]$|^[a-z0-9]$/i.test(name)) {
    errors.push(
      `${label} must be 1-63 characters and start/end with a letter or number.`,
    );
  }
  if (!/^[a-z0-9-]+$/.test(name)) {
    warnings.push(
      `${label} should use lowercase letters, numbers, and hyphens only for Cloudflare Pages compatibility: ${name}`,
    );
  }
}

const errors = [];
const warnings = [];
const checked = [];

const requiredFiles = [
  "package.json",
  "apps/admin/package.json",
  "apps/webmail/package.json",
  "apps/webmail/scripts/deploy-pages.mjs",
  "apps/webmail/scripts/check-functions-headers.mjs",
  "apps/webmail/scripts/check-share-cors.mjs",
  "apps/webmail/scripts/check-image-proxy.mjs",
  "apps/webmail/functions/_lib/runtime.ts",
  "apps/webmail/functions/api/runtime.ts",
  ".github/workflows/ci.yml",
  ".github/workflows/deploy-cloudflare-pages.yml",
  "scripts/check-change-baseline.mjs",
  "scripts/check-cloudflare-runtime.mjs",
  "apps/admin/wrangler.toml",
  "docs/DEPLOYMENT_QUICKSTART.md",
  "docs/CLOUDFLARE_PAGES.md",
  "docs/GITHUB_ACTIONS.md",
  "docs/OPERATIONS_RUNBOOK.md",
  "docs/CHANGE_BASELINE_PLAN.md",
  ".env.example",
  "apps/webmail/.dev.vars.example",
];

for (const file of requiredFiles) {
  if (exists(file)) checked.push(file);
  else errors.push(`Missing required Cloudflare preflight file: ${file}`);
}

const ciReferencedScriptFiles = [
  "apps/webmail/scripts/check-functions-headers.mjs",
  "apps/webmail/scripts/check-share-cors.mjs",
  "apps/webmail/scripts/check-image-proxy.mjs",
  "scripts/check-cloudflare-pages-preflight.mjs",
  "scripts/check-change-baseline.mjs",
  "scripts/check-cloudflare-runtime.mjs",
  "apps/webmail/functions/_lib/runtime.ts",
  "apps/webmail/functions/api/runtime.ts",
];

for (const file of ciReferencedScriptFiles) {
  if (!exists(file)) continue;
  const tracked = isGitTracked(file);
  if (tracked === false) {
    warnings.push(
      `${file} exists locally but is not tracked by Git yet. Include it in the next commit, otherwise GitHub Actions will not have this script.`,
    );
  } else if (tracked === null) {
    warnings.push(
      `Could not verify whether ${file} is tracked by Git; ensure CI-referenced scripts are committed.`,
    );
  }
}

if (exists("package.json")) {
  const rootPackage = readJson("package.json");
  const scripts = rootPackage.scripts || {};
  for (const [name, expected] of Object.entries({
    "build:admin": "npm --prefix apps/admin run build",
    "build:webmail": "npm --prefix apps/webmail run build",
    build: "npm run build:admin && npm run build:webmail",
  })) {
    if (scripts[name] !== expected)
      errors.push(`Root package script "${name}" should be "${expected}".`);
  }
  if (!scripts["check:cloudflare"])
    warnings.push(
      'Root package is missing "check:cloudflare"; add it to make preflight easy to run locally and in CI.',
    );
  if (scripts["check:baseline"] !== "node scripts/check-change-baseline.mjs") {
    warnings.push(
      'Root package should expose "check:baseline" as "node scripts/check-change-baseline.mjs" so mixed local changes can be grouped before release.',
    );
  }
  if (
    scripts["check:cloudflare:runtime"] !==
    "node scripts/check-cloudflare-runtime.mjs"
  ) {
    warnings.push(
      'Root package should expose "check:cloudflare:runtime" as "node scripts/check-cloudflare-runtime.mjs" for post-deploy runtime probes.',
    );
  }
}

if (exists(".gitignore")) {
  const gitignore = readText(".gitignore");
  if (!gitignore.includes(".dev.vars"))
    warnings.push(
      ".gitignore should ignore .dev.vars so local Cloudflare runtime secrets are not committed.",
    );
}

if (exists("apps/admin/package.json")) {
  const adminPackage = readJson("apps/admin/package.json");
  const scripts = adminPackage.scripts || {};
  for (const name of ["build", "lint", "smoke:local"]) {
    if (!scripts[name])
      errors.push(`apps/admin/package.json is missing script "${name}".`);
  }
}

if (exists("apps/webmail/package.json")) {
  const webmailPackage = readJson("apps/webmail/package.json");
  const scripts = webmailPackage.scripts || {};
  for (const name of [
    "build",
    "deploy",
    "check:functions:headers",
    "check:functions:cors",
    "check:functions:image",
    "smoke:local",
  ]) {
    if (!scripts[name])
      errors.push(`apps/webmail/package.json is missing script "${name}".`);
  }
  if (scripts.deploy && !scripts.deploy.includes("scripts/deploy-pages.mjs")) {
    errors.push(
      "apps/webmail deploy script should use scripts/deploy-pages.mjs so wrangler.toml handling stays consistent.",
    );
  }
}

if (exists("apps/webmail/scripts/deploy-pages.mjs")) {
  const deployScript = readText("apps/webmail/scripts/deploy-pages.mjs");
  if (
    !deployScript.includes(
      "WEBMAIL_PAGES_PROJECT_NAME || 'loven7-mail-webmail'",
    )
  ) {
    errors.push(
      "deploy-pages.mjs should default WEBMAIL_PAGES_PROJECT_NAME to loven7-mail-webmail.",
    );
  }
  if (
    !hasAll(deployScript, [
      "WEBMAIL_USE_LOCAL_WRANGLER_CONFIG",
      "wrangler.toml",
      "pages deploy dist",
      "--project-name",
      "--branch",
    ])
  ) {
    errors.push(
      "deploy-pages.mjs should preserve Pages runtime bindings by ignoring local wrangler.toml unless explicitly opted in.",
    );
  }
  if (!deployScript.includes("npx --yes wrangler@latest pages deploy")) {
    errors.push(
      "deploy-pages.mjs should use npx --yes wrangler@latest pages deploy for consistent non-interactive Wrangler behavior.",
    );
  }
}

for (const wranglerFile of [
  "apps/admin/wrangler.toml",
  "apps/webmail/wrangler.toml",
]) {
  if (!exists(wranglerFile)) continue;
  const wranglerText = readText(wranglerFile);
  const activeKvIds = [
    ...wranglerText.matchAll(/^\s*(?:id|preview_id)\s*=\s*["']([^"']+)["']/gm),
  ]
    .map((match) => match[1])
    .filter((value) => /^[a-f0-9]{32}$/i.test(value));
  if (activeKvIds.length) {
    errors.push(
      `${wranglerFile} contains real-looking KV Namespace IDs. Replace them with placeholders or keep the KV block commented before publishing.`,
    );
  }
}

if (exists(".github/workflows/deploy-cloudflare-pages.yml")) {
  const deployWorkflow = readText(
    ".github/workflows/deploy-cloudflare-pages.yml",
  );
  for (const snippet of [
    "ADMIN_PAGES_PROJECT_NAME",
    "WEBMAIL_PAGES_PROJECT_NAME",
    "CLOUDFLARE_API_TOKEN",
    "CLOUDFLARE_ACCOUNT_ID",
    "WEBMAIL_RUNTIME_URL",
    "Validate Cloudflare deploy configuration",
    'npx --yes wrangler@latest pages deploy dist --project-name "$ADMIN_PAGES_PROJECT_NAME"',
    "node scripts/deploy-pages.mjs",
    "npm run check:cloudflare:runtime",
    "npm run check:functions:headers",
    "npm run check:functions:cors",
    "npm run check:functions:image",
  ]) {
    if (!deployWorkflow.includes(snippet))
      errors.push(`Deploy workflow missing expected snippet: ${snippet}`);
  }
}

if (exists(".github/workflows/ci.yml")) {
  const ciWorkflow = readText(".github/workflows/ci.yml");
  for (const snippet of [
    "npm run lint",
    "npm run check:functions:headers",
    "npm run check:functions:cors",
    "npm run check:functions:image",
    "npm run build",
  ]) {
    if (!ciWorkflow.includes(snippet))
      errors.push(`CI workflow missing expected snippet: ${snippet}`);
  }
}

const envRequired = [
  "MAIL_WORKER_BASE_URL",
  "SITE_PASSWORD",
  "SHARE_ENCRYPTION_SECRET",
  "SHARE_ADMIN_CORS_ORIGINS",
  "SHARE_PUBLIC_CORS_ORIGINS",
];

for (const envFile of [".env.example", "apps/webmail/.dev.vars.example"]) {
  if (!exists(envFile)) continue;
  const envText = readText(envFile);
  for (const name of envRequired) {
    if (!envText.includes(name)) errors.push(`${envFile} missing ${name}.`);
  }
  if (/SHARE_ADMIN_CORS_ORIGINS=["']?\*["']?/.test(envText)) {
    errors.push(`${envFile} must not use wildcard SHARE_ADMIN_CORS_ORIGINS.`);
  }
}

for (const docFile of [
  "README.md",
  "docs/DEPLOYMENT_QUICKSTART.md",
  "docs/CLOUDFLARE_PAGES.md",
  "docs/GITHUB_ACTIONS.md",
  "apps/webmail/README.md",
]) {
  if (!exists(docFile)) continue;
  const text = readText(docFile);
  for (const snippet of [
    "SHARE_KV",
    "SHARE_ENCRYPTION_SECRET",
    "SHARE_ADMIN_CORS_ORIGINS",
    "MAIL_WORKER_BASE_URL",
  ]) {
    if (!text.includes(snippet))
      errors.push(`${docFile} should mention ${snippet}.`);
  }
}

for (const docFile of ["README.md", "docs/CLOUDFLARE_PAGES.md"]) {
  if (!exists(docFile)) continue;
  const text = readText(docFile);
  for (const snippet of [
    "Preview",
    "Production",
    "WEBMAIL_PREVIEW_RUNTIME_CONFIRMED",
  ]) {
    if (!text.includes(snippet))
      warnings.push(
        `${docFile} should mention ${snippet} so preview deployments do not silently miss runtime bindings.`,
      );
  }
  if (!text.includes("check:cloudflare:runtime")) {
    warnings.push(
      `${docFile} should mention npm run check:cloudflare:runtime so deployed Pages runtime can be probed without reading secrets.`,
    );
  }
  if (!text.includes("/api/runtime")) {
    warnings.push(
      `${docFile} should mention /api/runtime so deployed Pages runtime diagnostics are easy to verify without reading secrets.`,
    );
  }
  if (!/ADMIN_PAGES_PROJECT_NAME|WEBMAIL_PAGES_PROJECT_NAME/.test(text)) {
    warnings.push(
      `${docFile} should explain setting ADMIN_PAGES_PROJECT_NAME and WEBMAIL_PAGES_PROJECT_NAME when reusing existing Cloudflare Pages projects.`,
    );
  }
}

if (exists("docs/OPERATIONS_RUNBOOK.md")) {
  const runbook = readText("docs/OPERATIONS_RUNBOOK.md");
  for (const snippet of [
    "loven7-mail-pwa",
    "cloudmail-webmail",
    "https://mail.loven7.cc.cd",
    "https://email.loven.qzz.io",
    "WEBMAIL_RUNTIME_URL",
    "npm run check:cloudflare:runtime",
    "Rollback to this deployment",
  ]) {
    if (!runbook.includes(snippet))
      warnings.push(`docs/OPERATIONS_RUNBOOK.md should mention ${snippet}.`);
  }
}

const adminProjectName = pagesProjectName(
  process.env.ADMIN_PAGES_PROJECT_NAME,
  "loven7-mail-admin",
);
const webmailProjectName = pagesProjectName(
  process.env.WEBMAIL_PAGES_PROJECT_NAME,
  "loven7-mail-webmail",
);
validateProjectName(
  adminProjectName,
  "ADMIN_PAGES_PROJECT_NAME",
  errors,
  warnings,
);
validateProjectName(
  webmailProjectName,
  "WEBMAIL_PAGES_PROJECT_NAME",
  errors,
  warnings,
);

if (!envWasSet("ADMIN_PAGES_PROJECT_NAME")) {
  warnings.push(
    "ADMIN_PAGES_PROJECT_NAME is not set; using the documentation default loven7-mail-admin. If you are reusing an existing Cloudflare Pages project, set ADMIN_PAGES_PROJECT_NAME explicitly before deploy.",
  );
}
if (!envWasSet("WEBMAIL_PAGES_PROJECT_NAME")) {
  warnings.push(
    "WEBMAIL_PAGES_PROJECT_NAME is not set; using the documentation default loven7-mail-webmail. If you are reusing an existing Cloudflare Pages project, set WEBMAIL_PAGES_PROJECT_NAME explicitly before deploy.",
  );
}

const branch = String(
  process.env.CF_PAGES_BRANCH || process.env.GITHUB_REF_NAME || "main",
).trim();
if (!/^[a-z0-9._/-]+$/i.test(branch))
  errors.push(
    `CF_PAGES_BRANCH/GITHUB_REF_NAME contains unsupported characters: ${branch}`,
  );
const isPreviewBranch = branch !== "main" && branch !== "production";

if (isPreviewBranch) {
  warnings.push(
    `CF_PAGES_BRANCH/GITHUB_REF_NAME is "${branch}". Cloudflare Pages preview deployments use independent preview runtime variables, secrets, and KV bindings; production MAIL_WORKER_BASE_URL, SHARE_ENCRYPTION_SECRET, and SHARE_KV do not automatically prove preview is configured.`,
  );
  if (process.env.WEBMAIL_PREVIEW_RUNTIME_CONFIRMED !== "1") {
    warnings.push(
      "Set WEBMAIL_PREVIEW_RUNTIME_CONFIRMED=1 only after confirming the Webmail preview environment has MAIL_WORKER_BASE_URL, optional SITE_PASSWORD, SHARE_ENCRYPTION_SECRET, SHARE_ADMIN_CORS_ORIGINS, and SHARE_KV binding configured.",
    );
  }
}

if (!process.env.CLOUDFLARE_API_TOKEN)
  warnings.push(
    "CLOUDFLARE_API_TOKEN is not set; local preflight can pass, but deploy will be skipped/fail until Cloudflare auth is configured.",
  );
if (!process.env.CLOUDFLARE_ACCOUNT_ID)
  warnings.push(
    "CLOUDFLARE_ACCOUNT_ID is not set; local preflight can pass, but deploy will be skipped/fail until Cloudflare account id is configured.",
  );
if (!exists("apps/admin/dist"))
  warnings.push(
    "apps/admin/dist does not exist yet; run npm --prefix apps/admin run build before manual Pages deploy.",
  );
if (!exists("apps/webmail/dist"))
  warnings.push(
    "apps/webmail/dist does not exist yet; run npm --prefix apps/webmail run build before manual Pages deploy.",
  );
if (exists("apps/webmail/wrangler.toml"))
  warnings.push(
    "apps/webmail/wrangler.toml exists; deploy-pages.mjs intentionally ignores it by default so Cloudflare Pages project bindings are preserved.",
  );

const result = {
  ok: errors.length === 0,
  checked,
  projects: {
    admin: adminProjectName,
    adminSource: envWasSet("ADMIN_PAGES_PROJECT_NAME") ? "env" : "default",
    webmail: webmailProjectName,
    webmailSource: envWasSet("WEBMAIL_PAGES_PROJECT_NAME") ? "env" : "default",
    branch,
    environment: isPreviewBranch ? "preview" : "production",
  },
  knownProductionProjects: {
    admin: "loven7-mail-pwa",
    webmail: "cloudmail-webmail",
    webmailRuntimeUrl: "https://email.loven.qzz.io",
  },
  requiredWebmailRuntime: [
    "MAIL_WORKER_BASE_URL",
    "SHARE_ENCRYPTION_SECRET",
    "SHARE_ADMIN_CORS_ORIGINS when Admin/Webmail are different origins",
    "SHARE_KV binding",
  ],
  previewRuntimeChecklist: isPreviewBranch
    ? [
        "Cloudflare Pages → Webmail project → Settings → Variables and Secrets → Preview: MAIL_WORKER_BASE_URL",
        "Cloudflare Pages → Webmail project → Settings → Variables and Secrets → Preview: SITE_PASSWORD when the upstream Worker requires it",
        "Cloudflare Pages → Webmail project → Settings → Variables and Secrets → Preview: SHARE_ENCRYPTION_SECRET",
        "Cloudflare Pages → Webmail project → Settings → Variables and Secrets → Preview: SHARE_ADMIN_CORS_ORIGINS when Admin/Webmail are different origins",
        "Cloudflare Pages → Webmail project → Settings → Bindings → Preview: KV namespace binding named SHARE_KV",
        "After changing preview runtime settings, redeploy the preview branch and probe /api/runtime first; fallback probes use /api/share/<missing-token> plus /api/session.",
      ]
    : [],
  warnings,
  errors,
};

console.log(JSON.stringify(result, null, 2));

if (errors.length) process.exit(1);
