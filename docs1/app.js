// == CONFIGURA ESTAS URLS PARA CARGAR DESDE GOOGLE SHEETS ==
const URL_APPS_SCRIPT = "https://script.google.com/macros/s/AKfycbysNCalVTQZWuSVFR3hCjnb91KkbrBCuNRydK2Bj_ns5pOtqqvzdBHALVyYlpKYSsD65w/exec"

// Datos locales para cuando no hay conexión
let PARTICIPANTES_ORIG = [
    { nombre: "A", disponible: true },
    { nombre: "B", disponible: true },
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
    {nombre1:"B",nombre2:"D",veces:1}, {nombre1:"C",nombre2:"D",veces:0},
    {nombre1:"E",nombre2:"F",veces:0}, {nombre1:"E",nombre2:"G",veces:0},
    {nombre1:"F",nombre2:"G",veces:0}, {nombre1:"E",nombre2:"H",veces:0},
    {nombre1:"F",nombre2:"H",veces:0}, {nombre1:"G",nombre2:"H",veces:0}
];

class Participante {
  constructor(nombre, disponible) {
    this.nombre = nombre;
    this.disponible = disponible;
    this.enfrentamientos = {};
    this.conteoRoles = {
      ag: 0,
      ao: 0,
      bg: 0,
      bo: 0
    };
  }
}
let participantes = [];
let enfrentamientosBase = [];

// ---- Inicialización (en memoria) ----
function iniciarDatos() {
  console.log("Iniciando datos con:", PARTICIPANTES_ORIG);
  participantes = [];
  PARTICIPANTES_ORIG.forEach(p => {
      participantes.push(new Participante(p.nombre, true));
  });
  console.log("Participantes inicializados:", participantes);
  
  // Inicializar enfrentamientos a 0
  participantes.forEach(p => {
      participantes.forEach(q => {
          if (p.nombre !== q.nombre) p.enfrentamientos[q.nombre] = 0;
      });
  });
  
  // Cargar enfrentamientos reales
  console.log("Cargando enfrentamientos:", ENFRENTAMIENTOS_ORIG);
  ENFRENTAMIENTOS_ORIG.forEach(fila => {
      let p1 = participantes.find(x => x.nombre === fila.nombre1);
      let p2 = participantes.find(x => x.nombre === fila.nombre2);
      if (p1 && p2 && p1.nombre !== p2.nombre) {
          p1.enfrentamientos[p2.nombre] = fila.veces;
          p2.enfrentamientos[p1.nombre] = fila.veces;
      }
  });

  // Actualizar conteos de roles basado en emparejamientos existentes
  actualizarConteoRoles();
  
  console.log("Datos finales:", participantes);
}

function renderParticipantes() {
  let cont = document.getElementById("lista-participantes");
  cont.innerHTML = "";
  participantes.forEach((p, idx) => {
    let div = document.createElement("div");
    div.className = "part-item";
    
    // Checkbox de disponibilidad
    let cb = document.createElement("input");
    cb.type = "checkbox";
    cb.checked = p.disponible;
    cb.onchange = async () => { 
      p.disponible = cb.checked;
      await actualizarDisponibilidad(p.nombre, cb.checked);
    };
    div.appendChild(cb);
    
    // Nombre del participante
    let txt = document.createElement("span");
    txt.textContent = p.nombre;
    div.appendChild(txt);

    // Botón eliminar
    let del = document.createElement("button");
    del.innerHTML = "×";
    del.style.border = "none";
    del.style.background = "#ff4444";
    del.style.color = "white";
    del.style.cursor = "pointer";
    del.style.marginLeft = "8px";
    del.style.padding = "2px 8px";
    del.style.borderRadius = "3px";
    del.onclick = () => eliminarParticipante(p.nombre);
    div.appendChild(del);

    cont.appendChild(div);
  });
  if (participantes.length === 0)
    cont.innerHTML = "<i>No hay participantes aún</i>";
}

// Función para actualizar la tabla de participantes
function actualizarTablaParticipantes() {
  actualizarConteoRoles();
}

