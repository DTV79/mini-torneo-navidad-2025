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

function renderTeams(elId, teams){
  const html = (teams || []).map(t => `<span class="pill">${esc(t)}</span>`).join("");
  document.getElementById(elId).innerHTML = html || `<span class="muted">—</span>`;
}

function matchCard(m){
  // En tu JSON actual vienen como winner/loser o como teamA/teamB?
  // Nuestra web de antes usaba teamA/teamB/setsA/setsB...
  // Aquí soportamos ambos formatos.
  const winner = m.winner ?? m.teamA;
  const loser  = m.loser  ?? m.teamB;

  const setsW = m.sets_w ?? m.setsA;
  const setsL = m.sets_l ?? m.setsB;
  const gamesW = m.games_w ?? m.gamesA;
  const gamesL = m.games_l ?? m.gamesB;

  return `
    <div class="matchcard">
      <div class="teamscol">
        <div class="teamrow winner">
          <span class="name">${esc(winner)}</span>
          <span class="badge">Ganador</span>
        </div>
        <div class="teamrow loser">
          <span class="name">${esc(loser)}</span>
        </div>
      </div>

      <div class="scorecol">
        <div class="scorehead">
          <div>SETS</div><div>JUEGOS</div>
        </div>
        <div class="scorerow">
          <div>${esc(setsW)}-${esc(setsL)}</div>
          <div>${esc(gamesW)}-${esc(gamesL)}</div>
        </div>
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
  if (!rows || !rows.length){
    document.getElementById(elId).innerHTML = `<p class="muted">—</p>`;
    return;
  }

  // esperamos formato: {pos, team, pj, w, l, dif_sets, dif_games}
  const body = rows.map(r => {
    const qualify = (r.pos === 1 || r.pos === 2) ? "qualify" : "";
    return `
      <tr class="${qualify}">
        <td>${esc(r.pos)}</td>
        <td>${esc(r.team)}</td>
        <td>${esc(r.pj)}</td>
        <td>${esc(r.w)}</td>
        <td>${esc(r.l)}</td>
        <td>${esc(r.dif_sets)}</td>
        <td>${esc(r.dif_games)}</td>
      </tr>
    `;
  }).join("");

  const html = `
    <div class="standings">
      <table>
        <thead>
          <tr>
            <th>Pos</th><th>Equipo</th><th>PJ</th><th>V</th><th>D</th><th>Dif Sets</th><th>Dif Juegos</th>
          </tr>
        </thead>
        <tbody>${body}</tbody>
      </table>
    </div>
  `;
  document.getElementById(elId).innerHTML = html;
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
    `Última actualización: ${data.updated_at || "—"}`;

  // Equipos
  renderTeams("teamsZ", data.groups?.Z || []);
  renderTeams("teamsY", data.groups?.Y || []);

  // Partidos: solo liguilla jugada por grupo
  const all = data.matches || [];
  const played = all.filter(m => {
    // considera jugado si hay sets/juegos numéricos
    const a = (m.setsA ?? m.sets_w);
    const b = (m.setsB ?? m.sets_l);
    const ga = (m.gamesA ?? m.games_w);
    const gb = (m.gamesB ?? m.games_l);
    return [a,b,ga,gb].every(v => v !== null && v !== undefined && v !== "");
  });

  const matchesZ = played.filter(m => (m.group === "Z") || (m.Grupo === "Z") || (m.group === undefined && false));
  const matchesY = played.filter(m => (m.group === "Y") || (m.Grupo === "Y") || (m.group === undefined && false));

  // Si tus matches no traen group pero sí podemos inferir por equipos, lo haremos más adelante.
  renderMatches("matchesZ", matchesZ);
  renderMatches("matchesY", matchesY);

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

