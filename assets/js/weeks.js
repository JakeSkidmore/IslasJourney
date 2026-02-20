
(function () {
  "use strict";
  const elWeekList = document.getElementById("weekList");
  const elWeekTitle = document.getElementById("weekTitle");
  const elWeekMeta = document.getElementById("weekMeta");
  const elWeekSections = document.getElementById("weekSections");
  const elSearch = document.getElementById("weekSearch");

  if (!elWeekList || !elWeekTitle || !elWeekMeta || !elWeekSections) return;

  let DATA = null;
  let currentWeek = null;

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, (m) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    }[m]));
  }

  function makeList(items) {
    if (!items || !items.length) return "<p class=\"muted\">No items for this week.</p>";
    return "<ul>" + items.map(i => "<li>" + escapeHtml(i) + "</li>").join("") + "</ul>";
  }

  function section(title, bodyHtml, open) {
    const id = "sec-" + title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    return `
      <details class="week-card" ${open ? "open" : ""}>
        <summary>
          <span class="week-card-title">${escapeHtml(title)}</span>
          <span class="week-card-hint">tap to expand</span>
        </summary>
        <div class="week-card-body">
          ${bodyHtml}
        </div>
      </details>
    `;
  }

  function renderWeek(w) {
    currentWeek = w;

    elWeekTitle.textContent = `Week ${w.week}`;
    elWeekMeta.textContent = `Size: ${w.size} • Weight: ${w.weight} • About the size of a ${w.comparison}`;

    const parts = [];

    parts.push(section("Baby Eila’s progress", makeList(w.baby), true));
    parts.push(section("Nicole’s body changes", makeList(w.nicole), true));
    parts.push(section("Common experiences this week", makeList(w.symptoms), false));
    parts.push(section("Appointments & to‑dos", makeList(w.todos), false));
    parts.push(section("Nutrition & movement tips", makeList(w.nutrition), false));
    parts.push(section("Jake’s support checklist", makeList(w.jake), true));
    parts.push(section("Red flags — call the care team", makeList(w.redflags), false));

    elWeekSections.innerHTML = parts.join("\n");

    // highlight active
    [...elWeekList.querySelectorAll("a.week-link")].forEach(a => {
      a.classList.toggle("active", a.dataset.week === String(w.week));
    });

    // update hash for shareable linking
    history.replaceState(null, "", "#week-" + w.week);
  }

  function buildWeekList(weeks) {
    const frag = document.createDocumentFragment();
    weeks.forEach(w => {
      const a = document.createElement("a");
      a.href = "#week-" + w.week;
      a.className = "week-link";
      a.dataset.week = String(w.week);
      a.innerHTML = `<span class="wk">Week ${w.week}</span><span class="wk-mini">~${escapeHtml(w.comparison)}</span>`;
      a.addEventListener("click", (e) => {
        e.preventDefault();
        renderWeek(w);
      });
      frag.appendChild(a);
    });
    elWeekList.innerHTML = "";
    elWeekList.appendChild(frag);
  }

  function findWeekFromHash(weeks) {
    const m = (location.hash || "").match(/week-(\d+)/i);
    if (!m) return null;
    const num = parseInt(m[1], 10);
    return weeks.find(w => w.week === num) || null;
  }

  function applySearch(query) {
    query = (query || "").trim().toLowerCase();
    const links = [...elWeekList.querySelectorAll("a.week-link")];

    if (!query) {
      links.forEach(a => a.classList.remove("hidden"));
      return;
    }

    links.forEach(a => {
      const wk = parseInt(a.dataset.week, 10);
      const w = DATA.weeks.find(x => x.week === wk);
      const hay = [
        "week " + wk,
        w.comparison,
        ...(w.baby || []),
        ...(w.nicole || []),
        ...(w.symptoms || []),
        ...(w.todos || []),
        ...(w.nutrition || []),
        ...(w.jake || []),
        ...(w.redflags || [])
      ].join(" ").toLowerCase();

      a.classList.toggle("hidden", !hay.includes(query));
    });
  }

  
  // NOTE: For local file:// usage, we avoid fetch() to prevent CORS/Same-Origin issues.
  // Data is embedded via assets/js/weeks-data.js as window.EILAS_WEEKS_DATA.
  try {
    const embedded = window.EILAS_WEEKS_DATA;
    if (!embedded || !embedded.weeks) throw new Error("Weekly data is missing.");
    DATA = embedded;

    buildWeekList(DATA.weeks);

    const fromHash = findWeekFromHash(DATA.weeks);
    renderWeek(fromHash || DATA.weeks[0]);

    if (elSearch) {
      elSearch.addEventListener("input", (e) => applySearch(e.target.value));
    }

    window.addEventListener("hashchange", () => {
      const w = findWeekFromHash(DATA.weeks);
      if (w) renderWeek(w);
    });
  } catch (err) {
    elWeekTitle.textContent = "Couldn’t load the weekly guide.";
    elWeekMeta.textContent = "";
    elWeekSections.innerHTML = `<p>${escapeHtml(err.message)}</p>`;
  }

})();
