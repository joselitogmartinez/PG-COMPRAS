const { Builder, By, until } = require('selenium-webdriver');
const { Select } = require('selenium-webdriver/lib/select');
require('chromedriver');
const chrome = require('selenium-webdriver/chrome');
const { expect } = require('chai');

const BASE = process.env.BASE_URL || 'http://localhost:3000'; // URL base de la aplicación
const HEADLESS = process.env.HEADLESS === 'true'; // Ejecutar en modo headless

let driver; // Inicializa el driver de Selenium
const timeout = 30000; // Tiempo de espera para las pruebas
let UNIQUE_REF = null; // Referencia única para el expediente

// Función para encontrar una fila por su texto
async function findRowByText(text) {
  const rows = await driver.findElements(By.css('table tbody tr'));
  for (const row of rows) {
    const t = await row.getText();
    if (t.includes(text)) return row;
  }
  return null;
}

// Flujo simplificado: login compras -> crear expediente completo
describe('Test de creación de expediente de compra directa', function() {
  this.timeout(120000);

  before(async () => {
    const options = new chrome.Options();
    if (HEADLESS) options.addArguments('--headless=new', '--disable-gpu');
    options.addArguments('--window-size=1400,900');

    driver = await new Builder().forBrowser('chrome').setChromeOptions(options).build();
    
    console.log('🔄 Iniciando navegador y preparando entorno...');

    // Login con usuario comprase2e
    await driver.get(`${BASE}/`);
    await driver.wait(until.elementLocated(By.css('form')), timeout);
    
    console.log('🔑 Realizando login con usuario comprase2e...');
    
    const userInput = await driver.findElement(By.css('input[name="usuario"], input[type="text"], input:first-of-type'));
    await userInput.clear();
    await userInput.sendKeys('comprase2e');
    
    const passInput = await driver.findElement(By.css('input[name="contraseña"], input[type="password"]'));
    await passInput.clear();
    await passInput.sendKeys('compras123');
    
    const loginBtn = await driver.findElement(By.css('button[type="submit"], button'));
    await loginBtn.click();
    
    // Esperar redirección a módulo compras
    await driver.wait(async () => {
      const url = await driver.getCurrentUrl();
      return url.includes('/compras');
    }, timeout);
    
    console.log('✅ Login exitoso, accediendo al módulo de compras...');
  });

  after(async () => {
    if (driver) {
      console.log('🔄 Cerrando el navegador...');
      await driver.quit();
    }
  });

  it('Crear expediente completo de compra directa', async () => {
    // Generar referencia única para este test
    UNIQUE_REF = `E2E-${Date.now()}`;
    console.log(`📝 Creando expediente con referencia: ${UNIQUE_REF}`);

    // Abrir formulario de registro
    const registrarBtn = await driver.wait(
      until.elementLocated(By.xpath("//button[contains(., 'REGISTRAR') or contains(., 'Registrar') or @data-testid='open-create']")),
      timeout
    );
    await registrarBtn.click();
    console.log('✅ Formulario de registro abierto');

    // Esperar que aparezca el modal
    await driver.wait(until.elementLocated(By.css('.modal-dialog, form')), timeout);
    await driver.sleep(1000);

    console.log('📋 Completando todos los campos del formulario...');

    // 1. Campo No
    try {
      const noInput = await driver.findElement(By.xpath("//label[text()='No']/following-sibling::input | //label[contains(text(), 'No')]/following-sibling::input | //input[@placeholder='No']"));
      await noInput.clear();
      await noInput.sendKeys(UNIQUE_REF);
      console.log('✅ Campo No completado');
    } catch (e) {
      console.log('⚠️ Campo No no encontrado, intentando alternativa...');
      // Intentar con el primer input del formulario
      const firstInput = await driver.findElement(By.css('.modal-dialog input:first-of-type'));
      await firstInput.clear();
      await firstInput.sendKeys(UNIQUE_REF);
    }

    // 2. Modalidad (Select)
    try {
      const modalidadSelect = await driver.findElement(By.xpath("//label[text()='Modalidad']/following-sibling::select | //select[contains(@id, 'modalidad')]"));
      await modalidadSelect.click();
      await driver.sleep(500);
      
      // Seleccionar COMPRA DIRECTA
      const optionCompraDirecta = await driver.findElement(By.xpath("//option[contains(text(), 'COMPRA DIRECTA')]"));
      await optionCompraDirecta.click();
      console.log('✅ Modalidad seleccionada: COMPRA DIRECTA');
    } catch (e) {
      console.log('⚠️ No se pudo seleccionar Modalidad:', e.message);
    }

    // 3. NOG
    try {
      const nogInput = await driver.findElement(By.xpath("//label[text()='NOG']/following-sibling::input | //input[@name='nog']"));
      await nogInput.clear();
      await nogInput.sendKeys(`NOG-${UNIQUE_REF}`);
      console.log('✅ Campo NOG completado');
    } catch (e) {
      console.log('⚠️ Campo NOG no encontrado');
    }

    // 4. Fecha Publicación
    try {
      const fechaPubInput = await driver.findElement(By.xpath("//label[contains(text(), 'Fecha Publicación')]/following-sibling::input | //input[@name='fecha_publicacion']"));
      await fechaPubInput.clear();
      await fechaPubInput.sendKeys('01/10/2025');
      console.log('✅ Fecha Publicación completada');
    } catch (e) {
      console.log('⚠️ Campo Fecha Publicación no encontrado');
    }

    // 5. Estatus Evento (Select) - Versión específica para ADJUDICADO
    try {
      console.log('🔄 Seleccionando Estatus Evento: ADJUDICADO...');
      
      // Buscar el select
      const estatusSelect = await driver.findElement(By.xpath("//label[contains(text(), 'Estatus Evento')]/following-sibling::select"));
      
      // Scroll al elemento
      await driver.executeScript("arguments[0].scrollIntoView({behavior: 'smooth', block: 'center'});", estatusSelect);
      await driver.sleep(1000);
      
      // Método 1: Usar Select class de Selenium
      try {
        const selectElement = new Select(estatusSelect);
        await selectElement.selectByVisibleText('ADJUDICADO');
        console.log('✅ ADJUDICADO seleccionado con Select class');
      } catch (e) {
        console.log('⚠️ Select class falló, usando método alternativo');
        
        // Método 2: Click y luego click en la opción
        await estatusSelect.click();
        await driver.sleep(500);
        
        // Buscar específicamente la opción ADJUDICADO
        const adjudicadoOption = await driver.findElement(By.xpath("//option[text()='ADJUDICADO']"));
        await adjudicadoOption.click();
        await driver.sleep(500);
        console.log('✅ ADJUDICADO seleccionado con click directo');
      }
      
      // Verificar que se seleccionó correctamente
      const selectedValue = await estatusSelect.getAttribute('value');
      const selectedText = await driver.executeScript("return arguments[0].options[arguments[0].selectedIndex].text;", estatusSelect);
      
      console.log(`🔍 Valor seleccionado: "${selectedValue}"`);
      console.log(`🔍 Texto seleccionado: "${selectedText}"`);
      
      if (selectedText === 'ADJUDICADO') {
        console.log('✅ Estatus Evento: ADJUDICADO confirmado');
      } else {
        console.log('⚠️ ADJUDICADO no se seleccionó correctamente, intentando forzar...');
        
        // Método 3: JavaScript forzado
        await driver.executeScript(`
          const select = arguments[0];
          const options = select.options;
          for (let i = 0; i < options.length; i++) {
            if (options[i].text === 'ADJUDICADO') {
              select.selectedIndex = i;
              select.value = options[i].value;
              
              // Disparar eventos
              const changeEvent = new Event('change', { bubbles: true });
              const inputEvent = new Event('input', { bubbles: true });
              select.dispatchEvent(changeEvent);
              select.dispatchEvent(inputEvent);
              
              break;
            }
          }
        `, estatusSelect);
        
        // Verificar nuevamente
        const finalText = await driver.executeScript("return arguments[0].options[arguments[0].selectedIndex].text;", estatusSelect);
        console.log(`🔍 Verificación final: "${finalText}"`);
      }
      
    } catch (e) {
      console.log('❌ Error al seleccionar Estatus Evento:', e.message);
    }

    // 6. Fecha Adjudicación
    try {
      const fechaAdjInput = await driver.findElement(By.xpath("//label[contains(text(), 'Fecha Adjudicación')]/following-sibling::input | //input[@name='fecha_adjudicacion']"));
      await fechaAdjInput.clear();
      await fechaAdjInput.sendKeys('01/10/2025');
      console.log('✅ Fecha Adjudicación completada');
    } catch (e) {
      console.log('⚠️ Campo Fecha Adjudicación no encontrado');
    }

    // 7. Descripción Evento
    try {
      const descEventoInput = await driver.findElement(By.xpath("//label[contains(text(), 'Descripción Evento')]/following-sibling::input | //textarea[@name='descripcion_evento'] | //input[@name='descripcion_evento']"));
      await descEventoInput.clear();
      await descEventoInput.sendKeys('Descripción de prueba automatizada');
      console.log('✅ Descripción Evento completada');
    } catch (e) {
      console.log('⚠️ Campo Descripción Evento no encontrado');
    }

    // 8. No. Solicitud
    try {
      const solicitudInput = await driver.findElement(By.xpath("//label[contains(text(), 'No. Solicitud')]/following-sibling::input | //input[@name='no_solicitud']"));
      await solicitudInput.clear();
      await solicitudInput.sendKeys(`SOL-${UNIQUE_REF}`);
      console.log('✅ No. Solicitud completado');
    } catch (e) {
      console.log('⚠️ Campo No. Solicitud no encontrado');
    }

    // 9. No. O.C
    try {
      const ocInput = await driver.findElement(By.xpath("//label[contains(text(), 'No. O.C')]/following-sibling::input | //input[@name='no_oc']"));
      await ocInput.clear();
      await ocInput.sendKeys(`OC-${UNIQUE_REF}`);
      console.log('✅ No. O.C completado');
    } catch (e) {
      console.log('⚠️ Campo No. O.C no encontrado');
    }

    // 10. Fecha O.C
    try {
      const fechaOcInput = await driver.findElement(By.xpath("//label[contains(text(), 'Fecha O.C')]/following-sibling::input | //input[@name='fecha_oc']"));
      await fechaOcInput.clear();
      await fechaOcInput.sendKeys('01/10/2025');
      console.log('✅ Fecha O.C completada');
    } catch (e) {
      console.log('⚠️ Campo Fecha O.C no encontrado');
    }

    // 11. NIT Proveedor
    try {
      const nitInput = await driver.findElement(By.xpath("//label[contains(text(), 'NIT Proveedor')]/following-sibling::input | //input[@name='nit_proveedor']"));
      await nitInput.clear();
      await nitInput.sendKeys('12345678-9');
      console.log('✅ NIT Proveedor completado');
    } catch (e) {
      console.log('⚠️ Campo NIT Proveedor no encontrado');
    }

    // 12. Nombre Proveedor
    try {
      const nombreProvInput = await driver.findElement(By.xpath("//label[contains(text(), 'Nombre Proveedor')]/following-sibling::input | //input[@name='nombre_proveedor']"));
      await nombreProvInput.clear();
      await nombreProvInput.sendKeys('Proveedor E2E Test');
      console.log('✅ Nombre Proveedor completado');
    } catch (e) {
      console.log('⚠️ Campo Nombre Proveedor no encontrado');
    }

    // 13. Descripcion del Producto
    try {
      const descProdInput = await driver.findElement(By.xpath("//label[contains(text(), 'Descripcion del Producto')]/following-sibling::input | //textarea[@name='descripcion_producto'] | //input[@name='descripcion_producto']"));
      await descProdInput.clear();
      await descProdInput.sendKeys('Producto de prueba automatizada E2E');
      console.log('✅ Descripción del Producto completada');
    } catch (e) {
      console.log('⚠️ Campo Descripción del Producto no encontrado');
    }

    // 14. Renglón
    try {
      const renglonInput = await driver.findElement(By.xpath("//label[contains(text(), 'Renglón')]/following-sibling::input | //input[@name='renglon']"));
      await renglonInput.clear();
      await renglonInput.sendKeys('001');
      console.log('✅ Renglón completado');
    } catch (e) {
      console.log('⚠️ Campo Renglón no encontrado');
    }
    
    // 15. Código Insumo (si existe)
    try {
      const codigoInput = await driver.findElement(By.xpath("//label[contains(text(), 'Código Insumo')]/following-sibling::input | //input[@name='codigo_insumo']"));
      await codigoInput.clear();
      await codigoInput.sendKeys(`COD-${UNIQUE_REF}`);
      console.log('✅ Código Insumo completado');
    } catch (e) {
      console.log('⚠️ Campo Código Insumo no encontrado');
    }

    // 16. Presentación/Unidad
    try {
      const presentacionInput = await driver.findElement(By.xpath("//label[contains(text(), 'Presentación/Unidad')]/following-sibling::input | //input[@name='presentacion_unidad']"));
      await presentacionInput.clear();
      await presentacionInput.sendKeys('Unidad');
      console.log('✅ Presentación/Unidad completado');
    } catch (e) {
      console.log('⚠️ Campo Presentación/Unidad no encontrado');
    }

    // 17. Precio Unitario
    try {
      const precioInput = await driver.findElement(By.xpath("//label[contains(text(), 'Precio Unitario')]/following-sibling::input | //input[@name='precio_unitario']"));
      await precioInput.clear();
      await precioInput.sendKeys('100.00');
      console.log('✅ Precio Unitario completado');
    } catch (e) {
      console.log('⚠️ Campo Precio Unitario no encontrado');
    }

    // 18. Cantidad Adjudicada
    try {
      const cantidadInput = await driver.findElement(By.xpath("//label[contains(text(), 'Cantidad Adjudicada')]/following-sibling::input | //input[@name='cantidad_adjudicada']"));
      await cantidadInput.clear();
      await cantidadInput.sendKeys('10');
      console.log('✅ Cantidad Adjudicada completada');
    } catch (e) {
      console.log('⚠️ Campo Cantidad Adjudicada no encontrado');
    }

    // 19. Monto Total (se calcula automáticamente o manual)
    try {
      const montoInput = await driver.findElement(By.xpath("//label[contains(text(), 'Monto Total')]/following-sibling::input | //input[@name='monto_total']"));
      await montoInput.clear();
      await montoInput.sendKeys('1000.00');
      console.log('✅ Monto Total completado');
    } catch (e) {
      console.log('⚠️ Campo Monto Total no encontrado');
    }

    // 20. No. Factura
    try {
      const facturaInput = await driver.findElement(By.xpath("//label[contains(text(), 'No. Factura')]/following-sibling::input | //input[@name='no_factura']"));
      await facturaInput.clear();
      await facturaInput.sendKeys(`FAC-${UNIQUE_REF}`);
      console.log('✅ No. Factura completado');
    } catch (e) {
      console.log('⚠️ Campo No. Factura no encontrado');
    }

    // 21. Fecha Factura
    try {
      const fechaFacturaInput = await driver.findElement(By.xpath("//label[contains(text(), 'Fecha Factura')]/following-sibling::input | //input[@name='fecha_factura']"));
      await fechaFacturaInput.clear();
      await fechaFacturaInput.sendKeys('01/10/2025');
      console.log('✅ Fecha Factura completada');
    } catch (e) {
      console.log('⚠️ Campo Fecha Factura no encontrado');
    }

    // 22. No. Ingreso Almacén
    try {
      const ingresoAlmacenInput = await driver.findElement(By.xpath("//label[contains(text(), 'No. Ingreso Almacén')]/following-sibling::input | //input[@name='no_ingreso_almacen']"));
      await ingresoAlmacenInput.clear();
      await ingresoAlmacenInput.sendKeys(`ALM-${UNIQUE_REF}`);
      console.log('✅ No. Ingreso Almacén completado');
    } catch (e) {
      console.log('⚠️ Campo No. Ingreso Almacén no encontrado');
    }

    // 23. F/I Almacén (Fecha Ingreso Almacén)
    try {
      const fechaIngresoAlmacenInput = await driver.findElement(By.xpath("//label[contains(text(), 'F/I Almacén')]/following-sibling::input | //input[@name='fecha_ingreso_almacen']"));
      await fechaIngresoAlmacenInput.clear();
      await fechaIngresoAlmacenInput.sendKeys('02/10/2025');
      console.log('✅ F/I Almacén completada');
    } catch (e) {
      console.log('⚠️ Campo F/I Almacén no encontrado');
    }

    // 24. No. CUR
    try {
      const curInput = await driver.findElement(By.xpath("//label[contains(text(), 'No. CUR')]/following-sibling::input | //input[@name='no_cur']"));
      await curInput.clear();
      await curInput.sendKeys(`CUR-${UNIQUE_REF}`);
      console.log('✅ No. CUR completado');
    } catch (e) {
      console.log('⚠️ Campo No. CUR no encontrado');
    }

    // 25. Fecha CUR
    try {
      const fechaCurInput = await driver.findElement(By.xpath("//label[contains(text(), 'Fecha CUR')]/following-sibling::input | //input[@name='fecha_cur']"));
      await fechaCurInput.clear();
      await fechaCurInput.sendKeys('03/10/2025');
      console.log('✅ Fecha CUR completada');
    } catch (e) {
      console.log('⚠️ Campo Fecha CUR no encontrado');
    }

    // 26. Registro Sanitario
    try {
      const registroSanitarioInput = await driver.findElement(By.xpath("//label[contains(text(), 'Registro Sanitario')]/following-sibling::input | //input[@name='registro_sanitario']"));
      await registroSanitarioInput.clear();
      await registroSanitarioInput.sendKeys(`RS-${UNIQUE_REF}`);
      console.log('✅ Registro Sanitario completado');
    } catch (e) {
      console.log('⚠️ Campo Registro Sanitario no encontrado');
    }

    // 27. Distrito
    try {
      const distritoInput = await driver.findElement(By.xpath("//label[contains(text(), 'Distrito')]/following-sibling::input | //input[@name='distrito']"));
      await distritoInput.clear();
      await distritoInput.sendKeys('Distrito Central');
      console.log('✅ Distrito completado');
    } catch (e) {
      console.log('⚠️ Campo Distrito no encontrado');
    }

    // 28. Observaciones
    try {
      const observacionesInput = await driver.findElement(By.xpath("//label[contains(text(), 'Observaciones')]/following-sibling::textarea | //textarea[@name='observaciones'] | //label[contains(text(), 'Observaciones')]/following-sibling::input"));
      await observacionesInput.clear();
      await observacionesInput.sendKeys('Expediente de prueba automatizada E2E - Completado exitosamente');
      console.log('✅ Observaciones completadas');
    } catch (e) {
      console.log('⚠️ Campo Observaciones no encontrado');
    }

    // 29. Marcar como Finalizado
    try {
      const finalizadoCheckbox = await driver.findElement(By.xpath("//label[contains(text(), 'Finalizado')]/following-sibling::input[@type='checkbox'] | //input[@name='finalizado'] | //label[contains(text(), 'Finalizado')]/input"));
      if (!(await finalizadoCheckbox.isSelected())) {
        await finalizadoCheckbox.click();
        console.log('✅ Expediente marcado como Finalizado');
      } else {
        console.log('✅ Expediente ya estaba marcado como Finalizado');
      }
    } catch (e) {
      console.log('⚠️ Checkbox Finalizado no encontrado');
    }

    // Guardar el expediente
    console.log('💾 Guardando expediente...');
    
    // Hacer scroll hacia abajo para asegurar que el botón esté visible
    await driver.executeScript("window.scrollTo(0, document.body.scrollHeight);");
    await driver.sleep(1000);
    
    // Buscar el botón de guardar con múltiples estrategias
    let saveBtn = null;
    const strategies = [
      "//button[contains(text(), 'Guardar')]",
      "//button[contains(text(), 'Registrar')]", 
      "//button[contains(text(), 'Crear')]",
      "//button[contains(@class, 'btn-primary')]",
      "//input[@type='submit']",
      "//button[@type='submit']"
    ];
    
    for (const strategy of strategies) {
      try {
        const buttons = await driver.findElements(By.xpath(strategy));
        if (buttons.length > 0) {
          saveBtn = buttons[0];
          console.log(`✅ Botón encontrado con estrategia: ${strategy}`);
          break;
        }
      } catch (e) {
        console.log(`⚠️ Estrategia fallida: ${strategy}`);
      }
    }
    
    if (!saveBtn) {
      console.log('❌ No se encontró botón de guardar');
      throw new Error('No se pudo encontrar el botón de guardar');
    }
    
    // Intentar hacer clic con diferentes métodos
    let clickSuccess = false;
    
    // Método 1: Clic directo
    try {
      await saveBtn.click();
      clickSuccess = true;
      console.log('✅ Clic directo exitoso');
    } catch (e) {
      console.log('⚠️ Clic directo falló:', e.message);
    }
    
    // Método 2: JavaScript click si el directo falló
    if (!clickSuccess) {
      try {
        await driver.executeScript("arguments[0].click();", saveBtn);
        clickSuccess = true;
        console.log('✅ Clic con JavaScript exitoso');
      } catch (e) {
        console.log('⚠️ Clic con JavaScript falló:', e.message);
      }
    }
    
    // Método 3: Mover al elemento y hacer clic
    if (!clickSuccess) {
      try {
        await driver.actions().move({origin: saveBtn}).click().perform();
        clickSuccess = true;
        console.log('✅ Clic con actions exitoso');
      } catch (e) {
        console.log('⚠️ Clic con actions falló:', e.message);
      }
    }
    
    if (!clickSuccess) {
      console.log('❌ Todos los métodos de clic fallaron');
      // Tomar screenshot para diagnóstico
      const screenshot = await driver.takeScreenshot();
      const fs = require('fs');
      const path = require('path');
      const screenshotPath = path.join(__dirname, `error-guardar-${Date.now()}.png`);
      fs.writeFileSync(screenshotPath, screenshot, 'base64');
      console.log(`📸 Screenshot de error guardado en: ${screenshotPath}`);
      throw new Error('No se pudo hacer clic en el botón de guardar');
    }

    // Esperar mensaje de confirmación o cierre de modal
    console.log('⏳ Esperando confirmación...');
    await driver.sleep(3000);

    // Verificar si hay mensaje de confirmación
    try {
      const confirmMsg = await driver.findElements(By.xpath("//div[contains(text(), 'éxito') or contains(text(), 'guardado') or contains(text(), 'exitosamente')]"));
      if (confirmMsg.length > 0) {
        console.log('✅ Mensaje de confirmación detectado');
        
        // Cerrar mensaje si hay botón de cerrar
        try {
          const closeBtn = await driver.findElement(By.xpath("//button[contains(text(), 'Cerrar') or contains(text(), 'OK') or contains(text(), 'Aceptar')]"));
          await closeBtn.click();
          console.log('✅ Mensaje de confirmación cerrado');
        } catch (e) {
          console.log('⚠️ No se encontró botón para cerrar mensaje');
        }
      }
    } catch (e) {
      console.log('⚠️ No se detectó mensaje de confirmación');
    }

    // Verificar si el modal sigue abierto y cerrarlo
    try {
      const modalOpen = await driver.findElements(By.css('.modal-dialog, .modal'));
      if (modalOpen.length > 0) {
        console.log('🔄 Modal aún abierto, intentando cerrar...');
        const closeModalBtn = await driver.findElement(By.xpath("//button[contains(@class, 'close') or contains(@class, 'btn-close') or contains(text(), '×') or contains(@aria-label, 'Close')]"));
        await closeModalBtn.click();
        await driver.sleep(1000);
      }
    } catch (e) {
      console.log('⚠️ Error al intentar cerrar el modal:', e.message);
    }

    // Verificar que el expediente aparece en la tabla
    console.log(`🔍 Verificando que el expediente ${UNIQUE_REF} aparece en la tabla...`);
    let attempts = 0;
    const maxAttempts = 10;
    let foundRow = null;
    
    while (!foundRow && attempts < maxAttempts) {
      attempts++;
      console.log(`Intento ${attempts}/${maxAttempts}...`);
      
      // Refrescar la página si después de varios intentos
      if (attempts > 5) {
        console.log('🔄 Refrescando página...');
        await driver.navigate().refresh();
        await driver.sleep(2000);
      }
      
      foundRow = await findRowByText(UNIQUE_REF);
      if (!foundRow) {
        await driver.sleep(1000);
      }
    }
    
    if (foundRow) {
      console.log('✅ Expediente creado exitosamente y visible en la tabla');
    } else {
      console.log('⚠️ No se pudo verificar el expediente en la tabla');
    }
    
    // Tomar screenshot como evidencia
    try {
      const screenshot = await driver.takeScreenshot();
      const fs = require('fs');
      const path = require('path');
      const screenshotPath = path.join(__dirname, `expediente-creado-${UNIQUE_REF}.png`);
      fs.writeFileSync(screenshotPath, screenshot, 'base64');
      console.log(`📸 Screenshot guardado en: ${screenshotPath}`);
    } catch (e) {
      console.log('⚠️ No se pudo guardar screenshot:', e.message);
    }
    
    // Verificación final
    expect(foundRow).to.not.be.null;
  });
});
