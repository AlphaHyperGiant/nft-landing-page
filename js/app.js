/**
 * APK Marketplace (static, no backend)
 *
 * Notes:
 * - iOS cannot install APKs. Provide Share/Copy flows for iPhone users.
 * - Replace sample data with your real catalog + download URLs.
 */

const CATALOG = [
  {
    id: "aurora-notes",
    name: "Aurora Notes",
    developer: "Aurora Labs",
    category: "Productivity",
    rating: 4.6,
    downloads: "500K+",
    size: "18 MB",
    version: "2.4.1",
    updated: "2025-11-18",
    tags: ["notes", "markdown", "offline"],
    description:
      "Fast, offline-first notes with tags, markdown, and end-to-end encrypted sync (optional).",
    downloadUrl: "https://example.com/apks/aurora-notes.apk",
  },
  {
    id: "pixel-vpn",
    name: "Pixel VPN",
    developer: "PixelNet",
    category: "Tools",
    rating: 4.3,
    downloads: "1M+",
    size: "26 MB",
    version: "5.1.0",
    updated: "2025-10-04",
    tags: ["vpn", "privacy", "security"],
    description:
      "One-tap VPN with server selection, split tunneling, and a lightweight UI.",
    downloadUrl: "https://example.com/apks/pixel-vpn.apk",
  },
  {
    id: "skyline-camera",
    name: "Skyline Camera",
    developer: "Skyline Studio",
    category: "Photography",
    rating: 4.4,
    downloads: "250K+",
    size: "41 MB",
    version: "1.9.3",
    updated: "2025-12-02",
    tags: ["camera", "filters", "portrait"],
    description:
      "Pro controls, film-like filters, and export presets for social media.",
    downloadUrl: "https://example.com/apks/skyline-camera.apk",
  },
  {
    id: "orbit-music",
    name: "Orbit Music",
    developer: "Orbit Audio",
    category: "Music & Audio",
    rating: 4.2,
    downloads: "2M+",
    size: "33 MB",
    version: "7.0.2",
    updated: "2025-08-21",
    tags: ["music", "equalizer", "playlists"],
    description:
      "Music player with smart playlists, 10-band EQ, and offline library management.",
    downloadUrl: "https://example.com/apks/orbit-music.apk",
  },
  {
    id: "cipher-auth",
    name: "Cipher Auth",
    developer: "CipherWorks",
    category: "Security",
    rating: 4.7,
    downloads: "800K+",
    size: "12 MB",
    version: "3.2.0",
    updated: "2025-09-30",
    tags: ["2fa", "totp", "security"],
    description:
      "TOTP authenticator with encrypted backups, export, and biometric lock support.",
    downloadUrl: "https://example.com/apks/cipher-auth.apk",
  },
  {
    id: "zen-reader",
    name: "Zen Reader",
    developer: "Zenware",
    category: "Books & Reference",
    rating: 4.5,
    downloads: "600K+",
    size: "24 MB",
    version: "4.0.6",
    updated: "2025-11-02",
    tags: ["epub", "pdf", "reader"],
    description:
      "EPUB/PDF reader with themes, highlighting, and cross-device reading positions.",
    downloadUrl: "https://example.com/apks/zen-reader.apk",
  },
  {
    id: "puzzle-bloom",
    name: "Puzzle Bloom",
    developer: "Bloom Games",
    category: "Games",
    rating: 4.1,
    downloads: "5M+",
    size: "77 MB",
    version: "9.3.1",
    updated: "2025-12-20",
    tags: ["puzzle", "casual", "offline"],
    description:
      "Relaxing puzzle levels with daily challenges and offline play support.",
    downloadUrl: "https://example.com/apks/puzzle-bloom.apk",
  },
  {
    id: "fit-trail",
    name: "FitTrail",
    developer: "Trail Health",
    category: "Health & Fitness",
    rating: 4.0,
    downloads: "900K+",
    size: "29 MB",
    version: "6.8.4",
    updated: "2025-07-12",
    tags: ["fitness", "tracking", "workouts"],
    description:
      "Workout plans, habit tracking, and progress charts with offline mode.",
    downloadUrl: "https://example.com/apks/fit-trail.apk",
  },
  {
    id: "quickscan",
    name: "QuickScan",
    developer: "Utility Kit",
    category: "Tools",
    rating: 4.5,
    downloads: "10M+",
    size: "9 MB",
    version: "8.1.7",
    updated: "2025-12-08",
    tags: ["qr", "scanner", "tools"],
    description:
      "QR/Barcode scanner with history, export, and safe-link previews.",
    downloadUrl: "https://example.com/apks/quickscan.apk",
  },
  {
    id: "study-spark",
    name: "Study Spark",
    developer: "Spark EDU",
    category: "Education",
    rating: 4.3,
    downloads: "1M+",
    size: "54 MB",
    version: "2.2.9",
    updated: "2025-10-29",
    tags: ["flashcards", "study", "spaced repetition"],
    description:
      "Flashcards with spaced repetition, streaks, and offline decks.",
    downloadUrl: "https://example.com/apks/study-spark.apk",
  },
  {
    id: "taskline",
    name: "Taskline",
    developer: "Taskline Inc.",
    category: "Productivity",
    rating: 4.2,
    downloads: "300K+",
    size: "22 MB",
    version: "1.6.0",
    updated: "2025-06-14",
    tags: ["tasks", "kanban", "reminders"],
    description:
      "Tasks and lightweight kanban boards with reminders and quick capture.",
    downloadUrl: "https://example.com/apks/taskline.apk",
  },
  {
    id: "hush-chat",
    name: "Hush Chat",
    developer: "Hush Technologies",
    category: "Social",
    rating: 4.1,
    downloads: "700K+",
    size: "38 MB",
    version: "3.9.8",
    updated: "2025-11-25",
    tags: ["chat", "groups", "privacy"],
    description:
      "Simple chat with groups, media sharing, and privacy-focused settings.",
    downloadUrl: "https://example.com/apks/hush-chat.apk",
  },
];

