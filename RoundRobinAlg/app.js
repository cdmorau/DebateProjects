// == || CONFIGURA ESTAS URLS SI LO CONECTAS A SHEETS! || ==
//const URL_PARTICIPANTES = "...";
//const URL_ENFRENTAMIENTOS = "...";

// Para pruebas locales, empieza con una lista básica (puedes cargar de Sheet después)
let PARTICIPANTES_ORIG = [
  { nombre: "A", disponible: true },
  { nombre: "B", disponible: false },
  { nombre: "C", disponible: true },
  { nombre: "D", disponible: true },
  { nombre: "E", disponible: true },
  { nombre: "F", disponible: true },
  { nombre: "G", disponible: true },
  { nombre: "H", disponible: true }
];

let ENFRENTAMIENTOS_ORIG = [
  {nombre1:"A",nombre2:"B",veces:0}, {nombre1:"A",nombre2:"C",veces:1},
  {nombre1:"B",nombre2:"C",veces:0}, {nombre1:"A",nombre2:"D",veces:0},
  // agrega más según quieras...
];

class Participante {
  constructor(nombre, disponible) {
    this.nombre = nombre;
    this.disponible = disponible;
    this.enfrentamientos = {};
  }
}
let participantes = [];
let enfrentamientosBase = [];

// ---- Inicialización (en memoria) ----
function iniciarDatos() {
  participantes = [];
  PARTICIPANTES_ORIG.forEach(p => {
    participantes.push(new Participante(p.nombre, p.disponible));
  });
  // Inicializar enfrentamientos a 0
  participantes.forEach(p => {
    participantes.forEach(q => {
      if (p.nombre !== q.nombre) p.enfrentamientos[q.nombre] = 0;
    });
  });
  // Cargar enfrentamientos reales
  ENFRENTAMIENTOS_ORIG.forEach(fila => {
    let p1 = participantes.find(x => x.nombre === fila.nombre1);
    let p2 = participantes.find(x => x.nombre === fila.nombre2);
    if (p1 && p2 && p1.nombre !== p2.nombre) {
      p1.enfrentamientos[p2.nombre] = fila.veces;
      p2.enfrentamientos[p1.nombre] = fila.veces;
    }
  });
}

function renderParticipantes() {
  let cont = document.getElementById("lista-participantes");
  cont.innerHTML = "";
  participantes.forEach((p, idx) => {
    let div = document.createElement("div");
    div.className = "part-item";
    let cb = document.createElement("input");
    cb.type = "checkbox";
    cb.checked = p.disponible;
    cb.onchange = () => { p.disponible = cb.checked; };
    div.appendChild(cb);
    let txt = document.createElement("span");
    txt.textContent = p.nombre;
    div.appendChild(txt);

    // Botón borrar (opcional)
    let del = document.createElement("button");
    del.innerHTML = "×";
    del.style.border = "none";
    del.style.background = "#eee";
    del.style.color = "#888";
    del.style.cursor = "pointer";
    del.style.marginLeft = "8px";
    del.onclick = () => {
      participantes.splice(idx,1);
      renderParticipantes();
    }
    div.appendChild(del);

    cont.appendChild(div);
  });
  if (participantes.length === 0)
    cont.innerHTML = "<i>No hay participantes aún</i>";
}

// Formulario de agregar participante
document.addEventListener("DOMContentLoaded", ()=>{
  iniciarDatos();
  renderParticipantes();

  document.getElementById("form-participante").onsubmit = ev => {
    ev.preventDefault();
    let nombre = document.getElementById("nuevo-nombre").value.trim();
    if (!nombre) return;
    if (participantes.some(p=>p.nombre === nombre)) {
      alert("¡Ese participante ya existe!");
      return;
    }
    let p = new Participante(nombre, true);
    // Inicializar enfrentamientos con actuales
    participantes.forEach(q=>{
      if (q.nombre !== p.nombre) {
        p.enfrentamientos[q.nombre]=0;
        q.enfrentamientos[p.nombre]=0;
      }
    });
    participantes.push(p);
    renderParticipantes();
    document.getElementById("nuevo-nombre").value = "";
  };
});

// Algoritmo de emparejamientos
function mejoresEmparejamientos(participantes, tamGrupo=4) {
  let disponibles = participantes.filter(p=>p.disponible);
  let tot = Math.floor(disponibles.length/tamGrupo)*tamGrupo;
  disponibles = disponibles.slice(0, tot);
  let grupos = [];
  let usados = new Set();

  while (disponibles.length - usados.size >= tamGrupo) {
    let candidatos = disponibles.filter(p=>!usados.has(p.nombre));
    let combinaciones = getCombinations(candidatos, tamGrupo);
    let mejor, mejorScore;
    for (let combo of combinaciones) {
      let score = 0;
      for (let i=0; i<combo.length; i++) for (let j=i+1; j<combo.length; j++)
        score += combo[i].enfrentamientos[combo[j].nombre];
      if (mejorScore === undefined || score < mejorScore) {
        mejor = combo;
        mejorScore = score;
      }
    }
    if (mejor) {
      grupos.push(mejor.map(p=>p.nombre));
      for (let i=0;i<mejor.length;i++) for (let j=i+1;j<mejor.length;j++) {
        mejor[i].enfrentamientos[mejor[j].nombre]++;
        mejor[j].enfrentamientos[mejor[i].nombre]++;
      }
      mejor.forEach(p=>usados.add(p.nombre));
    } else break;
  }
  return grupos;
}

// Helper: combinaciones de tamaño k
function getCombinations(arr, k) {
  let res = [];
  function backtrack(start, temp) {
    if (temp.length === k) { res.push([...temp]); return; }
    for (let i=start;i<arr.length;i++) {
      temp.push(arr[i]);
      backtrack(i+1,temp);
      temp.pop();
    }
  }
  backtrack(0,[]);
  return res;
}

// Botón principal
document.getElementById('generar').onclick = function() {
  const output = document.getElementById('output');
  let grupos = mejoresEmparejamientos(participantes, 4);
  if (!grupos.length)
    output.innerHTML = "<p>No hay suficientes participantes disponibles.</p>";
  else {
    let html = `<table><tr><th>Grupo</th><th>Participantes</th></tr>`;
    grupos.forEach((g,i)=>{ html+=`<tr><td>${i+1}</td><td>${g.join(", ")}</td></tr>`; });
    html+=`</table>`;
    output.innerHTML = html;
  }
};