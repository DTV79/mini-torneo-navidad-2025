async function load() {
  const res = await fetch("./standings.json", { cache: "no-store" });
  if (!res.ok) throw new Error("No se pudo cargar standings.json");
  return await res.json();
}

function esc(s){
  return String(s ?? "")
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;");
}

function formatUpdated(s){
  const txt = String(s || "").trim();
  // Si viene como "YYYY-MM-DD HH:MM:SS"
  const m = txt.match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2}):(\d{2})$/);
  if (m){
    const [_, Y, M, D, hh, mm, ss] = m;
    return `${D}/${M}/${Y} ${hh}:${mm}:${ss}`;
  }
  // Si ya viene en otro formato, lo dejamos tal cual
  return txt || "—";
}

function renderTeams(elId, teams){
  const el = document.getElementById(elId);
  const list = (teams || []).filter(t => String(t).trim().length);

  if (!list.length){
    el.innerHTML = `<p class="muted">—</p>`;
    return;
  }

  el.innerHTML = list.map(t => `
    <div class="teamline">
      <span class="teamdot"></span>
      <span class="teamname">${esc(t)}</span>
    </div>
  `).join("");
}

function matchCard(m){
  // ORDEN FIJO: tal cual viene de Excel
  const teamA = m.teamA ?? "";
  const teamB = m.teamB ?? "";

  // Ganador solo para pintar en verde (no para reordenar)
  const winnerName = String(m.winner || "").trim();

  const aIsWinner = winnerName && winnerName.toLowerCase() === String(teamA).trim().toLowerCase();
  const bIsWinner = winnerName && winnerName.toLowerCase() === String(teamB).trim().toLowerCase();

  const sets = Array.isArray(m.sets) ? m.sets : [];
  const a1 = sets[0]?.w ?? "";
  const b1 = sets[0]?.l ?? "";
  const a2 = sets[1]?.w ?? "";
  const b2 = sets[1]?.l ?? "";
  const a3 = sets[2]?.w ?? "";
  const b3 = sets[2]?.l ?? "";

  return `
    <div class="matchcard">
      <div class="matchgrid">
        <table class="settable">
          <thead>
            <tr>
              <th class="teamcell">EQUIPOS</th>
              <th>I</th>
              <th>II</th>
              <th>III</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="teamcell ${aIsWinner ? "winner" : ""}">${esc(teamA)}</td>
              <td>${esc(a1)}</td>
              <td>${esc(a2)}</td>
              <td>${esc(a3)}</td>
            </tr>
            <tr>
              <td class="teamcell ${bIsWinner ? "winner" : ""}">${esc(teamB)}</td>
              <td>${esc(b1)}</td>
              <td>${esc(b2)}</td>
              <td>${esc(b3)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `;
}


function renderMatches(elId, matches){
  if (!matches || !matches.length){
    document.getElementById(elId).innerHTML = `<p class="muted">Aún no hay partidos.</p>`;
    return;
  }
  document.getElementById(elId).innerHTML = `<div class="matchlist">${matches.map(matchCard).join("")}</div>`;
}

function renderStandings(elId, rows){
  const el = document.getElementById(elId);

  if (!rows || !rows.length){
    el.innerHTML = `<p class="muted">—</p>`;
    return;
  }

  const body = rows.map(r => {
    const qualify = (r.pos === 1 || r.pos === 2) ? "qualify" : "";
    return `
      <tr class="${qualify}">
        <td class="c-pos">${esc(r.pos)}</td>
        <td class="c-team">${esc(r.team)}</td>
        <td class="c-num">${esc(r.ptos)}</td>
        <td class="c-num">${esc(r.pg)}</td>
        <td class="c-num">${esc(r.sg)}</td>
        <td class="c-num">${esc(r.sp)}</td>
        <td class="c-num">${esc(r.sd)}</td>
        <td class="c-num">${esc(r.pgan)}</td>
        <td class="c-num">${esc(r.pper)}</td>
        <td class="c-num">${esc(r.pdif)}</td>
      </tr>
    `;
  }).join("");

  el.innerHTML = `
    <div class="standings">
      <div class="table-scroll">
        <table class="standings-table">
          <thead>
            <tr>
              <th class="c-pos">Pos</th>
              <th class="c-team">Equipo</th>
              <th class="c-num">Ptos</th>
              <th class="c-num">PG</th>
              <th class="c-num">SG</th>
              <th class="c-num">SP</th>
              <th class="c-num">SD</th>
              <th class="c-num">PGan</th>
              <th class="c-num">PPer</th>
              <th class="c-num">PDif</th>
            </tr>
          </thead>
          <tbody>${body}</tbody>
        </table>
      </div>

      <div class="standings-legend">
        <em>
          PTOS: Puntos Totales ·
          PG: Partidos Ganados ·
          SG: Sets Ganados ·
          SP: Sets Perdidos ·
          SD: Diferencia Sets ·
          PGan: Puntos Ganados ·
          PPer: Puntos Perdidos ·
          PDif: Diferencia Puntos
        </em>
      </div>
    </div>
  `;
}

