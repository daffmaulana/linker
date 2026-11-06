import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "./supabase-config.js";

const profile = {
  name: "Daffa",
  bio: "Kreator digital yang suka berbagi hal-hal menarik.",
  initials: "D",
};

const profileName = document.querySelector("#profile-name");
const profileBio = document.querySelector("#profile-bio");
const avatar = document.querySelector("#avatar");
const linkList = document.querySelector("#link-list");
const socialLinks = document.querySelector("#social-links");
const linkSearch = document.querySelector("#link-search");
const adminPanel = document.querySelector("#admin-panel");
const adminNotice = document.querySelector("#admin-notice");
const loginView = document.querySelector("#login-view");
const managerView = document.querySelector("#manager-view");
const loginForm = document.querySelector("#login-form");
const linkForm = document.querySelector("#link-form");
const manageList = document.querySelector("#manage-list");
const saveButton = document.querySelector("#save-link");
const cancelEditButton = document.querySelector("#cancel-edit");

document.title = adminPanel
  ? `Kelola Tautan — ${profile.name}`
  : `${profile.name} — Semua Tautan`;
if (profileName) profileName.textContent = profile.name;
if (profileBio) profileBio.textContent = profile.bio;
if (avatar) avatar.textContent = profile.initials;

const isConfigured =
  SUPABASE_URL.startsWith("https://") &&
  !SUPABASE_URL.includes("GANTI_") &&
  SUPABASE_ANON_KEY.length > 20 &&
  !SUPABASE_ANON_KEY.includes("GANTI_");

let supabase;
let savedLinks = [];
const iconFallbacks = {
  favicon: "◉",
  instagram: "◎",
  youtube: "▶",
  tiktok: "♪",
  linkedin: "in",
  github: "◈",
  email: "✉",
  globe: "◉",
  symbol: "↗",
  custom: "↗",
};

function showNotice(message, isError = false) {
  adminNotice.textContent = message;
  adminNotice.classList.toggle("notice-error", isError);
  adminNotice.hidden = false;
}

async function moveLink(link, offset) {
  const currentIndex = savedLinks.findIndex((item) => item.id === link.id);
  const targetIndex = currentIndex + offset;
  if (currentIndex < 0 || targetIndex < 0 || targetIndex >= savedLinks.length) return;

  const reorderedLinks = [...savedLinks];
  const [movedLink] = reorderedLinks.splice(currentIndex, 1);
  reorderedLinks.splice(targetIndex, 0, movedLink);

  for (const [position, item] of reorderedLinks.entries()) {
    const { error } = await supabase
      .from("links")
      .update({ position })
      .eq("id", item.id);
    if (error) {
      showNotice(`Urutan tautan gagal disimpan: ${error.message}`, true);
      await loadLinks();
      return;
    }
  }

  savedLinks = reorderedLinks.map((item, position) => ({ ...item, position }));
  renderLinks(savedLinks, linkSearch?.value || "");
  renderManager();
}

