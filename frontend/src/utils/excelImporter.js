import * as XLSX from 'xlsx';

// Mapeo de encabezados de Excel a campos del sistema
export const MAPEO_ENCABEZADOS = {
  directa: {
    'No.': 'no_identificacion',
    'No. de Identificacion': 'no_identificacion',
    'No. NOG': 'no_nog',
    'Fecha de publiccion': 'fecha_publicacion',
    'MODALIDAD DE COMPRA': 'modalidad',
    'Estatus del Evento': 'estatus_evento',
    'Descripcion del evento': 'descripcion_evento',
    'Fecha de adjudicacion': 'fecha_adjudicacion',
    'SOLICITUD': 'solicitud',
    'No. OC': 'no_oc',
    'Fecha OC': 'fecha_oc',
    'NIT Adjudicado': 'nit_adjudicado',
    'Proveedor Adjudicado': 'proveedor',
    'Renglon': 'renglon',
    'Código insumo': 'codigo_insumo',
    'Producto y Caracteristicas': 'producto',
    'Presentación Y Unidad de medida': 'presentacion_unidad',
    ' Precio ': 'precio',
    'Cantidad Adjudicada': 'cantidad_adjudicada',
    ' Monto Total Adjudicado ': 'monto_total',
    'No. Factura': 'factura_numero',
    'Fecha de Factura': 'factura_fecha',
    'No. Ingreso de Almacen': 'almacen_no_ingreso',
    'Fecha de Ingreso de Almacen': 'almacen_fecha_ingreso',
    ' cur ': 'cur_numero',
    ' Fecha de CUR ': 'cur_fecha',
    'REGISTRO SANITARIO': 'registro_sanitario',
    'DISTRITO': 'distrito',
    'ESTADO': 'estado',
    'OBSERVAC': 'observaciones'
  },
  abierto: {
    'No.': 'no',
    'Modalidad de Compra': 'modalidad',
    'Rubro': 'rubro',
    'No. NOG': 'no_nog',
    'Fecha de inicio': 'fecha_inicio',
    'Fecha de vencimiento': 'fecha_vencimiento',
    'Descripcion del Evento': 'descripcion_evento',
    'Solicitud': 'solicitud',
    'No. OC': 'no_oc',
    'Fecha OC': 'fecha_oc',
    'NIT Adjudicado': 'nit_adjudicado',
    'Proveedor Adjudicado': 'proveedor',
    'Renglon': 'renglon',
    'Código  Finanzas': 'codigo_insumo',
    'Producto': 'producto',
    'Unidad de medida': 'presentacion_unidad',
    ' Precio ': 'precio',
    'Cantidad Adjudicada': 'cantidad_adjudicada',
    ' Monto Total Adjudicado ': 'monto_total',
    'No. Factura': 'factura_numero',
    'Fecha de Factura': 'factura_fecha',
    'No. Ingreso de Almacen': 'almacen_no_ingreso',
    'Fecha de Ingreso de Almacen': 'almacen_fecha_ingreso',
    'No. CUR': 'cur_numero',
    'Fecha de CUR': 'cur_fecha',
    'Observaciones': 'observaciones',
    'RELIZADO POR': 'realizado_por',
    'ESTADO': 'estado'
  },
  baja: {
    'No.': 'no',
    'NPG': 'npg',
    'FECHA DE PUBLICACION': 'fecha_publicacion',
    'Modalidad de Compra': 'modalidad',
    'Descripcion del evento': 'descripcion_evento',
    'Solicitud': 'solicitud',
    'No. OC': 'no_oc',
    'Fecha OC': 'fecha_oc',
    'NIT Adjudicado': 'nit_adjudicado',
    'Proveedor Adjudicado': 'proveedor',
    'Renglon': 'renglon',
    'Código insumo': 'codigo_insumo',
    'Producto y Caracteristicas': 'producto',
    'Presentación y Unidad de Medida': 'presentacion_unidad',
    ' Precio ': 'precio',
    'Cantidad Adjudicada': 'cantidad_adjudicada',
    ' Monto Total Adjudicado ': 'monto_total',
    ' No. Factura ': 'factura_numero',
    ' Fecha de Factura ': 'factura_fecha',
    ' No. Ingreso de Almacen ': 'almacen_no_ingreso',
    ' Fecha de Ingreso de Almacen ': 'almacen_fecha_ingreso',
    ' No. CUR ': 'cur_numero',
    ' Fecha de CUR ': 'cur_fecha',
    ' REALIZADO POR ': 'realizado_por',
    ' NO. DE ACTA ': 'no_acta',
    ' OBSERVACIONES': 'observaciones'
  }
};

// Función para limpiar encabezados (eliminar espacios extra)
const limpiarEncabezado = (encabezado) => {
  return encabezado?.toString().trim() || '';
};

// Función para convertir fecha de Excel a formato ISO
const convertirFechaExcel = (valor) => {
  if (!valor) return null;
  
  // Si ya es una fecha
  if (valor instanceof Date) {
    return valor.toISOString().split('T')[0];
  }
  
  // Si es un número de serie de Excel
  if (typeof valor === 'number') {
    const fecha = XLSX.SSF.parse_date_code(valor);
    if (fecha) {
      const fechaObj = new Date(fecha.y, fecha.m - 1, fecha.d);
      return fechaObj.toISOString().split('T')[0];
    }
  }
  
  // Si es texto, intentar parsearlo
  if (typeof valor === 'string') {
    const fechaParseada = new Date(valor);
    if (!isNaN(fechaParseada.getTime())) {
      return fechaParseada.toISOString().split('T')[0];
    }
  }
  
  return null;
};

