async function load() {
  const res = await fetch("./standings.json", { cache: "no-store" });
  if (!res.ok) throw new Error("No se pudo cargar standings.json");
  return await res.json();
}

function esc(s){ return String(s ?? "").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;"); }

function render(data){
  document.getElementById("updated").textContent =
    `Última actualización: ${data.updated_at || "—"}`;

  // Vista general (grupos)
  const y = (data.groups?.Y || []).map(t => `<span class="pill">${esc(t)}</span>`).join("");
  const z = (data.groups?.Z || []).map(t => `<span class="pill">${esc(t)}</span>`).join("");
  document.getElementById("overview").innerHTML = `
    <div><b>Grupo Y:</b> ${y || "—"}</div>
    <div style="margin-top:6px"><b>Grupo Z:</b> ${z || "—"}</div>
    <div style="margin-top:10px"><b>Campeón:</b> ${esc(data.champion || "Pendiente")}</div>
  `;

  // Partidos
  const matches = data.matches || [];
  document.getElementById("matches").innerHTML = matches.length ? `
    <table>
      <thead><tr>
        <th>Fase</th><th>Grupo</th><th>Equipo A</th><th>Equipo B</th><th>Sets</th><th>Juegos</th>
      </tr></thead>
      <tbody>
        ${matches.map(m => `
          <tr>
            <td>${esc(m.stage)}</td>
            <td>${esc(m.group)}</td>
            <td>${esc(m.teamA)}</td>
            <td>${esc(m.teamB)}</td>
            <td>${esc(m.setsA)}-${esc(m.setsB)}</td>
            <td>${esc(m.gamesA)}-${esc(m.gamesB)}</td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  ` : `<p class="muted">Aún no hay partidos.</p>`;

  // Clasificación
  const standings = data.standings || {};
  function standingsTable(rows){
    if (!rows?.length) return `<p class="muted">—</p>`;
    return `
      <table>
        <thead><tr>
          <th>Pos</th><th>Equipo</th><th>PJ</th><th>V</th><th>D</th><th>Dif Sets</th><th>Dif Juegos</th>
        </tr></thead>
        <tbody>
          ${rows.map(r => `
            <tr>
              <td>${esc(r.pos)}</td><td>${esc(r.team)}</td><td>${esc(r.pj)}</td>
              <td>${esc(r.w)}</td><td>${esc(r.l)}</td>
              <td>${esc(r.dif_sets)}</td><td>${esc(r.dif_games)}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    `;
  }
  document.getElementById("standings").innerHTML = `
    <div class="grid2">
      <div>
        <h3 style="margin:0 0 8px 0;font-size:16px">Grupo Y</h3>
        ${standingsTable(standings.Y)}
      </div>
      <div>
        <h3 style="margin:0 0 8px 0;font-size:16px">Grupo Z</h3>
        ${standingsTable(standings.Z)}
      </div>
    </div>
  `;

  // Cruces
  const bracket = data.bracket || {};
  const semis = bracket.semifinals || [];
  const final = bracket.final || null;

  document.getElementById("bracket").innerHTML = `
    <div><b>Semifinales</b></div>
    ${semis.length ? `<ul>
      ${semis.map(s => `<li>${esc(s.label)}: ${esc(s.a)} vs ${esc(s.b)} ${s.result ? `→ <b>${esc(s.result)}</b>` : ""}</li>`).join("")}
    </ul>` : `<p class="muted">Pendiente</p>`}
    <div style="margin-top:10px"><b>Final</b></div>
    ${final ? `<p>${esc(final.a)} vs ${esc(final.b)} ${final.result ? `→ <b>${esc(final.result)}</b>` : ""}</p>` : `<p class="muted">Pendiente</p>`}
  `;
}

load().then(render).catch(err => {
  document.getElementById("overview").textContent = "Error cargando datos.";
  document.getElementById("matches").textContent = err.message;
  document.getElementById("standings").textContent = "";
  document.getElementById("bracket").textContent = "";
});