// Función para actualizar la tabla de enfrentamientos
function actualizarTablaEnfrentamientos(emparejamientos) {
  const tbody = document.querySelector('#tabla-enfrentamientos tbody');
  tbody.innerHTML = '';
  
  // Crear un mapa para contar enfrentamientos
  const enfrentamientosMap = new Map();
  
  // Procesar cada emparejamiento para contar enfrentamientos
  emparejamientos.forEach(emp => {
      const participantes = [emp.ag, emp.ao, emp.bg, emp.bo].filter(p => p); // Filtrar valores vacíos
      
      // Generar todas las combinaciones posibles de 2 participantes
      for (let i = 0; i < participantes.length; i++) {
          for (let j = i + 1; j < participantes.length; j++) {
              const p1 = participantes[i];
              const p2 = participantes[j];
              const key = [p1, p2].sort().join('|'); // Ordenar para evitar duplicados
              
              // Incrementar el contador de enfrentamientos
              enfrentamientosMap.set(key, (enfrentamientosMap.get(key) || 0) + 1);
          }
      }
  });
  
  // Convertir el mapa a un array y ordenar por número de enfrentamientos
  const enfrentamientosArray = Array.from(enfrentamientosMap.entries())
      .map(([key, veces]) => {
          const [p1, p2] = key.split('|');
          return { p1, p2, veces };
      })
      .sort((a, b) => b.veces - a.veces); // Ordenar de mayor a menor
  
  // Llenar la tabla
  enfrentamientosArray.forEach(enf => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
          <td>${enf.p1}</td>
          <td>${enf.p2}</td>
          <td>${enf.veces}</td>
      `;
      tbody.appendChild(tr);
  });
}

// Función para actualizar la tabla de emparejamientos
function actualizarTablaEmparejamientos(emparejamientos) {
  const tbody = document.querySelector('#tabla-emparejamientos tbody');
  tbody.innerHTML = '';
  
  emparejamientos.forEach(emp => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
          <td>${emp.ag || '-'}</td>
          <td>${emp.ao || '-'}</td>
          <td>${emp.bg || '-'}</td>
          <td>${emp.bo || '-'}</td>
          <td>
              <button class="boton-eliminar" onclick="eliminarEmparejamiento('${emp.grupo}')">×</button>
          </td>
      `;
      tbody.appendChild(tr);
  });

  // Actualizar el conteo de roles después de actualizar la tabla de emparejamientos
  actualizarConteoRoles();
}