const FEATURED_IDS = new Set(["aurora-notes", "quickscan", "cipher-auth", "puzzle-bloom"]);

function $(sel) {
  return document.querySelector(sel);
}

function formatDate(iso) {
  const d = new Date(iso + "T00:00:00Z");
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "2-digit" });
}

function appInitials(name) {
  return (name || "?")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
}

function normalize(str) {
  return String(str || "").toLowerCase().trim();
}

function matches(app, query) {
  if (!query) return true;
  const q = normalize(query);
  const hay = [
    app.name,
    app.developer,
    app.category,
    app.description,
    ...(app.tags || []),
  ]
    .map(normalize)
    .join(" ");
  return hay.includes(q);
}

function sortApps(apps, sortKey) {
  const copy = [...apps];
  if (sortKey === "name_asc") {
    copy.sort((a, b) => a.name.localeCompare(b.name));
    return copy;
  }
  if (sortKey === "rating_desc") {
    copy.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    return copy;
  }
  if (sortKey === "updated_desc") {
    copy.sort((a, b) => new Date(b.updated).getTime() - new Date(a.updated).getTime());
    return copy;
  }
  // featured
  copy.sort((a, b) => {
    const af = FEATURED_IDS.has(a.id) ? 1 : 0;
    const bf = FEATURED_IDS.has(b.id) ? 1 : 0;
    if (af !== bf) return bf - af;
    const br = b.rating || 0;
    const ar = a.rating || 0;
    if (br !== ar) return br - ar;
    return new Date(b.updated).getTime() - new Date(a.updated).getTime();
  });
  return copy;
}

function buildCategories(apps) {
  const set = new Set(apps.map((a) => a.category).filter(Boolean));
  return [...set].sort((a, b) => a.localeCompare(b));
}

function clearNode(node) {
  while (node.firstChild) node.removeChild(node.firstChild);
}

function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (k === "class") node.className = v;
    else if (k === "text") node.textContent = v;
    else if (k.startsWith("data-")) node.setAttribute(k, v);
    else if (k === "html") node.innerHTML = v;
    else node.setAttribute(k, v);
  }
  for (const child of children) node.appendChild(child);
  return node;
}

