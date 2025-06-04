/*

// Configuración global
const CONFIG = {
  SHEET_NAMES: {
    PARTICIPANTES: 'Participantes',
    ENFRENTAMIENTOS: 'Enfrentamientos',
    EMPAREJAMIENTOS: 'Emparejamientos'
  },
  COLUMNS: {
    PARTICIPANTES: {
      NOMBRE: 0,
      DISPONIBLE: 1
    },
    ENFRENTAMIENTOS: {
      NOMBRE1: 0,
      NOMBRE2: 1,
      VECES: 2
    },
    EMPAREJAMIENTOS: {
      GRUPO: 0,
      AG: 1,  // Participante 1 del Grupo A
      AO: 2,  // Participante 2 del Grupo A
      BG: 3,  // Participante 1 del Grupo B
      BO: 4   // Participante 2 del Grupo B
    }
  }
};

// Función principal que maneja todas las peticiones
function doGet(e) {
  try {
    const action = e.parameter.action;
    let response;

    switch (action) {
      case 'obtenerDatos':
        response = obtenerDatos();
        break;
      case 'agregarParticipante':
        response = agregarParticipante(e.parameter.nombre, e.parameter.disponible);
        break;
      case 'eliminarParticipante':
        response = eliminarParticipante(e.parameter.nombre);
        break;
      case 'procesarEmparejamientos':
        response = procesarEmparejamientos();
        break;
      case 'guardarEmparejamientos':
        const data = JSON.parse(e.parameter.data);
        response = guardarEmparejamientos(data);
        break;
      case 'actualizarDisponibilidad':
        response = actualizarDisponibilidad(e.parameter.nombre, e.parameter.disponible);
        break;
      case 'eliminarEnfrentamiento':
        response = eliminarEnfrentamiento(e.parameter.p1, e.parameter.p2);
        break;
      case 'eliminarEmparejamiento':
        response = eliminarEmparejamiento(e.parameter.grupo);
        break;
      default:
        throw new Error('Acción no válida');
    }

    return crearRespuestaJSON(response);
  } catch (error) {
    return crearRespuestaJSON({ success: false, error: error.toString() });
  }
}

// Función para obtener todos los datos
function obtenerDatos() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // Obtener datos de participantes
  const participantesSheet = ss.getSheetByName(CONFIG.SHEET_NAMES.PARTICIPANTES);
  const participantesData = participantesSheet.getDataRange().getValues();
  const participantes = participantesData.slice(1).map(row => ({
    nombre: row[CONFIG.COLUMNS.PARTICIPANTES.NOMBRE],
    disponible: row[CONFIG.COLUMNS.PARTICIPANTES.DISPONIBLE]
  }));

  // Obtener datos de enfrentamientos
  const enfrentamientosSheet = ss.getSheetByName(CONFIG.SHEET_NAMES.ENFRENTAMIENTOS);
  const enfrentamientosData = enfrentamientosSheet.getDataRange().getValues();
  const enfrentamientos = enfrentamientosData.slice(1).map(row => ({
    nombre1: row[CONFIG.COLUMNS.ENFRENTAMIENTOS.NOMBRE1],
    nombre2: row[CONFIG.COLUMNS.ENFRENTAMIENTOS.NOMBRE2],
    veces: parseInt(row[CONFIG.COLUMNS.ENFRENTAMIENTOS.VECES]) || 0
  }));

  // Obtener datos de emparejamientos
  const emparejamientosSheet = ss.getSheetByName(CONFIG.SHEET_NAMES.EMPAREJAMIENTOS);
  const emparejamientosData = emparejamientosSheet.getDataRange().getValues();
  const emparejamientos = emparejamientosData.slice(1).map(row => ({
    grupo: row[CONFIG.COLUMNS.EMPAREJAMIENTOS.GRUPO],
    ag: row[CONFIG.COLUMNS.EMPAREJAMIENTOS.AG],
    ao: row[CONFIG.COLUMNS.EMPAREJAMIENTOS.AO],
    bg: row[CONFIG.COLUMNS.EMPAREJAMIENTOS.BG],
    bo: row[CONFIG.COLUMNS.EMPAREJAMIENTOS.BO]
  }));

  return {
    success: true,
    participantes: participantes,
    enfrentamientos: enfrentamientos,
    emparejamientos: emparejamientos
  };
}

// Función para agregar un participante
function agregarParticipante(nombre, disponible) {
  if (!nombre) {
    throw new Error('El nombre es requerido');
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(CONFIG.SHEET_NAMES.PARTICIPANTES);
  
  if (!sheet) {
    throw new Error('No se encontró la hoja de participantes');
  }
  
  // Verificar si el participante ya existe
  const participantes = sheet.getDataRange().getValues();
  const existe = participantes.slice(1).some(row => 
    row[CONFIG.COLUMNS.PARTICIPANTES.NOMBRE].toLowerCase() === nombre.toLowerCase()
  );

  if (existe) {
    throw new Error('El participante ya existe');
  }

  // Agregar nuevo participante (siempre disponible por defecto)
  sheet.appendRow([nombre, true]);
  
  return { success: true };
}

// Función para eliminar un participante
function eliminarParticipante(nombre) {
  if (!nombre) {
    throw new Error('El nombre es requerido');
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(CONFIG.SHEET_NAMES.PARTICIPANTES);
  
  if (!sheet) {
    throw new Error('No se encontró la hoja de participantes');
  }
  
  // Buscar y eliminar el participante
  const participantes = sheet.getDataRange().getValues();
  const filaIndex = participantes.findIndex(row => 
    row[CONFIG.COLUMNS.PARTICIPANTES.NOMBRE].toLowerCase() === nombre.toLowerCase()
  );

  if (filaIndex === -1) {
    throw new Error('Participante no encontrado');
  }

  sheet.deleteRow(filaIndex + 1); // +1 porque findIndex es 0-based pero las filas empiezan en 1
  
  return { success: true };
}

// Función para procesar emparejamientos y actualizar enfrentamientos
function procesarEmparejamientos() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const emparejamientosSheet = ss.getSheetByName(CONFIG.SHEET_NAMES.EMPAREJAMIENTOS);
    const enfrentamientosSheet = ss.getSheetByName(CONFIG.SHEET_NAMES.ENFRENTAMIENTOS);
    
    if (!emparejamientosSheet || !enfrentamientosSheet) {
      throw new Error('No se encontraron las hojas necesarias');
    }

    // Obtener todos los emparejamientos
    const emparejamientosData = emparejamientosSheet.getDataRange().getValues();
    
    // Verificar si hay datos para procesar (excluyendo el encabezado)
    if (emparejamientosData.length <= 1) {
      throw new Error('No hay emparejamientos para procesar');
    }

    // Crear mapa de enfrentamientos para actualización rápida
    const enfrentamientosMap = new Map();

    // Procesar cada emparejamiento (excluyendo el encabezado)
    emparejamientosData.slice(1).forEach(row => {
      // Obtener participantes de cada columna
      const participantes = [
        row[CONFIG.COLUMNS.EMPAREJAMIENTOS.AG],
        row[CONFIG.COLUMNS.EMPAREJAMIENTOS.AO],
        row[CONFIG.COLUMNS.EMPAREJAMIENTOS.BG],
        row[CONFIG.COLUMNS.EMPAREJAMIENTOS.BO]
      ].filter(p => p); // Filtrar valores vacíos

      // Generar todas las combinaciones posibles de 2 participantes
      for (let i = 0; i < participantes.length; i++) {
        for (let j = i + 1; j < participantes.length; j++) {
          const p1 = participantes[i];
          const p2 = participantes[j];
          const key = [p1, p2].sort().join('|');
          
          // Incrementar el contador de enfrentamientos
          enfrentamientosMap.set(key, (enfrentamientosMap.get(key) || 0) + 1);
        }
      }
    });

    // Convertir el mapa a un array de enfrentamientos
    const nuevosEnfrentamientos = Array.from(enfrentamientosMap.entries()).map(([key, veces]) => {
      const [nombre1, nombre2] = key.split('|');
      return [nombre1, nombre2, veces];
    });

    // Limpiar la hoja de enfrentamientos (excepto el encabezado)
    const lastRow = enfrentamientosSheet.getLastRow();
    if (lastRow > 1) {
      enfrentamientosSheet.getRange(2, 1, lastRow - 1, 3).clear();
    }
    
    // Escribir los nuevos enfrentamientos si hay datos
    if (nuevosEnfrentamientos.length > 0) {
      enfrentamientosSheet.getRange(2, 1, nuevosEnfrentamientos.length, 3).setValues(nuevosEnfrentamientos);
    }

    return { 
      success: true, 
      message: 'Emparejamientos procesados correctamente',
      enfrentamientosProcesados: nuevosEnfrentamientos.length
    };
  } catch (error) {
    return { 
      success: false, 
      error: error.toString(),
      message: 'Error al procesar emparejamientos'
    };
  }
}

// Función para guardar emparejamientos
function guardarEmparejamientos(data) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(CONFIG.SHEET_NAMES.EMPAREJAMIENTOS);
    
    if (!sheet) {
      throw new Error('No se encontró la hoja de emparejamientos');
    }

    // Convertir los datos a formato de filas
    const filas = data.map(emp => [
      emp.grupo,
      emp.ag,
      emp.ao,
      emp.bg,
      emp.bo
    ]);

    // Agregar las nuevas filas
    if (filas.length > 0) {
      sheet.getRange(sheet.getLastRow() + 1, 1, filas.length, 5).setValues(filas);
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: error.toString() };
  }
}

// Función para actualizar la disponibilidad de un participante
function actualizarDisponibilidad(nombre, disponible) {
    if (!nombre) {
        throw new Error('El nombre es requerido');
    }

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(CONFIG.SHEET_NAMES.PARTICIPANTES);
    
    if (!sheet) {
        throw new Error('No se encontró la hoja de participantes');
    }
    
    // Buscar el participante
    const participantes = sheet.getDataRange().getValues();
    const filaIndex = participantes.findIndex(row => 
        row[CONFIG.COLUMNS.PARTICIPANTES.NOMBRE].toLowerCase() === nombre.toLowerCase()
    );

    if (filaIndex === -1) {
        throw new Error('Participante no encontrado');
    }

    // Actualizar la disponibilidad
    sheet.getRange(filaIndex + 1, CONFIG.COLUMNS.PARTICIPANTES.DISPONIBLE + 1).setValue(disponible === 'true');
    
    return { success: true };
}

// Función para eliminar un enfrentamiento
function eliminarEnfrentamiento(p1, p2) {
    if (!p1 || !p2) {
        throw new Error('Se requieren ambos participantes');
    }

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(CONFIG.SHEET_NAMES.ENFRENTAMIENTOS);
    
    if (!sheet) {
        throw new Error('No se encontró la hoja de enfrentamientos');
    }
    
    // Buscar y eliminar el enfrentamiento
    const enfrentamientos = sheet.getDataRange().getValues();
    const filasAEliminar = [];
    
    enfrentamientos.forEach((row, index) => {
        if (index === 0) return; // Saltar encabezado
        const nombre1 = row[CONFIG.COLUMNS.ENFRENTAMIENTOS.NOMBRE1];
        const nombre2 = row[CONFIG.COLUMNS.ENFRENTAMIENTOS.NOMBRE2];
        
        if ((nombre1 === p1 && nombre2 === p2) || (nombre1 === p2 && nombre2 === p1)) {
            filasAEliminar.push(index + 1);
        }
    });
    
    // Eliminar filas de abajo hacia arriba para evitar problemas con los índices
    filasAEliminar.reverse().forEach(fila => {
        sheet.deleteRow(fila);
    });
    
    return { success: true };
}

// Función para eliminar un emparejamiento
function eliminarEmparejamiento(grupo) {
    if (!grupo) {
        throw new Error('Se requiere el grupo');
    }

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(CONFIG.SHEET_NAMES.EMPAREJAMIENTOS);
    
    if (!sheet) {
        throw new Error('No se encontró la hoja de emparejamientos');
    }
    
    // Buscar y eliminar el emparejamiento
    const emparejamientos = sheet.getDataRange().getValues();
    const filasAEliminar = [];
    
    emparejamientos.forEach((row, index) => {
        if (index === 0) return; // Saltar encabezado
        const grupoActual = row[CONFIG.COLUMNS.EMPAREJAMIENTOS.GRUPO];
        
        if (grupoActual === grupo) {
            filasAEliminar.push(index + 1);
        }
    });
    
    // Eliminar filas de abajo hacia arriba para evitar problemas con los índices
    filasAEliminar.reverse().forEach(fila => {
        sheet.deleteRow(fila);
    });
    
    return { success: true };
}

// Función auxiliar para crear respuestas JSON
function crearRespuestaJSON(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
*/