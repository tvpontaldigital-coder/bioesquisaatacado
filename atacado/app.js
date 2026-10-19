(function () {
const I18N = window.ATACADO_I18N;
const PRODUCTS = Array.isArray(window.ATACADO_PRODUCTS) ? window.ATACADO_PRODUCTS : [];
const WHATSAPP_NUMBER = "5518981153022";
const COUNTRIES = [
  "AR","AU","AT","BE","BO","BR","CA","CL","CN","CO","CR","CZ","DK","DO","EC","EG","SV","FI","FR","DE",
  "GR","GT","HN","HK","HU","IN","ID","IE","IL","IT","JP","KR","MY","MX","NL","NZ","NI","NO","PA","PY",
  "PE","PH","PL","PT","QA","RO","SA","SG","ZA","ES","SE","CH","TW","TH","TR","AE","GB","US","UY","VE",
];

let currentLang = "pt";
let languageTouched = false;
const params = new URLSearchParams(location.search);
const utm = {};
["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"].forEach((key) => {
  utm[key] = params.get(key) || "";
});

function t(lang, key) {
  return I18N.dict[lang]?.[key] ?? I18N.dict[I18N.defaultLang][key] ?? key;
}

function detectLang() {
  const query = (params.get("lang") || "").toLowerCase().slice(0, 2);
  if (I18N.supported.includes(query)) return query;
  try {
    const saved = localStorage.getItem(I18N.storageKey);
    if (saved && I18N.supported.includes(saved)) return saved;
  } catch {
    /* ignore */
  }
  const candidates = [];
  if (Array.isArray(navigator.languages)) candidates.push(...navigator.languages);
  if (navigator.language) candidates.push(navigator.language);
  for (const raw of candidates) {
    const base = String(raw || "").toLowerCase().slice(0, 2);
    if (I18N.supported.includes(base)) return base;
  }
  return I18N.defaultLang;
}

function localized(product, field, lang) {
  const value = product[field];
  if (!value) return "";
  if (typeof value === "string") return value;
  return value[lang] || value.pt || value.en || value.es || "";
}

function fillCountries(lang, selected) {
  const select = document.querySelector("#country");
  if (!select) return;
  const locale = I18N.locales[lang] || "pt-BR";
  let names;
  try {
    names = new Intl.DisplayNames([locale], { type: "region" });
  } catch {
    names = null;
  }
  const options = COUNTRIES.map((code) => ({
    code,
    label: names ? names.of(code) || code : code,
  })).sort((a, b) => a.label.localeCompare(b.label, locale));
  select.innerHTML = "";
  const empty = document.createElement("option");
  empty.value = "";
  empty.textContent = t(lang, "country_placeholder");
  select.appendChild(empty);
  options.forEach((item) => {
    const option = document.createElement("option");
    option.value = item.label;
    option.textContent = item.label;
    option.dataset.code = item.code;
    if (selected && (selected === item.label || selected === item.code)) option.selected = true;
    select.appendChild(option);
  });
}

function renderProducts(lang) {
  const grid = document.querySelector("#product-grid");
  const empty = document.querySelector("#products-empty");
  const picker = document.querySelector("#product-picker");
  const pickerWrap = document.querySelector("#product-picker-wrap");
  if (!grid || !empty) return;
  const checked = new Set(selectedProducts());
  grid.innerHTML = "";
  if (picker) picker.innerHTML = "";
  const visible = PRODUCTS.filter((item) => localized(item, "name", lang));
  empty.hidden = visible.length > 0;
  grid.hidden = visible.length === 0;
  if (picker) picker.hidden = visible.length === 0;
  if (pickerWrap) pickerWrap.hidden = visible.length === 0;
  const messageLabel = document.querySelector("#message-label");
  if (messageLabel) {
    messageLabel.textContent = t(lang, visible.length ? "label_message" : "label_message_required");
  }

  visible.forEach((product) => {
    const name = localized(product, "name", lang);
    const card = document.createElement("article");
    card.className = "product-card";
    if (product.image) {
      const img = document.createElement("img");
      img.src = product.image;
      img.alt = "";
      img.width = 640;
      img.height = 480;
      img.loading = "lazy";
      card.appendChild(img);
    } else {
      const placeholder = document.createElement("div");
      placeholder.className = "product-placeholder";
      placeholder.setAttribute("aria-hidden", "true");
      card.appendChild(placeholder);
    }
    const body = document.createElement("div");
    body.className = "product-body";
    body.innerHTML = `
        <p class="product-category"></p>
        <h3></h3>
        <p class="product-spec"></p>
        <button type="button" class="btn btn-ghost btn-sm product-pick"></button>`;
    card.appendChild(body);
    body.querySelector(".product-category").textContent = localized(product, "category", lang);
    body.querySelector("h3").textContent = name;
    body.querySelector(".product-spec").textContent = localized(product, "presentation", lang);
    const button = body.querySelector("button");
    button.textContent = t(lang, "product_interest");
    button.addEventListener("click", () => {
      const box = picker?.querySelector(`input[value="${CSS.escape(product.id)}"]`);
      if (box) box.checked = true;
      const formTarget = document.querySelector("#formulario");
      if (window.ATACADO_SCROLL && formTarget) window.ATACADO_SCROLL.scrollTo(formTarget, { offset: -172 });
      else formTarget?.scrollIntoView({ behavior: "smooth" });
      box?.focus();
    });
    grid.appendChild(card);

    if (picker) {
      const label = document.createElement("label");
      label.className = "check";
      const input = document.createElement("input");
      input.type = "checkbox";
      input.name = "products[]";
      input.value = product.id;
      input.checked = checked.has(product.id);
      const span = document.createElement("span");
      span.textContent = name;
      label.append(input, span);
      picker.appendChild(label);
    }
  });
}

function applyTranslations(lang) {
  currentLang = lang;
  const locale = I18N.locales[lang] || "pt-BR";
  document.documentElement.lang = locale;
  document.title = t(lang, "meta_title");
  const desc = document.querySelector('meta[name="description"]');
  if (desc) desc.setAttribute("content", t(lang, "meta_description"));
  const ogTitle = document.querySelector('meta[property="og:title"]');
  if (ogTitle) ogTitle.setAttribute("content", t(lang, "meta_title"));
  const ogDesc = document.querySelector('meta[property="og:description"]');
  if (ogDesc) ogDesc.setAttribute("content", t(lang, "meta_description"));
  const ogLocale = document.querySelector('meta[property="og:locale"]');
  if (ogLocale) ogLocale.setAttribute("content", locale.replace("-", "_"));

  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    if (key) el.textContent = t(lang, key);
  });
  document.querySelectorAll("[data-i18n-html]").forEach((el) => {
    const key = el.getAttribute("data-i18n-html");
    if (key) el.innerHTML = t(lang, key);
  });
  document.querySelectorAll("[data-i18n-aria]").forEach((el) => {
    const key = el.getAttribute("data-i18n-aria");
    if (key) el.setAttribute("aria-label", t(lang, key));
  });
  document.querySelectorAll("[data-lang]").forEach((btn) => {
    const active = btn.getAttribute("data-lang") === lang;
    btn.classList.toggle("is-active", active);
    btn.setAttribute("aria-pressed", String(active));
  });

  const previous = document.querySelector("#country")?.selectedOptions?.[0]?.dataset.code
    || document.querySelector("#country")?.value
    || "";
  fillCountries(lang, previous);
  renderProducts(lang);
  const service = document.querySelector("#language");
  if (service && !languageTouched) service.value = lang;

  const number = WHATSAPP_NUMBER.replace(/\D/g, "");
  const href = number
    ? `https://wa.me/${number}?text=${encodeURIComponent(t(lang, "whatsapp_message"))}`
    : "#";
  document.querySelectorAll(".whatsapp-go").forEach((link) => {
    link.href = href;
  });
  try {
    localStorage.setItem(I18N.storageKey, lang);
  } catch {
    /* ignore */
  }
  const url = new URL(location.href);
  url.searchParams.set("lang", lang);
  history.replaceState(null, "", url);
}