function renderCategorySelect(categories) {
  const select = $("#categorySelect");
  for (const c of categories) {
    select.appendChild(el("option", { value: c, text: c }));
  }
}

function renderCategoryChips(categories, activeCategory) {
  const root = $("#categoryChips");
  clearNode(root);
  const items = ["all", ...categories];
  for (const c of items) {
    const label = c === "all" ? "All" : c;
    const btn = el("button", {
      class: "chip",
      type: "button",
      "aria-pressed": String(c === activeCategory),
      "data-category": c,
      text: label,
    });
    btn.addEventListener("click", () => {
      $("#categorySelect").value = c;
      update();
    });
    root.appendChild(btn);
  }
}

function renderGrid(apps) {
  const grid = $("#appGrid");
  clearNode(grid);

  if (apps.length === 0) {
    grid.appendChild(
      el("div", { class: "card" }, [
        el("div", { class: "card__title", text: "No results" }),
        el("div", {
          class: "card__desc",
          text: "Try a different search term or category.",
        }),
      ])
    );
    return;
  }

  for (const app of apps) {
    const featured = FEATURED_IDS.has(app.id);
    const card = el("article", { class: "card" });

    const top = el("div", { class: "card__top" });
    top.appendChild(el("div", { class: "avatar", text: appInitials(app.name), "aria-hidden": "true" }));

    const titleWrap = el("div");
    titleWrap.appendChild(el("div", { class: "card__title", text: app.name }));
    titleWrap.appendChild(el("div", { class: "card__dev", text: app.developer }));
    top.appendChild(titleWrap);

    top.appendChild(el("div", { class: "badge", text: featured ? "Featured" : app.category }));
    card.appendChild(top);

    card.appendChild(el("p", { class: "card__desc", text: app.description }));

    const meta = el("div", { class: "card__meta" });
    meta.appendChild(el("span", { class: "pill", text: `⭐ ${app.rating.toFixed(1)}` }));
    meta.appendChild(el("span", { class: "pill", text: `⬇ ${app.downloads}` }));
    meta.appendChild(el("span", { class: "pill", text: `v${app.version}` }));
    meta.appendChild(el("span", { class: "pill", text: `Updated ${formatDate(app.updated)}` }));
    card.appendChild(meta);

    const actions = el("div", { class: "actions" });
    const viewBtn = el("button", { class: "btn btn--primary", type: "button", text: "View details" });
    viewBtn.addEventListener("click", () => openModal(app));
    const copyBtn = el("button", { class: "btn", type: "button", text: "Copy link" });
    copyBtn.addEventListener("click", () => copyToClipboard(app.downloadUrl));
    actions.appendChild(viewBtn);
    actions.appendChild(copyBtn);

    card.appendChild(actions);

    // Make card tappable
    card.addEventListener("click", (e) => {
      const t = e.target;
      if (t && (t.tagName === "BUTTON" || t.closest("button"))) return;
      openModal(app);
    });

    grid.appendChild(card);
  }
}

function setResultsMeta(visibleCount, totalCount) {
  const meta = $("#resultsMeta");
  meta.textContent = `${visibleCount} of ${totalCount} apps`;
}

async function copyToClipboard(text) {
  const url = String(text || "");
  if (!url) return;
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(url);
      showToast(`Copied link: ${url}`);
      return;
    }
    // Fallback
    window.prompt("Copy link:", url);
  } catch {
    window.prompt("Copy link:", url);
  }
}

async function shareLink(app) {
  const url = String(app.downloadUrl || "");
  if (!url) return;
  if (!navigator.share) {
    await copyToClipboard(url);
    return;
  }
  try {
    await navigator.share({
      title: app.name,
      text: `Download ${app.name} (APK)`,
      url,
    });
  } catch {
    // user cancelled or share failed; no-op
  }
}

function openInNewTab(url) {
  if (!url) return;
  window.open(url, "_blank", "noopener,noreferrer");
}

function showToast(message) {
  const toast = $("#modalBody")?.querySelector?.("[data-toast]") || null;
  if (!toast) return;
  toast.textContent = message;
  toast.setAttribute("data-show", "true");
  window.setTimeout(() => toast.setAttribute("data-show", "false"), 2200);
}