function renderBracket(data){
  const semisEl = document.getElementById("bracket-semifinals");
  const finalEl = document.getElementById("bracket-final");

  const bracket = data.bracket || {};
  const semis = Array.isArray(bracket.semifinals) ? bracket.semifinals : [];
  const fin = bracket.final || null;   // 👈 ESTA LÍNEA ES CLAVE

  /* --- SEMIFINALES --- */
if (!semis.length){
  semisEl.innerHTML = `
    <p class="muted">1ª Semifinal pendiente</p>
    <p class="muted">2ª Semifinal pendiente</p>
  `;
} else {
  semisEl.innerHTML = semis.map((m, idx) => {
    const label = idx === 0 ? "1ª Semifinal" : "2ª Semifinal";

    const hasTeams =
      String(m.teamA || "").trim() &&
      String(m.teamB || "").trim();

    if (!hasTeams){
      return `<p class="muted">${label} pendiente</p>`;
    }

    return `
      <div class="section">
        <div class="subhead">
          <span class="subhead-label">${label}</span>
        </div>
        ${matchCard(m)}
      </div>
    `;
  }).join("");
}


  /* --- FINAL --- */
  if (!fin || !fin.teamA || !fin.teamB){
    finalEl.innerHTML = `<p class="muted">Final pendiente</p>`;
  } else {
    finalEl.innerHTML = matchCard(fin);
  }

  /* --- CAMPEÓN --- */
  const championEl = document.getElementById("championCard");
  const championNameEl = document.getElementById("championName");

  if (fin && fin.winner && String(fin.winner).trim()){
    championNameEl.textContent = fin.winner;
    championEl.style.display = "block";
  } else {
    championEl.style.display = "none";
  }
}




function normalizeToCurrentSchema(data){
  // Si todavía tienes el JSON viejo (matches con stage/group/teamA...), lo dejamos.
  // Pero en tu web actual se estaba pintando "Ganador/Perdedor", así que soportamos ambos.
  return data;
}

load().then(raw => {
  const data = normalizeToCurrentSchema(raw);

  document.getElementById("updated").textContent =
    `Última actualización: ${formatUpdated(data.updated_at)}`;

  // Equipos
  renderTeams("teamsZ", data.groups?.Z || []);
  renderTeams("teamsY", data.groups?.Y || []);

  // Partidos: solo liguilla jugada por grupo
  const all = data.matches || [];
  const played = all.filter(m => {
    // Nuevo esquema: m.sets = [{w:6,l:4},{w:3,l:6},{w:6,l:2}]
    if (Array.isArray(m.sets) && m.sets.length > 0) {
      const s0 = m.sets[0];
      const w = s0?.w, l = s0?.l;
      return Number.isFinite(Number(w)) && Number.isFinite(Number(l));
    }

    // Compatibilidad por si hubiera esquema antiguo
    const a = (m.setsA ?? m.sets_w);
    const b = (m.setsB ?? m.sets_l);
    const ga = (m.gamesA ?? m.games_w);
    const gb = (m.gamesB ?? m.games_l);
    return [a,b,ga,gb].every(v => v !== null && v !== undefined && v !== "");
  });

  const matchesZ = played.filter(m => String(m.group || m.Grupo || "").toUpperCase() === "Z");
  const matchesY = played.filter(m => String(m.group || m.Grupo || "").toUpperCase() === "Y");

  renderMatches("matchesZ", [...matchesZ].reverse());
  renderMatches("matchesY", [...matchesY].reverse());

  // Clasificación
  renderStandings("standingsZ", data.standings?.Z || []);
  renderStandings("standingsY", data.standings?.Y || []);

  // Eliminatorias
  renderBracket(data);


}).catch(err => {
  document.getElementById("updated").textContent = "Error cargando datos";
  document.getElementById("groupZ").innerHTML = `<p>${esc(err.message)}</p>`;
  document.getElementById("groupY").innerHTML = "";
  document.getElementById("bracket").innerHTML = "";
});