// Función para actualizar la tabla de conteo de roles
function actualizarTablaConteoRoles(emparejamientos) {
  const tbody = document.querySelector('#tabla-conteo-roles tbody');
  tbody.innerHTML = '';

  // Crear un mapa para contar apariciones en cada rol
  const conteoRoles = new Map();

  // Inicializar el conteo para todos los participantes
  participantes.forEach(p => {
      conteoRoles.set(p.nombre, {
          ag: 0,
          ao: 0,
          bg: 0,
          bo: 0,
          total: 0
      });
  });

  // Contar apariciones en cada rol en TODOS los emparejamientos históricos
  // emparejamientos debe ser el historial completo (result.emparejamientos)
  emparejamientos.forEach(emp => {
      ['ag', 'ao', 'bg', 'bo'].forEach(rol => {
          const participante = emp[rol];
          if (participante) {
              const conteo = conteoRoles.get(participante);
              if (conteo) {
                  conteo[rol]++;
                  conteo.total++;
              }
          }
      });
  });

  // Convertir el mapa a array y ordenar por total de apariciones
  const conteoArray = Array.from(conteoRoles.entries())
      .map(([nombre, conteo]) => ({
          nombre,
          ...conteo
      }))
      .sort((a, b) => b.total - a.total);

  // Llenar la tabla
  conteoArray.forEach(participante => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
          <td>${participante.nombre}</td>
          <td>${participante.ag}</td>
          <td>${participante.ao}</td>
          <td>${participante.bg}</td>
          <td>${participante.bo}</td>
          <td>${participante.total}</td>
      `;
      tbody.appendChild(tr);
  });
}

// Función para cargar datos desde Google Sheets
async function cargarDesdeSheets() {
    try {
        console.log("Intentando cargar datos desde Apps Script...");
        const response = await fetch(`${URL_APPS_SCRIPT}?action=obtenerDatos`);
        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }
        const result = await response.json();
        
        if (result.success) {
            PARTICIPANTES_ORIG = result.participantes.map(p => ({
                nombre: p.nombre,
                disponible: p.disponible === 'TRUE'
            }));
            console.log("Participantes procesados:", PARTICIPANTES_ORIG);
            
            ENFRENTAMIENTOS_ORIG = result.enfrentamientos.map(e => ({
                nombre1: e.nombre1,
                nombre2: e.nombre2,
                veces: parseInt(e.veces) || 0
            }));
            console.log("Enfrentamientos procesados:", ENFRENTAMIENTOS_ORIG);

            // Actualizar las tablas
            iniciarDatos();
            actualizarTablaParticipantes();
            actualizarTablaEnfrentamientos(result.emparejamientos || []);
            actualizarTablaEmparejamientos(result.emparejamientos || []);
            actualizarTablaConteoRoles(result.emparejamientos || []);
            
            return result;
        } else {
            throw new Error(result.error || "Error desconocido al cargar datos");
        }
    } catch (error) {
        console.warn("Error cargando datos:", error.message);
        console.log("Usando datos locales como respaldo");
        // Inicializar con datos locales
        iniciarDatos();
        actualizarTablaParticipantes();
    }
}

// Función para actualizar disponibilidad
async function actualizarDisponibilidad(nombre, disponible) {
    const participante = participantes.find(p => p.nombre === nombre);
    if (participante) {
        participante.disponible = disponible;
        
        try {
            const response = await fetch(`${URL_APPS_SCRIPT}?action=actualizarDisponibilidad&nombre=${encodeURIComponent(nombre)}&disponible=${disponible}`);
            const result = await response.json();
            
            if (!result.success) {
                console.warn('Error al actualizar disponibilidad:', result.error);
                // Revertir el cambio en la interfaz
                participante.disponible = !disponible;
                actualizarTablaParticipantes();
            }
        } catch (error) {
            console.warn("Error actualizando disponibilidad:", error.message);
            // Revertir el cambio en la interfaz
            participante.disponible = !disponible;
            actualizarTablaParticipantes();
        }
    }
}

// Función para agregar participante
async function agregarParticipante(nombre) {
    if (!nombre.trim()) return;
    
    // Verificar si ya existe
    if (participantes.some(p => p.nombre === nombre)) {
        alert("Ya existe un participante con ese nombre.");
        return;
    }

    try {
        // Llamar a la función de Apps Script con disponible=true por defecto
        const response = await fetch(`${URL_APPS_SCRIPT}?action=agregarParticipante&nombre=${encodeURIComponent(nombre)}&disponible=true`);
        const result = await response.json();
        
        if (result.success) {
            const nuevoParticipante = new Participante(nombre, true);
            participantes.push(nuevoParticipante);

            // Inicializar enfrentamientos para el nuevo participante
            participantes.forEach(p => {
                if (p.nombre !== nombre) {
                    p.enfrentamientos[nombre] = 0;
                    nuevoParticipante.enfrentamientos[p.nombre] = 0;
                }
            });

            actualizarTablaParticipantes();
            document.getElementById('nuevo-nombre').value = '';
        } else {
            throw new Error(result.error || "Error al agregar participante");
        }
    } catch (error) {
        console.warn("Error agregando participante:", error.message);
        alert("Error al agregar participante. Por favor, intenta de nuevo.");
    }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    cargarDesdeSheets(); // Cargar datos al iniciar
    
    // Form para agregar participante
    document.getElementById('form-participante').addEventListener('submit', (e) => {
        e.preventDefault();
        const nombre = document.getElementById('nuevo-nombre').value;
        agregarParticipante(nombre);
    });
    
    document.getElementById('generar').addEventListener('click', generarEmparejamientos);
    document.getElementById('confirmar-emparejamientos').addEventListener('click', confirmarEmparejamientos);
    document.getElementById('cancelar-emparejamientos').addEventListener('click', () => {
        document.getElementById('emparejamientos-edicion').style.display = 'none';
    });
});

// Algoritmo de emparejamientos mejorado
function mejoresEmparejamientos(participantes, tamGrupo=4) {
  // Función auxiliar para calcular total
  function calcularTotal(p) {
    const total = Object.values(p.conteoRoles).reduce((sum, val) => sum + val, 0);
    console.log(`Total para ${p.nombre}:`, JSON.stringify(p.conteoRoles), "=", total);
    return total;
  }

  // 1. Filtrar participantes disponibles
  let disponibles = participantes.filter(p => p.disponible);
  console.log("=== INICIO DEL PROCESO ===");
  console.log("Total de participantes disponibles:", disponibles.length);
  
  // 2. Ordenar participantes por total de forma ascendente
  disponibles.sort((a, b) => {
    const totalA = calcularTotal(a);
    const totalB = calcularTotal(b);
    return totalA - totalB;
  });

  console.log("=== PARTICIPANTES ORDENADOS ===");
  console.log("Orden de disponibles:", disponibles.map(p => ({
    nombre: p.nombre,
    total: calcularTotal(p)
  })));

  // 3. Calcular cuántos grupos completos podemos formar
  const numGruposCompletos = Math.floor(disponibles.length / tamGrupo);
  const participantesNecesarios = numGruposCompletos * tamGrupo;
  
  console.log("=== CÁLCULO DE GRUPOS ===");
  console.log("Número de grupos completos:", numGruposCompletos);
  console.log("Participantes necesarios:", participantesNecesarios);
  
  // 4. Seleccionar solo los participantes necesarios
  disponibles = disponibles.slice(0, participantesNecesarios);
  console.log("=== PARTICIPANTES SELECCIONADOS ===");
  console.log("Participantes para formar grupos:", disponibles.map(p => ({
    nombre: p.nombre,
    total: calcularTotal(p)
  })));

  // 5. Inicializar array para los grupos
  let grupos = [];
  let usados = new Set();

  // 6. Formar los grupos
  while (disponibles.length - usados.size >= tamGrupo) {
    let candidatos = disponibles.filter(p => !usados.has(p.nombre));
    console.log("=== FORMANDO NUEVO GRUPO ===");
    console.log("Candidatos disponibles:", candidatos.map(p => ({
      nombre: p.nombre,
      total: calcularTotal(p)
    })));
    
    let combinaciones = getCombinations(candidatos, tamGrupo);
    let mejor, mejorScore;

    for (let combo of combinaciones) {
      let score = 0;
      let tieneEnfrentamientos = false;
      
      // Verificar enfrentamientos previos
      for (let i = 0; i < combo.length; i++) {
        for (let j = i + 1; j < combo.length; j++) {
          const enfrentamientosPrevios = combo[i].enfrentamientos[combo[j].nombre] || 0;
          if (enfrentamientosPrevios > 0) {
            tieneEnfrentamientos = true;
            score += Math.pow(2, enfrentamientosPrevios) * 1000;
          }
        }
      }

      if (!tieneEnfrentamientos) {
        score = 0;
      }
      
      if (mejorScore === undefined || score < mejorScore) {
        mejor = combo;
        mejorScore = score;
      }
    }

    if (mejor) {
      console.log("Mejor combinación encontrada:", mejor.map(p => ({
        nombre: p.nombre,
        total: calcularTotal(p)
      })));
      
      // Ordenar participantes por total de participaciones (más participaciones primero)
      mejor.sort((a, b) => {
        const totalA = calcularTotal(a);
        const totalB = calcularTotal(b);
        return totalB - totalA;
      });

      // Determinar las posiciones basadas en roles
      const roles = ['ag', 'ao', 'bg', 'bo'];
      const posiciones = new Array(tamGrupo).fill(null);
      const participantesRestantes = [...mejor];

      // Asignar posiciones en orden de mayor a menor participación total
      for (let i = 0; i < participantesRestantes.length; i++) {
        const participante = participantesRestantes[i];
        const rolesDisponibles = roles.filter((_, idx) => posiciones[idx] === null);
        
        // Encontrar el rol con menor conteo para este participante
        let mejorRol = rolesDisponibles[0];
        let menorConteo = participante.conteoRoles[mejorRol];
        
        for (let rol of rolesDisponibles) {
          if (participante.conteoRoles[rol] < menorConteo) {
            mejorRol = rol;
            menorConteo = participante.conteoRoles[rol];
          }
        }
        
        // Asignar la posición
        const posicionIndex = roles.indexOf(mejorRol);
        posiciones[posicionIndex] = participante.nombre;
      }

      // Crear el grupo con las posiciones asignadas
      const grupo = {
        ag: posiciones[0],
        ao: posiciones[1],
        bg: posiciones[2],
        bo: posiciones[3]
      };
      grupos.push(grupo);
      console.log("Grupo formado:", grupo);
      
      // Actualizar enfrentamientos en memoria
      for (let i = 0; i < mejor.length; i++) {
        for (let j = i + 1; j < mejor.length; j++) {
          mejor[i].enfrentamientos[mejor[j].nombre] = (mejor[i].enfrentamientos[mejor[j].nombre] || 0) + 1;
          mejor[j].enfrentamientos[mejor[i].nombre] = (mejor[j].enfrentamientos[mejor[i].nombre] || 0) + 1;
        }
      }
      mejor.forEach(p => usados.add(p.nombre));
    } else break;
  }

  console.log("=== GRUPOS FINALES ===");
  console.log("Grupos formados:", grupos);
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

// Función para crear un selector de participantes con contador de roles
function crearSelectorParticipantes(participantes, valorSeleccionado = '', rol) {
  const container = document.createElement('div');
  container.className = 'selector-container';

  const select = document.createElement('select');
  select.innerHTML = '<option value="">Seleccionar...</option>';

  const contador = document.createElement('div');
  contador.className = 'contador-roles';
  contador.style.fontSize = '0.8em';
  contador.style.color = '#666';
  contador.style.marginTop = '2px';
  contador.style.minHeight = '1.2em';

  // Función para obtener el conteo de roles desde la tabla
  function obtenerConteoDesdeTabla(nombre, rol) {
    const filas = document.querySelectorAll('#tabla-participantes tbody tr');
    console.log('Buscando conteo para:', nombre, 'rol:', rol);
    for (let row of filas) {
        const celdas = row.querySelectorAll('td');
        const nombreEnTabla = celdas[0].textContent.trim();
        console.log('Comparando con nombre en tabla:', nombreEnTabla);
        if (celdas.length >= 6 && nombreEnTabla === nombre) {
            // AG=1, AO=2, BG=3, BO=4
            const idx = { ag: 2, ao: 3, bg: 4, bo: 5 }[rol];
            const valor = parseInt(celdas[idx].textContent.trim(), 10) || 0;
            console.log('Encontrado valor:', valor, 'para rol:', rol);
            return valor;
        }
    }
    console.log('No se encontró conteo para:', nombre);
    return 0;
  }

  // Función local para actualizar el contador
  function actualizarContador(nombre) {
    if (!nombre) {
      contador.textContent = '';
      return;
    }
    const veces = obtenerConteoDesdeTabla(nombre, rol);
    contador.textContent = `Veces en ${rol.toUpperCase()}: ${veces}`;
  }

  participantes
    .filter(p => p.disponible)
    .forEach(p => {
      const option = document.createElement('option');
      option.value = p.nombre;
      option.textContent = p.nombre;
      if (p.nombre === valorSeleccionado) {
        option.selected = true;
      }
      select.appendChild(option);
    });

  // Mostrar contador inicial
  actualizarContador(valorSeleccionado);

  // Actualizar contador cuando cambia la selección
  select.onchange = () => {
    actualizarContador(select.value);
  };

  container.appendChild(select);
  container.appendChild(contador);
  return container;
}

// Función para crear la interfaz de edición de grupos
function crearInterfazEdicionGrupos(grupos) {
  const container = document.getElementById('grupos-container');
  container.innerHTML = '';
  grupos.forEach((grupo, idx) => {
    const div = document.createElement('div');
    div.className = 'grupo-edicion';
    div.innerHTML = `<h4>Grupo ${idx + 1}</h4>`;

    // Crear grid 3x3 para selectores y swaps
    const grid = document.createElement('div');
    grid.className = 'grupo-grid';
    grid.style.display = 'grid';
    grid.style.gridTemplateColumns = '1fr 28px 1fr';
    grid.style.gridTemplateRows = '1fr 32px 1fr';
    grid.style.gap = '0.2rem';
    grid.style.justifyItems = 'center';
    grid.style.alignItems = 'center';
    grid.style.margin = '0.5rem auto 0.5rem auto';
    grid.style.maxWidth = '520px';

    // Crear selectores
    const roles = ['ag', 'ao', 'bg', 'bo'];
    const labels = ['AG:', 'AO:', 'BG:', 'BO:'];
    const posiciones = [
      [0, 0], // AG
      [0, 2], // AO
      [2, 0], // BG
      [2, 2]  // BO
    ];
    const selectRefs = [];
    for (let i = 0; i < 4; i++) {
      const participanteDiv = document.createElement('div');
      participanteDiv.className = 'participante participante-compacta';
      participanteDiv.style.display = 'flex';
      participanteDiv.style.flexDirection = 'column';
      participanteDiv.style.alignItems = 'stretch';
      participanteDiv.style.padding = '0.4em 0.7em 0.6em 0.7em';
      participanteDiv.style.minWidth = '100px';
      participanteDiv.style.maxWidth = '210px';
      participanteDiv.style.margin = '0';
      const label = document.createElement('label');
      label.textContent = labels[i];
      label.style.marginBottom = '0.15em';
      label.style.fontSize = '1em';
      const selector = crearSelectorParticipantes(participantes, grupo[roles[i]] || '', roles[i]);
      selector.querySelector('select').style.minHeight = '28px';
      selector.querySelector('select').style.fontSize = '1em';
      selector.querySelector('select').style.padding = '0.2em 0.5em';
      participanteDiv.appendChild(label);
      participanteDiv.appendChild(selector);
      participanteDiv.style.gridRow = posiciones[i][0] + 1;
      participanteDiv.style.gridColumn = posiciones[i][1] + 1;
      grid.appendChild(participanteDiv);
      selectRefs.push(participanteDiv.querySelector('select'));
    }
    // SVG iconos de intercambio
    const swapIconH = `<svg width="18" height="18" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M7.5 7L4.5 10L7.5 13" stroke="#16a34a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M14.5 7L17.5 10L14.5 13" stroke="#16a34a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M4.5 10H17.5" stroke="#16a34a" stroke-width="2" stroke-linecap="round"/></svg>`;
    const swapIconV = `<svg width=\"18\" height=\"18\" viewBox=\"0 0 22 22\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\"><g transform=\"rotate(90 11 11)\"><path d=\"M7.5 7L4.5 10L7.5 13\" stroke=\"#16a34a\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/><path d=\"M14.5 7L17.5 10L14.5 13\" stroke=\"#16a34a\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/><path d=\"M4.5 10H17.5\" stroke=\"#16a34a\" stroke-width=\"2\" stroke-linecap=\"round\"/></g></svg>`;
    // Botones swap
    // AG <-> AO (arriba, horizontal, pequeño)
    const swapTop = document.createElement('button');
    swapTop.innerHTML = swapIconH;
    swapTop.title = 'Intercambiar AG/AO';
    swapTop.className = 'swap-btn swap-btn-h';
    swapTop.style.gridRow = '1';
    swapTop.style.gridColumn = '2';
    swapTop.style.margin = '0';
    swapTop.onclick = () => swapSelects(selectRefs, 0, 1);
    grid.appendChild(swapTop);
    // AG <-> BG (izquierda, vertical)
    const swapLeft = document.createElement('button');
    swapLeft.innerHTML = swapIconV;
    swapLeft.title = 'Intercambiar AG/BG';
    swapLeft.className = 'swap-btn';
    swapLeft.style.gridRow = '2';
    swapLeft.style.gridColumn = '1';
    swapLeft.style.margin = '0';
    swapLeft.onclick = () => swapSelects(selectRefs, 0, 2);
    grid.appendChild(swapLeft);
    // AO <-> BO (derecha, vertical)
    const swapRight = document.createElement('button');
    swapRight.innerHTML = swapIconV;
    swapRight.title = 'Intercambiar AO/BO';
    swapRight.className = 'swap-btn';
    swapRight.style.gridRow = '2';
    swapRight.style.gridColumn = '3';
    swapRight.style.margin = '0';
    swapRight.onclick = () => swapSelects(selectRefs, 1, 3);
    grid.appendChild(swapRight);
    // BG <-> BO (abajo, horizontal, pequeño)
    const swapBottom = document.createElement('button');
    swapBottom.innerHTML = swapIconH;
    swapBottom.title = 'Intercambiar BG/BO';
    swapBottom.className = 'swap-btn swap-btn-h';
    swapBottom.style.gridRow = '3';
    swapBottom.style.gridColumn = '2';
    swapBottom.style.margin = '0';
    swapBottom.onclick = () => swapSelects(selectRefs, 2, 3);
    grid.appendChild(swapBottom);

    div.appendChild(grid);
    container.appendChild(div);
  });

  // Forzar evento change en todos los selects para actualizar el conteo de roles
  setTimeout(() => {
    document.querySelectorAll('.grupo-edicion select').forEach(select => {
      select.dispatchEvent(new Event('change'));
    });
    actualizarConteoRoles();
  }, 0);
}

