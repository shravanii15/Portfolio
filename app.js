(function () {
  "use strict";

  /* ---------- 1. Role lens ("View as") ---------- */
  var LENSES = {
    all: null, // default: keep the HTML as written
    data: {
      pitch: "I turn messy data into analysis people can trust, and I report where it stops being trustworthy.",
      proof: [
        ["170 gaps", "Skill gaps tested with z-tests, Fisher's exact test and FDR control (AlignED)"],
        ["57% faster", "Median Power BI query latency, 4.2s to 1.8s, across 15+ reports (NIC)"],
        ["0 of 67", "Demand trends that survived multiple-comparison correction, reported as such (AlignED)"]
      ],
      start: [["AlignED statistical design", "#work"], ["Financial data pipeline", "#projects"], ["AdventureWorks report", "#projects"]]
    },
    fde: {
      pitch: "I scope ambiguous asks with the people who will use the result, then build and ship the system.",
      proof: [
        ["RAG + API", "Co-built Jigyasa: Llama 3, LlamaIndex, served through a Django REST API (NIC)"],
        ["Zero PII", "Client-side analytics app for non-technical staff, running on hashed IDs (ASU)"],
        ["3 departments", "Conflicting KPI logic resolved into one definition set (NIC)"]
      ],
      start: [["How I work", "#how"], ["AlignED API and CI", "#work"], ["Emeritus College app", "#work"]]
    },
    ops: {
      pitch: "I turn manual workflows into measured, automated ones that leadership can run on.",
      proof: [
        ["3 h → 20 min", "Manual reporting workflow automated across 5 databases (NIC)"],
        ["$31,360 / yr", "Policy change quantified for decision makers (ASU)"],
        ["Risk score", "Deadline-risk prioritization so at-risk accommodation requests escalate early (SAILS)"]
      ],
      start: [["SAILS experience", "#experience"], ["Emeritus College app", "#work"], ["How I work", "#how"]]
    }
  };

  var pitchEl = document.getElementById("pitch");
  var proofEl = document.getElementById("proof");
  var startEl = document.getElementById("startHere");
  var lensBtns = Array.prototype.slice.call(document.querySelectorAll("[data-lens]"));
  var defaults = pitchEl && proofEl ? { pitch: pitchEl.textContent, proof: proofEl.innerHTML } : null;

  function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }

  function setLens(key, updateUrl) {
    if (!defaults || !(key in LENSES)) key = "all";
    var cfg = LENSES[key];
    pitchEl.textContent = cfg ? cfg.pitch : defaults.pitch;
    proofEl.innerHTML = cfg
      ? cfg.proof.map(function (p) { return "<div><dt>" + esc(p[0]) + "</dt><dd>" + esc(p[1]) + "</dd></div>"; }).join("")
      : defaults.proof;
    if (startEl) {
      if (cfg) {
        startEl.innerHTML = "<span>Start here</span>" + cfg.start.map(function (s) { return '<a href="' + s[1] + '">' + esc(s[0]) + " &rarr;</a>"; }).join("");
        startEl.hidden = false;
      } else { startEl.hidden = true; startEl.innerHTML = ""; }
    }
    lensBtns.forEach(function (b) { b.setAttribute("aria-pressed", b.getAttribute("data-lens") === key ? "true" : "false"); });
    if (updateUrl) {
      try {
        var u = new URL(window.location.href);
        if (key === "all") u.searchParams.delete("view"); else u.searchParams.set("view", key);
        history.replaceState(null, "", u.pathname + u.search + u.hash);
      } catch (e) {}
    }
  }

  lensBtns.forEach(function (b) {
    b.addEventListener("click", function () { setLens(b.getAttribute("data-lens"), true); });
  });
  try { setLens(new URL(window.location.href).searchParams.get("view") || "all", false); } catch (e) {}

  /* ---------- 2. "The result flipped" chart ---------- */
  var flip = document.getElementById("flip");
  if (flip) {
    var SETS = {
      dev: {
        rows: [["Keyword baseline", 0.364, null], ["LLM + embeddings", 0.426, null]],
        note: "On the 104 items I used while building, the LLM method led (F1 0.426 vs 0.364). Its similarity cutoff was tuned on these same items, so this result is optimistic. No intervals are reported for this set."
      },
      held: {
        rows: [["Keyword baseline", 0.311, [0.234, 0.377]], ["LLM + embeddings", 0.198, [0.125, 0.270]]],
        note: "On 50 fresh items, labeled before either method ran, the order reversed (F1 0.311 vs 0.198). The 95% interval for the difference, -0.177 to -0.046, excludes zero. I shipped the keyword method. Whiskers show 95% intervals."
      }
    };
    var MAX = 0.5;
    var rowsEl = document.getElementById("flipRows");
    var noteEl = document.getElementById("flipNote");
    var segBtns = Array.prototype.slice.call(flip.querySelectorAll("[data-set]"));

    function pct(v) { return (v / MAX * 100).toFixed(2) + "%"; }

    function build() {
      rowsEl.innerHTML = "";
      for (var i = 0; i < 2; i++) {
        var row = document.createElement("div");
        row.className = "bar-row";
        row.innerHTML =
          '<span class="bar-label"></span>' +
          '<div class="track"><div class="fill"></div><div class="ci" hidden></div></div>' +
          '<span class="bar-val"></span>';
        rowsEl.appendChild(row);
      }
    }

    function render(key) {
      var set = SETS[key];
      var winner = set.rows[0][1] > set.rows[1][1] ? 0 : 1;
      Array.prototype.forEach.call(rowsEl.children, function (row, i) {
        var d = set.rows[i];
        row.querySelector(".bar-label").textContent = d[0];
        row.querySelector(".bar-val").textContent = d[1].toFixed(3);
        var fill = row.querySelector(".fill");
        fill.style.width = pct(d[1]);
        fill.classList.toggle("win", i === winner);
        var ci = row.querySelector(".ci");
        if (d[2]) {
          ci.hidden = false;
          ci.style.left = pct(d[2][0]);
          ci.style.width = pct(d[2][1] - d[2][0]);
          ci.setAttribute("title", "95% interval " + d[2][0].toFixed(3) + " to " + d[2][1].toFixed(3));
        } else { ci.hidden = true; }
      });
      noteEl.textContent = set.note;
      segBtns.forEach(function (b) { b.setAttribute("aria-pressed", b.getAttribute("data-set") === key ? "true" : "false"); });
    }

    build();
    render("dev");
    segBtns.forEach(function (b) { b.addEventListener("click", function () { render(b.getAttribute("data-set")); }); });
  }

  /* ---------- 3. Live pipeline status (GitHub Actions) ---------- */
  var statusEl = document.getElementById("status");
  if (statusEl) {
    var API = "https://api.github.com/repos/shravanii15/AlignED/actions/workflows/";
    var CACHE_KEY = "aligned-status-v1";

    function ago(iso) {
      var s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
      if (s < 3600) return Math.max(1, Math.round(s / 60)) + " min ago";
      if (s < 86400) return Math.round(s / 3600) + " h ago";
      var d = Math.round(s / 86400);
      return d + (d === 1 ? " day ago" : " days ago");
    }

    function latest(file) {
      return fetch(API + file + "/runs?per_page=1&status=completed", { headers: { Accept: "application/vnd.github+json" } })
        .then(function (r) { if (!r.ok) throw new Error("http " + r.status); return r.json(); })
        .then(function (j) {
          var run = j.workflow_runs && j.workflow_runs[0];
          if (!run) throw new Error("no runs");
          return { ok: run.conclusion === "success", at: run.updated_at };
        });
    }

    function show(data) {
      var ing = data.ingest, ci = data.tests;
      var stale = (Date.now() - new Date(ing.at).getTime()) > 3 * 86400 * 1000;
      var healthy = ing.ok && ci.ok && !stale;
      statusEl.classList.toggle("warn", !healthy);
      statusEl.querySelector(".status-text").innerHTML =
        "<strong>" + (healthy ? "Pipeline live" : "Pipeline status") + "</strong>" +
        " &middot; daily ingestion " + (ing.ok ? "succeeded " : "last run failed ") + ago(ing.at) +
        " &middot; CI tests " + (ci.ok ? "passing" : "failing");
      statusEl.hidden = false;
    }

    var cached = null;
    try { cached = JSON.parse(sessionStorage.getItem(CACHE_KEY) || "null"); } catch (e) {}
    if (cached && Date.now() - cached.t < 10 * 60 * 1000) {
      show(cached.d);
    } else {
      Promise.all([latest("fetch_adzuna.yml"), latest("run_tests.yml")])
        .then(function (r) {
          var d = { ingest: r[0], tests: r[1] };
          try { sessionStorage.setItem(CACHE_KEY, JSON.stringify({ t: Date.now(), d: d })); } catch (e) {}
          show(d);
        })
        .catch(function () { /* stay hidden: never show a guess */ });
    }
  }
})();
