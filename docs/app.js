// == CONFIGURA ESTAS URLS PARA CARGAR DESDE GOOGLE SHEETS ==
const URL_APPS_SCRIPT = "https://script.google.com/macros/s/AKfycbysNCalVTQZWuSVFR3hCjnb91KkbrBCuNRydK2Bj_ns5pOtqqvzdBHALVyYlpKYSsD65w/exec"

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
    const tbody = document.querySelector('#tabla-participantes tbody');
    tbody.innerHTML = '';
    participantes.forEach(p => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${p.nombre}</td>
            <td>${p.disponible ? 'Sí' : 'No'}</td>
            <td>
                <button class="boton-eliminar" onclick="eliminarParticipante('${p.nombre}')">×</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
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
    
    // Contar apariciones en cada rol
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

  // Función para cargar datos desde Google Sheets usando Apps Script
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
            renderParticipantes();
            actualizarTablaParticipantes();
            actualizarTablaEnfrentamientos(result.emparejamientos || []);
            actualizarTablaEmparejamientos(result.emparejamientos || []);
            actualizarTablaConteoRoles(result.emparejamientos || []);
            
            return result; // Retornar el resultado para uso posterior
        } else {
            throw new Error(result.error || "Error desconocido al cargar datos");
        }
    } catch (error) {
        console.error("Error detallado cargando datos desde Apps Script:", error);
        alert(`Error cargando datos: ${error.message}. Usando datos locales.`);
        throw error;
    }
  }
  
  // Función para esperar un tiempo determinado
  function esperar(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  // Modificar el evento DOMContentLoaded para incluir el procesamiento de emparejamientos
  document.addEventListener("DOMContentLoaded", async () => {
    try {
        await cargarDesdeSheets();
        console.log("Datos cargados, inicializando interfaz...");
        iniciarDatos();
        renderParticipantes();
        
        // Agregar botón de actualizar
        const actualizarBtn = document.createElement("button");
        actualizarBtn.className = "boton";
        actualizarBtn.textContent = "Actualizar Todo";
        actualizarBtn.onclick = async () => {
            try {
                await cargarDesdeSheets();
                iniciarDatos();
                renderParticipantes();
                actualizarTablaParticipantes();
                actualizarTablaEnfrentamientos(result.emparejamientos || []);
                actualizarTablaEmparejamientos(result.emparejamientos || []);
                actualizarTablaConteoRoles(result.emparejamientos || []);
            } catch (error) {
                console.error("Error al actualizar:", error);
                alert("Error al actualizar. Por favor, intenta de nuevo.");
            }
        };
        document.querySelector(".card").insertBefore(actualizarBtn, document.getElementById("lista-participantes"));

        // Agregar botón para procesar emparejamientos
        const procesarBtn = document.createElement("button");
        procesarBtn.className = "boton";
        procesarBtn.textContent = "Procesar Emparejamientos";
        procesarBtn.style.marginLeft = "10px";
        procesarBtn.onclick = async () => {
            try {
                // Primero verificar si hay emparejamientos para procesar
                const response = await fetch(`${URL_APPS_SCRIPT}?action=obtenerDatos`);
                const data = await response.json();
                
                if (!data.success) {
                    throw new Error("Error al obtener datos");
                }

                if (!data.emparejamientos || data.emparejamientos.length === 0) {
                    alert("No hay emparejamientos para procesar. Por favor, genera o agrega emparejamientos primero.");
                    return;
                }

                // Si hay emparejamientos, proceder con el procesamiento
                const processResponse = await fetch(`${URL_APPS_SCRIPT}?action=procesarEmparejamientos`);
                const result = await processResponse.json();
                
                if (result.success) {
                    alert("Emparejamientos procesados correctamente. Actualizando lista...");
                    await cargarDesdeSheets();
                } else {
                    throw new Error(result.error || "Error desconocido al procesar emparejamientos");
                }
            } catch (error) {
                console.error('Error al procesar emparejamientos:', error);
                alert(`Error al procesar emparejamientos: ${error.message}. Por favor, intenta de nuevo.`);
            }
        };
        document.querySelector(".card").insertBefore(procesarBtn, actualizarBtn);
        
        document.getElementById("form-participante").onsubmit = async ev => {
            ev.preventDefault();
            let nombre = document.getElementById("nuevo-nombre").value.trim();
            if (!nombre) return;
            if (participantes.some(p=>p.nombre === nombre)) {
                alert("¡Ese participante ya existe!");
                return;
            }
            
            try {
                // Llamar a la función de Apps Script con disponible=true por defecto
                const response = await fetch(`${URL_APPS_SCRIPT}?action=agregarParticipante&nombre=${encodeURIComponent(nombre)}&disponible=true`);
                const result = await response.json();
                console.log("Respuesta del servidor:", result);
                
                if (result.success) {
                    document.getElementById("nuevo-nombre").value = "";
                    // Actualizar la lista de participantes
                    await cargarDesdeSheets();
                } else {
                    alert("Error al agregar participante. Por favor, intenta de nuevo.");
                }
            } catch (error) {
                console.error('Error al agregar participante:', error);
                alert('Error al agregar participante. Por favor, intenta de nuevo.');
            }
        };
    } catch (error) {
        console.error("Error en la inicialización:", error);
        alert("Error al inicializar la aplicación. Por favor, recarga la página.");
    }
  });
  
  // Algoritmo de emparejamientos mejorado
  function mejoresEmparejamientos(participantes, tamGrupo=4) {
    let disponibles = participantes.filter(p => p.disponible);
    let tot = Math.floor(disponibles.length/tamGrupo)*tamGrupo;
    
    // Ordenar disponibles por total de participaciones (menos participaciones primero)
    disponibles.sort((a, b) => {
      const totalA = Object.values(a.conteoRoles).reduce((sum, val) => sum + val, 0);
      const totalB = Object.values(b.conteoRoles).reduce((sum, val) => sum + val, 0);
      return totalA - totalB;
    });
    
    disponibles = disponibles.slice(0, tot);
    let grupos = [];
    let usados = new Set();
  
    while (disponibles.length - usados.size >= tamGrupo) {
      let candidatos = disponibles.filter(p => !usados.has(p.nombre));
      let combinaciones = getCombinations(candidatos, tamGrupo);
      let mejor, mejorScore;
  
      for (let combo of combinaciones) {
        let score = 0;
        // Calcular score basado en enfrentamientos previos y roles
        for (let i = 0; i < combo.length; i++) {
          for (let j = i + 1; j < combo.length; j++) {
            // Sumar los enfrentamientos previos
            score += combo[i].enfrentamientos[combo[j].nombre] || 0;
          }
        }
        
        // Considerar la distribución de roles
        const roles = ['ag', 'ao', 'bg', 'bo'];
        roles.forEach((rol, index) => {
            score += combo[index].conteoRoles[rol] * 2; // Penalizar roles repetidos
        });

        // Considerar el total de participaciones de cada participante
        combo.forEach(p => {
          const totalParticipaciones = Object.values(p.conteoRoles).reduce((sum, val) => sum + val, 0);
          score += totalParticipaciones * 0.5; // Penalizar ligeramente a quienes han participado más
        });
        
        // Preferir combinaciones con menos enfrentamientos previos, mejor distribución de roles
        // y participantes con menos participaciones totales
        if (mejorScore === undefined || score < mejorScore) {
          mejor = combo;
          mejorScore = score;
        }
      }
  
      if (mejor) {
        grupos.push(mejor.map(p => p.nombre));
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
    
    // Función para actualizar el contador
    function actualizarContador(nombre) {
        if (!nombre) {
            contador.textContent = '';
            return;
        }
        const participante = participantes.find(p => p.nombre === nombre);
        if (participante) {
            const conteo = participante.conteoRoles?.[rol] || 0;
            contador.textContent = `Veces en ${rol}: ${conteo}`;
        }
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
    
    // Actualizar contador cuando cambia la selección
    select.onchange = () => actualizarContador(select.value);
    
    // Mostrar contador inicial
    actualizarContador(valorSeleccionado);
    
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
        
        const participantesDiv = document.createElement('div');
        participantesDiv.className = 'participantes';
        
        // Crear selectores para cada posición
        const posiciones = [
            { label: 'AG:', valor: grupo[0] || '', rol: 'ag' },
            { label: 'AO:', valor: grupo[1] || '', rol: 'ao' },
            { label: 'BG:', valor: grupo[2] || '', rol: 'bg' },
            { label: 'BO:', valor: grupo[3] || '', rol: 'bo' }
        ];
        
        posiciones.forEach(pos => {
            const participanteDiv = document.createElement('div');
            participanteDiv.className = 'participante';
            
            const label = document.createElement('label');
            label.textContent = pos.label;
            
            const selector = crearSelectorParticipantes(participantes, pos.valor, pos.rol);
            
            participanteDiv.appendChild(label);
            participanteDiv.appendChild(selector);
            participantesDiv.appendChild(participanteDiv);
        });
        
        div.appendChild(participantesDiv);
        container.appendChild(div);
    });
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

  // Modificar el evento del botón generar
  document.getElementById('generar').onclick = function() {
    const grupos = mejoresEmparejamientos(participantes, 4);
    
    if (!grupos.length) {
        alert("No hay suficientes participantes disponibles.");
        return;
    }
    
    // Mostrar la interfaz de edición
    document.getElementById('emparejamientos-edicion').style.display = 'block';
    crearInterfazEdicionGrupos(grupos);
  };

  // Agregar evento para confirmar emparejamientos
  document.getElementById('confirmar-emparejamientos').onclick = async function() {
    const grupos = obtenerEmparejamientosEditados();
    
    // Validar que todos los grupos tengan al menos 2 participantes
    const gruposInvalidos = grupos.filter(grupo => 
        grupo.filter(p => p).length < 2
    );
    
    if (gruposInvalidos.length > 0) {
        alert("Cada grupo debe tener al menos 2 participantes.");
        return;
    }
    
    try {
        const emparejamientos = grupos.map((grupo, idx) => ({
            grupo: `G${idx + 1}`,
            ag: grupo[0] || '',
            ao: grupo[1] || '',
            bg: grupo[2] || '',
            bo: grupo[3] || ''
        }));

        // Guardar los emparejamientos en Google Sheets
        const response = await fetch(`${URL_APPS_SCRIPT}?action=guardarEmparejamientos&data=${encodeURIComponent(JSON.stringify(emparejamientos))}`);
        const result = await response.json();
        
        if (result.success) {
            // Procesar los emparejamientos para actualizar enfrentamientos
            await fetch(`${URL_APPS_SCRIPT}?action=procesarEmparejamientos`);
            // Recargar datos y actualizar todas las tablas
            await cargarDesdeSheets();
            // Ocultar la interfaz de edición
            document.getElementById('emparejamientos-edicion').style.display = 'none';
        } else {
            alert("Error al guardar emparejamientos: " + (result.error || "Error desconocido"));
        }
    } catch (error) {
        console.error('Error al guardar emparejamientos:', error);
        alert('Error al guardar emparejamientos. Por favor, intenta de nuevo.');
    }
  };

  // Agregar evento para cancelar edición
  document.getElementById('cancelar-emparejamientos').onclick = function() {
    document.getElementById('emparejamientos-edicion').style.display = 'none';
  };

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

  // Función para actualizar la disponibilidad de un participante
  async function actualizarDisponibilidad(nombre, disponible) {
    try {
        const response = await fetch(`${URL_APPS_SCRIPT}?action=actualizarDisponibilidad&nombre=${encodeURIComponent(nombre)}&disponible=${disponible}`);
        const result = await response.json();
        
        if (!result.success) {
            console.error('Error al actualizar disponibilidad:', result.error);
            // Revertir el cambio en la interfaz
            const participante = participantes.find(p => p.nombre === nombre);
            if (participante) {
                participante.disponible = !disponible;
                renderParticipantes();
            }
        }
    } catch (error) {
        console.error('Error al actualizar disponibilidad:', error);
        // Revertir el cambio en la interfaz
        const participante = participantes.find(p => p.nombre === nombre);
        if (participante) {
            participante.disponible = !disponible;
            renderParticipantes();
        }
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

  // Función para actualizar los conteos de roles
  function actualizarConteoRoles() {
    // Resetear conteos
    participantes.forEach(p => {
        p.conteoRoles = { ag: 0, ao: 0, bg: 0, bo: 0 };
    });

    // Contar roles en emparejamientos existentes
    const emparejamientos = document.querySelectorAll('#tabla-emparejamientos tbody tr');
    emparejamientos.forEach(row => {
        const cells = row.querySelectorAll('td');
        if (cells.length >= 5) {
            const roles = ['ag', 'ao', 'bg', 'bo'];
            roles.forEach((rol, index) => {
                const nombre = cells[index].textContent;
                if (nombre && nombre !== '-') {
                    const participante = participantes.find(p => p.nombre === nombre);
                    if (participante) {
                        participante.conteoRoles[rol]++;
                    }
                }
            });
        }
    });
  }