function swapSelects(selectRefs, idxA, idxB) {
  const valA = selectRefs[idxA].value;
  const valB = selectRefs[idxB].value;
  selectRefs[idxA].value = valB;
  selectRefs[idxB].value = valA;
  // Disparar el evento change para actualizar contadores y unicidad
  selectRefs[idxA].dispatchEvent(new Event('change'));
  selectRefs[idxB].dispatchEvent(new Event('change'));
}

// Función para obtener los emparejamientos editados
function obtenerEmparejamientosEditados() {
  const grupos = [];
  const gruposDivs = document.querySelectorAll('.grupo-edicion');
  
  gruposDivs.forEach(grupoDiv => {
      const selects = grupoDiv.querySelectorAll('select');
      const grupo = Array.from(selects).map(select => select.value);
      grupos.push(grupo);
  });
  
  return grupos;
}

// Función para generar emparejamientos
async function generarEmparejamientos() {
  const grupos = mejoresEmparejamientos(participantes);
  if (grupos.length === 0) {
    alert("No hay suficientes participantes disponibles para generar emparejamientos.");
    return;
  }
  
  // Convertir grupos a formato de emparejamientos
  const emparejamientos = grupos.map((grupo, idx) => ({
    grupo: `G${idx + 1}`,
    ag: grupo[0] || '',
    ao: grupo[1] || '',
    bg: grupo[2] || '',
    bo: grupo[3] || ''
  }));

  // Crear y mostrar la interfaz de edición
  crearInterfazEdicionGrupos(grupos);
  document.getElementById('emparejamientos-edicion').style.display = 'block';
}