function createLinkAnchor(link, isSocial = false) {
  const anchor = document.createElement("a");
  anchor.className = isSocial
    ? "social-link"
    : `link-card${link.featured ? " link-card-featured" : ""}`;
  anchor.href = link.url;
  if (link.url.startsWith("http://") || link.url.startsWith("https://")) {
    anchor.target = "_blank";
    anchor.rel = "noopener noreferrer";
  }
  anchor.setAttribute("aria-label", `${link.title}: ${link.description || link.url}`);
  anchor.title = link.title;

  const icon = document.createElement("span");
  icon.className = isSocial ? "social-icon" : "link-icon";
  icon.setAttribute("aria-hidden", "true");
  const iconSource = link.icon_source || "symbol";
  const fallback = iconSource === "symbol" ? link.icon || "↗" : iconFallbacks[iconSource] || "↗";
  const imageUrls = getIconImageUrls(link);

  if (imageUrls.length > 0) {
    const image = document.createElement("img");
    image.className = "link-icon-image";
    image.alt = "";
    image.loading = "lazy";
    icon.append(image);
    let imageIndex = 0;
    image.addEventListener("error", () => {
      imageIndex += 1;
      if (imageIndex < imageUrls.length) {
        image.src = imageUrls[imageIndex];
      } else {
        icon.textContent = fallback;
        image.remove();
      }
    });
    image.src = imageUrls[imageIndex];
  } else {
    icon.textContent = fallback;
  }

  if (isSocial) {
    anchor.append(icon);
    return anchor;
  }

  function getIconImageUrls(link) {
    if (link.icon_source === "custom" && link.icon_url) return [link.icon_url];
    if (link.icon_source !== "favicon") return [];

    try {
      const target = new URL(link.url);
      if (target.protocol === "http:" || target.protocol === "https:") {
        return [
          `https://icon.horse/icon/${encodeURIComponent(target.hostname)}`,
          new URL("/favicon.ico", target.origin).href,
        ];
      }
    } catch {
      return [];
    }
    return [];
  }

  const copy = document.createElement("span");
  copy.className = "link-copy";
  const title = document.createElement("span");
  title.className = "link-title";
  title.textContent = link.title;
  const description = document.createElement("span");
  description.className = "link-description";
  description.textContent = link.description || "";
  copy.append(title, description);

  const arrow = document.createElement("span");
  arrow.className = "link-arrow";
  arrow.setAttribute("aria-hidden", "true");
  arrow.textContent = "↗";
  anchor.append(icon, copy, arrow);
  return anchor;
}

function renderLinks(links, searchTerm = "") {
  if (!linkList && !socialLinks) return;
  const normalizedSearch = searchTerm.trim().toLocaleLowerCase();
  const filteredLinks = links.filter((link) =>
    [
      link.title,
      link.description,
      link.url,
      link.group_name,
    ].some((value) => String(value || "").toLocaleLowerCase().includes(normalizedSearch)),
  );
  const socialItems = filteredLinks.filter((link) => link.is_social);
  const regularItems = filteredLinks.filter((link) => !link.is_social);

  if (socialLinks) {
    socialLinks.replaceChildren(
      ...socialItems.map((link) => createLinkAnchor(link, true)),
    );
    socialLinks.hidden = socialItems.length === 0;
  }

  if (!linkList) return;
  linkList.replaceChildren();

  if (filteredLinks.length === 0) {
    const empty = document.createElement("p");
    empty.className = "empty-state";
    empty.textContent = normalizedSearch
      ? `Tidak ada tautan yang cocok dengan "${searchTerm.trim()}".`
      : "Belum ada tautan. Silakan kembali lagi nanti.";
    linkList.append(empty);
    return;
  }
  if (regularItems.length === 0) return;

  const groups = new Map();
  for (const link of regularItems) {
    const groupName = link.group_name.trim() || "Lainnya";
    if (!groups.has(groupName)) groups.set(groupName, []);
    groups.get(groupName).push(link);
  }

  for (const [groupName, groupLinks] of groups) {
    const group = document.createElement("section");
    group.className = "link-group";
    const heading = document.createElement("h3");
    heading.className = "link-group-heading";
    heading.textContent = groupName;
    group.append(heading);

    const groupList = document.createElement("div");
    groupList.className = "link-group-list";
    for (const link of groupLinks) {
      groupList.append(createLinkAnchor(link));
    }
    group.append(groupList);
    linkList.append(group);
  }
}

function resetLinkForm() {
  linkForm.reset();
  linkForm.elements.id.value = "";
  linkForm.elements.icon.value = "↗";
  linkForm.elements.icon_source.value = "favicon";
  linkForm.elements.icon_url.value = "";
  linkForm.elements.group_name.value = "";
  linkForm.elements.is_social.checked = false;
  updateIconFields();
  saveButton.textContent = "Tambah tautan";
  cancelEditButton.hidden = true;
}