// Función para convertir valor según el tipo de campo
const convertirValor = (valor, tipoCampo) => {
  if (valor === undefined || valor === null || valor === '') {
    return tipoCampo === 'checkbox' ? false : '';
  }
  
  switch (tipoCampo) {
    case 'number':
      const numero = parseFloat(valor);
      return isNaN(numero) ? 0 : numero;
    case 'date':
      return convertirFechaExcel(valor);
    case 'checkbox':
      return Boolean(valor);
    default:
      return valor.toString().trim();
  }
};

// Función principal para procesar archivo Excel
export const procesarArchivoExcel = (archivo, modalidad, camposModalidad) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        
        // Tomar la primera hoja
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // Convertir a JSON manteniendo encabezados originales
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
          header: 1,
          defval: '',
          raw: false
        });
        
        if (jsonData.length < 2) {
          reject(new Error('El archivo debe contener al menos una fila de encabezados y una fila de datos'));
          return;
        }
        
        // Obtener encabezados (primera fila)
        const encabezadosOriginales = jsonData[0];
        const mapeoEncabezados = MAPEO_ENCABEZADOS[modalidad];
        
        // Crear mapeo de índices
        const indicesMapeo = {};
        encabezadosOriginales.forEach((encabezado, index) => {
          const encabezadoLimpio = limpiarEncabezado(encabezado);
          const campoSistema = mapeoEncabezados[encabezadoLimpio];
          if (campoSistema) {
            indicesMapeo[campoSistema] = index;
          }
        });
        
        // Procesar filas de datos
        const datosImportados = [];
        const errores = [];
        
        for (let i = 1; i < jsonData.length; i++) {
          const fila = jsonData[i];
          const registro = {};
          
          // Mapear cada campo
          camposModalidad.forEach(campo => {
            if (campo.name === 'modalidad') {
              // Asignar modalidad automáticamente
              registro[campo.name] = modalidad === 'directa' ? 'COMPRA DIRECTA' : 
                                   modalidad === 'abierto' ? 'CONTRATO ABIERTO' : 'BAJA CUANTÍA';
            } else if (indicesMapeo.hasOwnProperty(campo.name)) {
              const indice = indicesMapeo[campo.name];
              const valorOriginal = fila[indice];
              try {
                registro[campo.name] = convertirValor(valorOriginal, campo.type);
              } catch (error) {
                errores.push(`Fila ${i + 1}, Campo ${campo.label}: Error al convertir valor "${valorOriginal}"`);
                registro[campo.name] = campo.type === 'checkbox' ? false : '';
              }
            } else {
              // Campo no encontrado en el Excel, usar valor por defecto
              registro[campo.name] = campo.type === 'checkbox' ? false : '';
            }
          });
          
          datosImportados.push(registro);
        }
        
        resolve({
          datos: datosImportados,
          errores: errores,
          totalFilas: datosImportados.length,
          encabezadosDetectados: encabezadosOriginales,
          camposMapeados: Object.keys(indicesMapeo)
        });
        
      } catch (error) {
        reject(new Error(`Error al procesar el archivo: ${error.message}`));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Error al leer el archivo'));
    };
    
    reader.readAsArrayBuffer(archivo);
  });
};

// Función para validar archivo Excel
export const validarArchivoExcel = (archivo) => {
  const tiposValidos = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
    'application/vnd.ms-excel' // .xls
  ];
  
  if (!tiposValidos.includes(archivo.type)) {
    return {
      valido: false,
      error: 'El archivo debe ser de tipo Excel (.xlsx o .xls)'
    };
  }
  
  const tamañoMaximo = 10 * 1024 * 1024; // 10MB
  if (archivo.size > tamañoMaximo) {
    return {
      valido: false,
      error: 'El archivo es demasiado grande. Máximo 10MB permitido.'
    };
  }
  
  return { valido: true };
};

// Función para obtener vista previa de encabezados
export const obtenerVistaPrevia = (archivo) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // Leer solo las primeras 3 filas para vista previa
        const range = XLSX.utils.decode_range(worksheet['!ref']);
        const vistaPreviaRange = {
          s: { c: range.s.c, r: range.s.r },
          e: { c: range.e.c, r: Math.min(range.s.r + 2, range.e.r) }
        };
        
        const vistaPreviaData = XLSX.utils.sheet_to_json(worksheet, {
          header: 1,
          range: vistaPreviaRange,
          defval: ''
        });
        
        resolve({
          encabezados: vistaPreviaData[0] || [],
          filasEjemplo: vistaPreviaData.slice(1),
          totalHojas: workbook.SheetNames.length,
          nombreHoja: sheetName
        });
        
      } catch (error) {
        reject(new Error(`Error al obtener vista previa: ${error.message}`));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Error al leer el archivo'));
    };
    
    reader.readAsArrayBuffer(archivo);
  });
};