// Función para confirmar emparejamientos
async function confirmarEmparejamientos() {
  const grupos = obtenerEmparejamientosEditados();
  if (grupos.length === 0) {
    alert("No hay emparejamientos para confirmar.");
    return;
  }

  // Validar que todos los grupos tengan al menos 2 participantes
  const gruposInvalidos = grupos.filter(grupo => {
    const participantes = grupo.filter(p => p);
    return participantes.length < 2;
  });

  if (gruposInvalidos.length > 0) {
    alert("Cada grupo debe tener al menos 2 participantes.");
    return;
  }
  
  // Convertir grupos a formato de emparejamientos
  const emparejamientos = grupos.map((grupo, idx) => ({
    grupo: `G${idx + 1}`,
    ag: grupo[0] || '',
    ao: grupo[1] || '',
    bg: grupo[2] || '',
    bo: grupo[3] || ''
  }));

  try {
    // Codificar los datos para la URL
    const dataStr = encodeURIComponent(JSON.stringify(emparejamientos));
    console.log('Enviando datos a Google Sheets:', dataStr);

    // Guardar los nuevos emparejamientos
    const response = await fetch(`${URL_APPS_SCRIPT}?action=guardarEmparejamientos&data=${dataStr}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      console.error('Error response:', response);
      throw new Error(`Error al actualizar Google Sheets: ${response.status} ${response.statusText}`);
    }
    
    const result = await response.json();
    console.log('Respuesta de Google Sheets:', result);

    if (!result.success) {
      throw new Error(result.error || 'Error al guardar los emparejamientos');
    }

    // Esperar un momento para asegurar que los datos se hayan guardado
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Verificar que los datos se hayan guardado correctamente
    const verificarResponse = await fetch(`${URL_APPS_SCRIPT}?action=obtenerDatos`);
    if (!verificarResponse.ok) {
      throw new Error('Error al verificar los datos guardados');
    }
    
    const verificarResult = await verificarResponse.json();
    console.log('Datos guardados:', verificarResult);

    if (!verificarResult.success) {
      throw new Error('Error al obtener los datos guardados');
    }

    if (!verificarResult.emparejamientos || verificarResult.emparejamientos.length === 0) {
      console.error('No se encontraron emparejamientos guardados');
      throw new Error('Los emparejamientos no se guardaron correctamente');
    }

    // Procesar los emparejamientos después de guardarlos
    const procesarResponse = await fetch(`${URL_APPS_SCRIPT}?action=procesarEmparejamientos`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    });

    if (!procesarResponse.ok) {
      console.error('Error al procesar emparejamientos:', procesarResponse);
      throw new Error('Error al procesar los emparejamientos');
    }

    const procesarResult = await procesarResponse.json();
    console.log('Resultado de procesar emparejamientos:', procesarResult);

    if (!procesarResult.success) {
      throw new Error(procesarResult.error || 'Error al procesar los emparejamientos');
    }
    
    // Esperar un momento para asegurar que los datos se hayan procesado
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Recargar los datos desde Google Sheets
    await cargarDesdeSheets();
    
    // Ocultar la interfaz de edición
    document.getElementById('emparejamientos-edicion').style.display = 'none';
    alert("Emparejamientos confirmados y guardados exitosamente.");
  } catch (error) {
    console.error('Error completo:', error);
    alert('Error al guardar los emparejamientos en Google Sheets: ' + error.message);
  }
}

// Función para eliminar participante usando Apps Script
async function eliminarParticipante(nombre) {
  if (!confirm(`¿Estás seguro de que deseas eliminar a ${nombre}?`)) {
      return;
  }

  try {
      // Llamar a la función de Apps Script
      const response = await fetch(`${URL_APPS_SCRIPT}?action=eliminarParticipante&nombre=${encodeURIComponent(nombre)}`);
      const result = await response.json();
      console.log("Respuesta del servidor:", result);
      
      if (result.success) {
          alert("Participante eliminado. Por favor, haz clic en 'Actualizar Todo' para ver los cambios.");
      } else {
          alert("Error al eliminar participante. Por favor, intenta de nuevo.");
      }
  } catch (error) {
      console.error('Error al eliminar participante:', error);
      alert('Error al eliminar participante. Por favor, intenta de nuevo.');
  }
}

// Función para eliminar enfrentamiento
async function eliminarEnfrentamiento(p1, p2) {
  if (!confirm(`¿Estás seguro de que deseas eliminar el enfrentamiento entre ${p1} y ${p2}?`)) {
      return;
  }

  try {
      const response = await fetch(`${URL_APPS_SCRIPT}?action=eliminarEnfrentamiento&p1=${encodeURIComponent(p1)}&p2=${encodeURIComponent(p2)}`);
      const result = await response.json();
      
      if (result.success) {
          await cargarDesdeSheets(); // Recargar datos
      } else {
          alert("Error al eliminar enfrentamiento: " + (result.error || "Error desconocido"));
      }
  } catch (error) {
      console.error('Error al eliminar enfrentamiento:', error);
      alert('Error al eliminar enfrentamiento. Por favor, intenta de nuevo.');
  }
}

// Función para eliminar emparejamiento
async function eliminarEmparejamiento(grupo) {
  if (!confirm(`¿Estás seguro de que deseas eliminar el grupo ${grupo}?`)) {
      return;
  }

  try {
      const response = await fetch(`${URL_APPS_SCRIPT}?action=eliminarEmparejamiento&grupo=${encodeURIComponent(grupo)}`);
      const result = await response.json();
      
      if (result.success) {
          await cargarDesdeSheets(); // Recargar datos
      } else {
          alert("Error al eliminar emparejamiento: " + (result.error || "Error desconocido"));
      }
  } catch (error) {
      console.error('Error al eliminar emparejamiento:', error);
      alert('Error al eliminar emparejamiento. Por favor, intenta de nuevo.');
  }
}

// Función para obtener el conteo de roles desde la tabla de conteo de roles
function obtenerConteoRolesDesdeTabla() {
  const conteo = {};
  const filas = document.querySelectorAll('#tabla-participantes tbody tr');
  filas.forEach(row => {
    const celdas = row.querySelectorAll('td');
    if (celdas.length >= 7) {
      const nombre = celdas[0].textContent.trim();
      conteo[nombre] = {
        ag: parseInt(celdas[2].textContent.trim(), 10) || 0,
        ao: parseInt(celdas[3].textContent.trim(), 10) || 0,
        bg: parseInt(celdas[4].textContent.trim(), 10) || 0,
        bo: parseInt(celdas[5].textContent.trim(), 10) || 0,
        total: parseInt(celdas[6].textContent.trim(), 10) || 0
      };
    }
  });
  return conteo;
}

// Modificar actualizarConteoRoles para que actualice la tabla combinada
function actualizarConteoRoles() {
  // 1. Inicializar conteo
  const conteo = {};
  participantes.forEach(p => {
    conteo[p.nombre] = { ag: 0, ao: 0, bg: 0, bo: 0, total: 0 };
  });

  // Usar emparejamientos confirmados desde la tabla de enfrentamientos pasados
  const filas = document.querySelectorAll('#tabla-emparejamientos tbody tr');
  filas.forEach(row => {
    const celdas = row.querySelectorAll('td');
    if (celdas.length >= 4) {
      const roles = ['ag', 'ao', 'bg', 'bo'];
      roles.forEach((rol, idx) => {
        const nombre = celdas[idx].textContent.trim();
        if (nombre && conteo[nombre]) {
          conteo[nombre][rol]++;
          conteo[nombre].total++;
        }
      });
    }
  });

  // 3. Actualizar la tabla combinada
  const tbody = document.querySelector('#tabla-participantes tbody');
  tbody.innerHTML = '';
  
  // Ordenar participantes por total de participaciones (descendente)
  const participantesOrdenados = [...participantes].sort((a, b) => {
    const totalA = conteo[a.nombre].total;
    const totalB = conteo[b.nombre].total;
    return totalB - totalA;
  });

  participantesOrdenados.forEach(p => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
        <td>${p.nombre}</td>
        <td class="toggle-container">
            <label class="toggle-switch">
                <input type="checkbox" ${p.disponible ? 'checked' : ''} onchange="actualizarDisponibilidad('${p.nombre}', this.checked)">
                <span class="toggle-slider"></span>
            </label>
        </td>
        <td>${conteo[p.nombre].ag}</td>
        <td>${conteo[p.nombre].ao}</td>
        <td>${conteo[p.nombre].bg}</td>
        <td>${conteo[p.nombre].bo}</td>
        <td>${conteo[p.nombre].total}</td>
    `;
    tbody.appendChild(tr);
  });

  // 4. Actualizar los conteos en los objetos participantes
  participantes.forEach(p => {
    p.conteoRoles = {
      ag: conteo[p.nombre].ag,
      ao: conteo[p.nombre].ao,
      bg: conteo[p.nombre].bg,
      bo: conteo[p.nombre].bo
    };
  });
}