function renderManager() {
  manageList.replaceChildren();

  if (savedLinks.length === 0) {
    const empty = document.createElement("p");
    empty.className = "empty-state";
    empty.textContent = "Belum ada tautan tersimpan.";
    manageList.append(empty);
    return;
  }

  for (const link of savedLinks) {
    const item = document.createElement("div");
    item.className = "manage-item";

    const details = document.createElement("div");
    details.className = "manage-copy";
    const title = document.createElement("strong");
    title.textContent = `${link.icon || "↗"} ${link.title}`;
    const url = document.createElement("span");
    const groupLabel = link.group_name || "Lainnya";
    const orderLabel = savedLinks.indexOf(link) + 1;
    url.textContent = `${orderLabel}. ${link.is_social ? "◉ Sosial · " : ""}${groupLabel} · ${link.url}`;
    details.append(title, url);

    const actions = document.createElement("div");
    actions.className = "manage-actions";

    const editButton = document.createElement("button");
    editButton.className = "text-button";
    editButton.type = "button";
    editButton.textContent = "Edit";
    editButton.addEventListener("click", () => {
      linkForm.elements.id.value = link.id;
      linkForm.elements.title.value = link.title;
      linkForm.elements.url.value = link.url;
      linkForm.elements.description.value = link.description || "";
      linkForm.elements.icon.value = link.icon || "↗";
      linkForm.elements.icon_source.value = link.icon_source || "symbol";
      linkForm.elements.icon_url.value = link.icon_url || "";
      updateIconFields();
      linkForm.elements.group_name.value = link.group_name || "";
      linkForm.elements.is_social.checked = link.is_social;
      linkForm.elements.featured.checked = link.featured;
      saveButton.textContent = "Simpan perubahan";
      cancelEditButton.hidden = false;
      linkForm.elements.title.focus();
    });

    const deleteButton = document.createElement("button");
    deleteButton.className = "text-button delete-button";
    deleteButton.type = "button";
    deleteButton.textContent = "Hapus";
    deleteButton.addEventListener("click", () => deleteLink(link));

    const moveUpButton = document.createElement("button");
    moveUpButton.className = "text-button order-button";
    moveUpButton.type = "button";
    moveUpButton.textContent = "↑";
    moveUpButton.setAttribute("aria-label", `Naikkan ${link.title}`);
    moveUpButton.disabled = savedLinks.indexOf(link) === 0;
    moveUpButton.addEventListener("click", () => moveLink(link, -1));

    const moveDownButton = document.createElement("button");
    moveDownButton.className = "text-button order-button";
    moveDownButton.type = "button";
    moveDownButton.textContent = "↓";
    moveDownButton.setAttribute("aria-label", `Turunkan ${link.title}`);
    moveDownButton.disabled = savedLinks.indexOf(link) === savedLinks.length - 1;
    moveDownButton.addEventListener("click", () => moveLink(link, 1));

    actions.append(moveUpButton, moveDownButton, editButton, deleteButton);
    item.append(details, actions);
    manageList.append(item);
  }
}

async function loadLinks() {
  const { data, error } = await supabase
    .from("links")
    .select("id, title, description, url, icon, icon_source, icon_url, group_name, is_social, featured, position")
    .order("position", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    if (adminNotice) {
      showNotice(`Tautan gagal dimuat: ${error.message}`, true);
    } else {
      console.error("Tautan gagal dimuat:", error);
      if (linkList) {
        const message = document.createElement("p");
        message.className = "empty-state";
        message.textContent = "Tautan belum dapat dimuat. Silakan coba lagi nanti.";
        linkList.replaceChildren(message);
      }
    }
    return;
  }

  savedLinks = data;
  renderLinks(savedLinks, linkSearch?.value || "");
  if (managerView && !managerView.hidden) renderManager();
}

function showAdminState(session) {
  loginView.hidden = Boolean(session);
  managerView.hidden = !session;
  if (session) loadLinks();
}

