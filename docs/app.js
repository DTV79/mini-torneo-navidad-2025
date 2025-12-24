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
  const winner = m.winner ?? m.teamA;
  const loser  = m.loser  ?? m.teamB;

  // Nuevo: sets por set -> [{w:6,l:4},{w:3,l:6},{w:6,l:2}]
  const sets = Array.isArray(m.sets) ? m.sets : [];

  // Render columnas I/II/III siempre (si falta, vacío)
  const s1w = sets[0]?.w ?? "";
  const s1l = sets[0]?.l ?? "";
  const s2w = sets[1]?.w ?? "";
  const s2l = sets[1]?.l ?? "";
  const s3w = sets[2]?.w ?? "";
  const s3l = sets[2]?.l ?? "";

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
              <td class="teamcell winner">${esc(winner)}</td>
              <td>${esc(s1w)}</td>
              <td>${esc(s2w)}</td>
              <td>${esc(s3w)}</td>
            </tr>
            <tr>
              <td class="teamcell">${esc(loser)}</td>
              <td>${esc(s1l)}</td>
              <td>${esc(s2l)}</td>
              <td>${esc(s3l)}</td>
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
        <td class="c-num">${esc(r.pp)}</td>
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
              <th class="c-num">PP</th>
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
          PP: Partidos Perdidos ·
          Des: Descansos ·
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

function renderBracket(elId, data){
  const bracket = data.bracket || {};
  const semis = bracket.semifinals || [];
  const final = bracket.final || null;
  const champion = data.champion || "Pendiente";

  const semisHtml = semis.length ? `
    <ul>
      ${semis.map(s => {
        const res = s.result ? ` — <b>${esc(s.result)}</b>` : "";
        return `<li><b>${esc(s.label)}</b>: ${esc(s.a)} vs ${esc(s.b)}${res}</li>`;
      }).join("")}
    </ul>
  ` : `<p class="muted">Pendiente</p>`;

  const finalHtml = final ? `
    <p>${esc(final.a)} vs ${esc(final.b)} ${final.result ? `— <b>${esc(final.result)}</b>` : ""}</p>
  ` : `<p class="muted">Pendiente</p>`;

  document.getElementById(elId).innerHTML = `
    <div style="display:grid;gap:10px">
      <div><b>Semifinales</b>${semisHtml}</div>
      <div><b>Final</b>${finalHtml}</div>
      <div style="font-size:18px"><b>Campeón:</b> ${esc(champion)}</div>
    </div>
  `;
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
  renderBracket("bracket", data);

}).catch(err => {
  document.getElementById("updated").textContent = "Error cargando datos";
  document.getElementById("groupZ").innerHTML = `<p>${esc(err.message)}</p>`;
  document.getElementById("groupY").innerHTML = "";
  document.getElementById("bracket").innerHTML = "";
});

