const LANG_LIST = [
  { code: "en", name: "English", flag: "🇬🇧" },
  { code: "fr", name: "French", flag: "🇫🇷", rec: true },
  { code: "de", name: "German", flag: "🇩🇪", rec: true },
  { code: "es", name: "Spanish", flag: "🇪🇸", rec: true },
  { code: "ru", name: "Russian", flag: "🇷🇺", rec: true },
  { code: "zh", name: "Chinese (Simplified)", flag: "🇨🇳", rec: true },
  { code: "it", name: "Italian", flag: "🇮🇹", rec: true },
  { code: "ar", name: "Arabic", flag: "🇸🇦" },
  { code: "bn", name: "Bengali", flag: "🇧🇩" },
  { code: "bg", name: "Bulgarian", flag: "🇧🇬" },
  { code: "br", name: "Brazilian Portuguese", flag: "🇧🇷" },
  { code: "cs", name: "Czech", flag: "🇨🇿" },
  { code: "da", name: "Danish", flag: "🇩🇰" },
  { code: "nl", name: "Dutch", flag: "🇳🇱" },
  { code: "el", name: "Greek", flag: "🇬🇷" },
  { code: "fa", name: "Persian", flag: "🇮🇷" },
  { code: "fil", name: "Filipino", flag: "🇵🇭" },
  { code: "fi", name: "Finnish", flag: "🇫🇮" },
  { code: "hi", name: "Hindi", flag: "🇮🇳" },
  { code: "hr", name: "Croatian", flag: "🇭🇷" },
  { code: "hu", name: "Hungarian", flag: "🇭🇺" },
  { code: "id", name: "Indonesian", flag: "🇮🇩" },
  { code: "ja", name: "Japanese", flag: "🇯🇵" },
  { code: "ko", name: "Korean", flag: "🇰🇷" },
  { code: "ms", name: "Malay", flag: "🇲🇾" },
  { code: "no", name: "Norwegian", flag: "🇳🇴" },
  { code: "pl", name: "Polish", flag: "🇵🇱" },
  { code: "pt", name: "Portuguese", flag: "🇵🇹" },
  { code: "ro", name: "Romanian", flag: "🇷🇴" },
  { code: "si", name: "Sinhala", flag: "🇱🇰" },
  { code: "sl", name: "Slovenian", flag: "🇸🇮" },
  { code: "sv", name: "Swedish", flag: "🇸🇪" },
  { code: "th", name: "Thai", flag: "🇹🇭" },
  { code: "tr", name: "Turkish", flag: "🇹🇷" },
  { code: "uk", name: "Ukrainian", flag: "🇺🇦" },
  { code: "ur", name: "Urdu", flag: "🇵🇰" },
  { code: "vi", name: "Vietnamese", flag: "🇻🇳" },
];

const langContainer = document.getElementById("languages");
LANG_LIST.filter((l) => l.code !== "en").forEach((lang) => {
  const id = `lang-${lang.code}`;
  const wrapper = document.createElement("label");
  wrapper.style.display = "flex";
  wrapper.style.alignItems = "center";
  wrapper.style.gap = "8px";
  const badge = lang.rec
    ? `<span style="display:inline-block; background:#e8f5e9; color:#166534; border:1px solid #bbf7d0; font-size:0.75rem; padding:2px 8px; border-radius:999px; font-weight:700;">recommended</span>`
    : "";
  wrapper.innerHTML = `<input type="checkbox" id="${id}" value="${lang.code}" /> <span>${lang.flag} ${lang.name} ${badge}</span>`;
  langContainer.appendChild(wrapper);
});