if (adminPanel) {
  document.querySelector("#cancel-edit").addEventListener("click", resetLinkForm);

  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formData = new FormData(loginForm);
    const { error } = await supabase.auth.signInWithPassword({
      email: formData.get("email"),
      password: formData.get("password"),
    });

    if (error) {
      showNotice(`Gagal masuk: ${error.message}`, true);
      return;
    }

    loginForm.reset();
    adminNotice.hidden = true;
  });

  document.querySelector("#sign-out").addEventListener("click", async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      showNotice(`Gagal keluar: ${error.message}`, true);
      return;
    }
    resetLinkForm();
    showNotice("Anda sudah keluar.");
  });

  linkForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formData = new FormData(linkForm);
    const url = String(formData.get("url")).trim();

    let parsedUrl;
    try {
      parsedUrl = new URL(url);
    } catch {
      showNotice("Masukkan URL yang valid, termasuk https:// atau mailto:.", true);
      return;
    }

    if (!["http:", "https:", "mailto:"].includes(parsedUrl.protocol)) {
      showNotice("URL hanya boleh menggunakan https://, http://, atau mailto:.", true);
      return;
    }

    const iconSource = String(formData.get("icon_source"));
    const iconUrl = String(formData.get("icon_url")).trim();
    if (iconSource === "custom") {
      let parsedIconUrl;
      try {
        parsedIconUrl = new URL(iconUrl);
      } catch {
        showNotice("Masukkan URL gambar yang valid.", true);
        return;
      }
      if (parsedIconUrl.protocol !== "https:") {
        showNotice("URL gambar harus menggunakan https://.", true);
        return;
      }
    }

    const payload = {
      title: String(formData.get("title")).trim(),
      description: String(formData.get("description")).trim(),
      url,
      icon: String(formData.get("icon")).trim() || "↗",
      icon_source: iconSource,
      icon_url: iconSource === "custom" ? iconUrl : "",
      group_name: String(formData.get("group_name")).trim(),
      is_social: formData.get("is_social") === "on",
      featured: formData.get("featured") === "on",
    };
    const id = String(formData.get("id"));
    const request = id
      ? supabase.from("links").update(payload).eq("id", id)
      : supabase.from("links").insert({
          ...payload,
          position: savedLinks.length,
        });
    const { error } = await request;

    if (error) {
      showNotice(`Tautan gagal disimpan: ${error.message}`, true);
      return;
    }

    resetLinkForm();
    showNotice(id ? "Perubahan tautan berhasil disimpan." : "Tautan berhasil ditambahkan.");
    await loadLinks();
  });
}

function updateIconFields() {
  if (!linkForm) return;
  const iconSource = linkForm.elements.icon_source.value;
  document.querySelector("#icon-symbol-field").hidden = iconSource !== "symbol";
  document.querySelector("#icon-url-field").hidden = iconSource !== "custom";
}

if (linkForm) {
  linkForm.elements.icon_source.addEventListener("change", updateIconFields);
}

if (linkSearch) {
  linkSearch.addEventListener("input", () => {
    renderLinks(savedLinks, linkSearch.value);
  });
}

async function deleteLink(link) {
  if (!window.confirm(`Hapus tautan "${link.title}"?`)) return;

  const { error } = await supabase.from("links").delete().eq("id", link.id);
  if (error) {
    showNotice(`Tautan gagal dihapus: ${error.message}`, true);
    return;
  }

  showNotice("Tautan berhasil dihapus.");
  await loadLinks();
}

if (!isConfigured) {
  renderLinks([]);
  if (adminPanel) {
    loginView.hidden = false;
    managerView.hidden = true;
    showNotice(
      "Login belum dikonfigurasi. Periksa konfigurasi Supabase.",
      true,
    );
  }
} else {
  supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  if (adminPanel) {
    supabase.auth.onAuthStateChange((_event, session) => showAdminState(session));
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      renderLinks([]);
      showNotice(`Sesi gagal diperiksa: ${error.message}`, true);
    } else {
      showAdminState(data.session);
      await loadLinks();
    }
  } else {
    await loadLinks();
  }
}