function showError(message) {
  const box = document.querySelector("#form-error");
  if (!box) return;
  box.hidden = !message;
  box.textContent = message || "";
}

function selectedProducts() {
  return [...document.querySelectorAll('#product-picker input:checked')].map((input) => input.value);
}

async function onSubmit(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const data = new FormData(form);
  const name = String(data.get("name") || "").trim();
  const email = String(data.get("email") || "").trim();
  const country = String(data.get("country") || "").trim();

  if (!name || !email || !country) {
    showError(t(currentLang, "err_fields"));
    return;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    showError(t(currentLang, "err_email"));
    return;
  }

  showError("");
  const button = form.querySelector('[type="submit"]');
  button.disabled = true;
  const original = button.textContent;
  button.textContent = t(currentLang, "sending");
  data.set("page_lang", currentLang);
  data.set("referrer", document.referrer.slice(0, 300));
  Object.entries(utm).forEach(([key, value]) => data.set(key, value));

  try {
    const response = await fetch("lead.php", { method: "POST", body: data });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || !payload.ok) {
      showError(t(currentLang, response.status === 400 && payload.error === "fields" ? "err_fields" : "err_send"));
      button.disabled = false;
      button.textContent = original;
      return;
    }
    form.hidden = true;
    const success = document.querySelector("#form-success");
    if (success) success.hidden = false;
  } catch {
    showError(t(currentLang, "err_send"));
    button.disabled = false;
    button.textContent = original;
  }
}

document.querySelectorAll("[data-lang]").forEach((btn) => {
  btn.addEventListener("click", () => applyTranslations(btn.getAttribute("data-lang")));
});

const header = document.querySelector("[data-header]");
const onScroll = () => header?.classList.toggle("is-scrolled", window.scrollY > 8);
onScroll();
window.addEventListener("scroll", onScroll, { passive: true });

document.querySelector("#language")?.addEventListener("change", () => {
  languageTouched = true;
});

const form = document.querySelector("#lead-form");
if (form) {
  form.querySelector('[name="started_at"]').value = String(Date.now());
  form.addEventListener("submit", onSubmit);
}

applyTranslations(detectLang());
})();