function openModal(app) {
  const modal = $("#modalRoot");
  const body = $("#modalBody");
  clearNode(body);

  const header = el("div");
  header.appendChild(el("h3", { id: "modalTitle", class: "modal__title", text: app.name }));
  header.appendChild(
    el("p", {
      class: "modal__sub",
      text: `${app.developer} • ${app.category} • ⭐ ${app.rating.toFixed(1)}`,
    })
  );

  body.appendChild(header);

  const kvs = el("div", { class: "kvs" });
  kvs.appendChild(el("div", { class: "kv" }, [el("div", { class: "kv__k", text: "Version" }), el("div", { class: "kv__v", text: `v${app.version}` })]));
  kvs.appendChild(el("div", { class: "kv" }, [el("div", { class: "kv__k", text: "Updated" }), el("div", { class: "kv__v", text: formatDate(app.updated) })]));
  kvs.appendChild(el("div", { class: "kv" }, [el("div", { class: "kv__k", text: "Size" }), el("div", { class: "kv__v", text: app.size })]));
  kvs.appendChild(el("div", { class: "kv" }, [el("div", { class: "kv__k", text: "Downloads" }), el("div", { class: "kv__v", text: app.downloads })]));
  body.appendChild(kvs);

  body.appendChild(el("div", { class: "divider" }));
  body.appendChild(el("p", { class: "small", text: app.description }));

  if (app.tags && app.tags.length) {
    const tagsWrap = el("div", { class: "card__meta" });
    for (const t of app.tags) tagsWrap.appendChild(el("span", { class: "pill", text: `#${t}` }));
    body.appendChild(tagsWrap);
  }

  body.appendChild(el("div", { class: "divider" }));

  body.appendChild(
    el("div", { class: "notice notice--warning", role: "note" }, [
      el("div", {
        text:
          "iPhone/iPad can’t install APKs. Use Share/Copy to send this link to an Android device.",
      }),
    ])
  );

  const actions = el("div", { class: "actions" });
  const downloadBtn = el("button", { class: "btn btn--primary", type: "button", text: "Open download" });
  downloadBtn.addEventListener("click", () => openInNewTab(app.downloadUrl));
  const shareBtn = el("button", { class: "btn", type: "button", text: "Share" });
  shareBtn.addEventListener("click", () => shareLink(app));
  const copyBtn = el("button", { class: "btn", type: "button", text: "Copy link" });
  copyBtn.addEventListener("click", () => copyToClipboard(app.downloadUrl));
  actions.appendChild(downloadBtn);
  actions.appendChild(shareBtn);
  actions.appendChild(copyBtn);
  body.appendChild(actions);

  body.appendChild(el("div", { class: "toast", "data-toast": "true", role: "status", "aria-live": "polite" }));

  modal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
}

function closeModal() {
  const modal = $("#modalRoot");
  modal.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
}

function wireModal() {
  const modal = $("#modalRoot");
  modal.addEventListener("click", (e) => {
    const t = e.target;
    if (!t) return;
    if (t.matches("[data-close-modal]") || t.closest("[data-close-modal]")) closeModal();
  });
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal.getAttribute("aria-hidden") === "false") closeModal();
  });
}

function update() {
  const q = $("#searchInput").value;
  const category = $("#categorySelect").value;
  const sortKey = $("#sortSelect").value;

  const categories = buildCategories(CATALOG);
  renderCategoryChips(categories, category);

  let apps = CATALOG.filter((a) => matches(a, q));
  if (category && category !== "all") apps = apps.filter((a) => a.category === category);
  apps = sortApps(apps, sortKey);

  renderGrid(apps);
  setResultsMeta(apps.length, CATALOG.length);
}

window.addEventListener("DOMContentLoaded", () => {
  const categories = buildCategories(CATALOG);
  renderCategorySelect(categories);
  renderCategoryChips(categories, "all");
  wireModal();

  $("#searchInput").addEventListener("input", update);
  $("#categorySelect").addEventListener("change", update);
  $("#sortSelect").addEventListener("change", update);

  update();
});