function isValidDomain(domain) {
  return /^[a-z0-9-]+\.[a-z]{2,}$/i.test(domain.trim());
}
function isValidDemoUrl(url) {
  try {
    const u = new URL(url);
    return (
      u.hostname.endsWith("airliftstudios.com") &&
      u.pathname.startsWith("/demo/") &&
      u.pathname.length > "/demo/".length
    );
  } catch {
    console.log("invalid url", url);
    return false;
  }
}
function isValidEmail(email) {
  console.log("invalid email", email);
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
function sanitizeLocal(local) {
  return local.replace(/[^a-z0-9._+-]/gi, "").toLowerCase();
}

function formatUSD(n) {
  return `$${Number(n).toFixed(2)}`;
}
const BASE_PRICE = 59.0; // hands-off discounted price
const ORIGINAL_PRICE = 199.0; // original before discount
const LANG_FIRST = 29.0;
const LANG_ADDITIONAL = 19.0;
const YEAR_EXTRA = 39.0;

function buildReceiptLines(values) {
  const lines = [];
  lines.push({
    label: `Hands‑Off package`,
    amount: ORIGINAL_PRICE,
  });
  const savings = Math.max(0, ORIGINAL_PRICE - BASE_PRICE);
  if (savings > 0) lines.push({ label: "Package discount", amount: -savings });
  values.languages.forEach((code, idx) => {
    const lang = LANG_LIST.find((l) => l.code === code);
    const price = idx === 0 ? LANG_FIRST : LANG_ADDITIONAL;
    lines.push({
      label: `Language: ${lang ? lang.name : code}`,
      amount: price,
    });
  });
  const extraYears = Number(values.years);
  if (extraYears > 1)
    lines.push({
      label: `${extraYears}  years secured`,
      amount: extraYears * YEAR_EXTRA,
    });
  const total = lines.reduce((s, l) => s + l.amount, 0);

  return { lines, total };
}

function renderSummaryReceipt(values) {
  const { lines, total } = buildReceiptLines(values);
  const container = document.getElementById("summary-receipt-lines");
  if (container)
    container.innerHTML = lines
      .map(
        (l) =>
          `<div style="display:flex; justify-content:space-between;"><span>${
            l.label
          }</span><span>${l.amount < 0 ? "-" : ""}${formatUSD(
            Math.abs(l.amount)
          )}</span></div>`
      )
      .join("");
  const totalEl = document.getElementById("summary-receipt-total");
  if (totalEl) totalEl.textContent = formatUSD(total);
  const monthlyEl = document.getElementById("summary-monthly");
  if (monthlyEl) {
    const yearsNum = Number(values.years || 1);
    if (yearsNum > 2) {
      const perMonth = total / (yearsNum * 12);
      monthlyEl.textContent = `Works out at only ${formatUSD(
        perMonth
      )} / month`;
    } else {
      monthlyEl.textContent = "";
    }
  }
}
//file:///Users/emilmannfeldt/dev/workspace/other/airliftstudio/order_hands_off.html?name=Jane%20Doe&demo_url=https%3A%2F%2Fwww.airliftstudios.com%2Fdemo%2Fmy-airbnb&domain=myvilla.com&email=hello&forward_to=host%40gmail.com&languages=fr,de&years=3
const form = document.getElementById("order-form");
const errorEl = document.getElementById("form-error");
const summaryWrap = document.getElementById("order-summary");
const summaryBlock = document.getElementById("summary-block");
const domainEl = document.getElementById("domain");
const emailNameEl = document.getElementById("emailName");
const emailFullEl = document.getElementById("emailFull");
const yearsEl = document.getElementById("years");

function computeEmail() {
  const domain = (domainEl.value || "").trim();
  const local = sanitizeLocal(emailNameEl.value || "hello") || "hello";
  if (isValidDomain(domain)) {
    emailFullEl.textContent = `${local}@${domain}`;
  } else {
    emailFullEl.textContent = `${local}@yourdomain.com`;
  }
}

function formatDemoUrl(url) {
  try {
    const u = new URL(url);
    return (
      u.host.replace(/^www\./, "") +
      u.pathname +
      (u.search || "") +
      (u.hash || "")
    );
  } catch {
    return url;
  }
}
emailNameEl.addEventListener("input", computeEmail);
domainEl.addEventListener("input", computeEmail);
computeEmail();

// Tooltip click toggle and outside click close
document.addEventListener("click", (e) => {
  const triggers = document.querySelectorAll(".biz-info-icon");
  triggers.forEach((t) => {
    if (t.contains(e.target)) {
      const expanded = t.getAttribute("aria-expanded") === "true";
      t.setAttribute("aria-expanded", expanded ? "false" : "true");
    } else {
      t.setAttribute("aria-expanded", "false");
    }
  });
});

// Prefill support via query parameters
(function prefillFromQuery() {
  const params = new URLSearchParams(location.search);
  const setVal = (id, keys) => {
    let v = null;
    for (const k of keys) {
      if (params.has(k)) {
        v = params.get(k);
        break;
      }
    }
    if (v !== null) {
      const el = document.getElementById(id);
      if (el) el.value = v;
    }
  };
  setVal("name", ["name"]);
  setVal("demoUrl", ["demo_url"]);
  setVal("domain", ["domain"]);
  setVal("emailName", ["email"]);
  setVal("forwardTo", ["forward_to"]);
  setVal("years", ["years"]);
  const langs = new Set();
  if (params.has("languages")) {
    params
      .get("languages")
      .split(",")
      .forEach((c) => {
        const t = c.trim().toLowerCase();
        if (t) langs.add(t);
      });
  }
  langs.forEach((code) => {
    const cb = document.querySelector(`#languages input[value="${code}"]`);
    if (cb) cb.checked = true;
  });
  const pe = params.get("email");
  if (pe && pe.includes("@")) {
    const [local, dom] = pe.split("@");
    if (local && !document.getElementById("email").value)
      document.getElementById("email").value = sanitizeLocal(local);
    if (dom && !document.getElementById("domain").value)
      document.getElementById("domain").value = dom;
  }
  computeEmail();
})();

function buildOrderText(values) {
  const languages = ["English"].concat(
    values.languages
      .map((c) => LANG_LIST.find((l) => l.code === c)?.name)
      .filter(Boolean)
  );
  return [
    "Hands‑Off package order",
    `Name: ${values.name}`,
    `Demo: ${values.demoUrl}`,
    `Desired domain: ${values.domain}`,
    `Public email: ${values.publicEmail}`,
    `Forward to: ${values.forwardTo}`,
    `Years secured: ${values.years}`,
    `Languages: ${languages.join(", ")}`,
  ].join("\n");
}

form.addEventListener("submit", (e) => {
  e.preventDefault();
  const values = {
    name: document.getElementById("name").value.trim(),
    demoUrl: document.getElementById("demoUrl").value.trim(),
    domain: document.getElementById("domain").value.trim(),
    languages: Array.from(
      document.querySelectorAll('#languages input[type="checkbox"]:checked')
    ).map((i) => i.value),
    emailName:
      sanitizeLocal(document.getElementById("emailName").value || "hello") ||
      "hello",
    forwardTo: document.getElementById("forwardTo").value.trim(),
    years: document.getElementById("years").value,
  };
  values.publicEmail = `${values.emailName}@${values.domain}`;

  const valid =
    values.name &&
    isValidDemoUrl(values.demoUrl) &&
    isValidDomain(values.domain) &&
    isValidEmail(values.publicEmail) &&
    isValidEmail(values.forwardTo);
  if (!valid) {
    errorEl.style.display = "inline";
    return;
  }
  errorEl.style.display = "none";

  // Summary
  const languages = ["English"].concat(
    values.languages
      .map((c) => LANG_LIST.find((l) => l.code === c)?.name)
      .filter(Boolean)
  );
  summaryBlock.innerHTML = `
      <div style="display:grid; gap:8px;">
        <div><b>Name</b><br/>${values.name}</div>
        <div><b>Demo</b><br/><a href="${
          values.demoUrl
        }" style="font-size:0.8rem;" target="_blank" rel="noopener">
        ${formatDemoUrl(values.demoUrl)}
  </a></div>
        <div><b>Desired domain</b><br/>${values.domain}</div>
        <div><b>Public email</b><br/>${values.publicEmail}</div>
        <div><b>Forward to</b><br/>${values.forwardTo}</div>
        <div><b>Years secured</b><br/>${values.years}</div>
        <div><b>Languages</b><br/>${languages.join(", ")}
         <span style="float:right; margin-top:10px; display:flex; gap:10px;">
          <button id="copy-order" class="btn btn-primary" type="button">Copy order</button>
          <button id="edit-order" class="btn btn-outline" type="button">Edit order</button>
         </span>
        </div>
      </div>
    `;
  renderSummaryReceipt(values);

  // Share links (include pricing receipt in body)
  const receipt = buildReceiptLines(values);
  const receiptText =
    receipt.lines
      .map(
        (l) =>
          `- ${l.label}: ${l.amount < 0 ? "-" : ""}${formatUSD(
            Math.abs(l.amount)
          )}`
      )
      .join("\n") + `\nTotal: ${formatUSD(receipt.total)}`;
  const orderText = buildOrderText(values) + `\n\nReceipt:\n${receiptText}`;
  const encoded = encodeURIComponent(orderText);
  const subject = encodeURIComponent(`Hands‑Off order - ${values.domain}`);

  const igUser = "airliftstudios";
  const igBtn = document.getElementById("send-instagram");
  igBtn.href = `https://www.instagram.com/${igUser}/`;
  igBtn.addEventListener("click", () => {
    try {
      navigator.clipboard.writeText(orderText);
    } catch {}
  });
  igBtn.title = "We'll copy your order so you can paste it in DM";

  const mailBtn = document.getElementById("send-email");
  mailBtn.href = `mailto:hello@airliftstudios.com?subject=${subject}&body=${encoded}`;
  mailBtn.target = "_blank";
  mailBtn.rel = "noopener";

  const copyBtn = document.getElementById("copy-order");
  copyBtn.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(orderText);
      copyBtn.textContent = "Copied!";
      setTimeout(() => (copyBtn.textContent = "Copy order"), 1500);
    } catch {}
  });

  // Toggle view
  form.style.display = "none";
  summaryWrap.style.display = "";
  window.scrollTo({ top: 0, behavior: "smooth" });

  // Edit flow
  const editBtn = document.getElementById("edit-order");
  if (editBtn) {
    editBtn.onclick = () => {
      summaryWrap.style.display = "none";
      form.style.display = "";
      window.scrollTo({ top: 0, behavior: "smooth" });
    };
  }
});
