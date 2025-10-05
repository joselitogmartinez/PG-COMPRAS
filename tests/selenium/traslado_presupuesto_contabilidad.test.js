const { Builder, By, until } = require('selenium-webdriver');
require('chromedriver');
const chrome = require('selenium-webdriver/chrome');
const { expect } = require('chai');
const fs = require('fs');
const path = require('path');

const BASE = process.env.BASE_URL || 'http://localhost:3000';
const HEADLESS = process.env.HEADLESS === 'true';
const OC_DOC = 'OC-E2E-1759365174463'; // mismo OC del test de traslado compras->presupuesto
const CUR_APROBADO_VAL = `CUR-APR-${Date.now()}`;

let driver;
const timeout = 30000;

async function takeShot(name) {
  try {
    const shot = await driver.takeScreenshot();
    const file = path.join(__dirname, `${name}-${Date.now()}.png`);
    fs.writeFileSync(file, shot, 'base64');
    console.log('📸 Screenshot:', file);
  } catch (e) {
    console.log('⚠️ No se pudo tomar screenshot:', e.message);
  }
}

async function findRowByText(text) {
  const rows = await driver.findElements(By.css('table tbody tr'));
  for (const r of rows) {
    const t = await r.getText();
    if (t.includes(text)) return r;
  }
  return null;
}

describe('Presupuesto: registrar CUR y trasladar a Contabilidad', function () {
  this.timeout(120000);

  before(async () => {
    const options = new chrome.Options();
    if (HEADLESS) options.addArguments('--headless=new', '--disable-gpu', '--no-sandbox', '--disable-dev-shm-usage');
    options.addArguments('--window-size=1400,900');
    driver = await new Builder().forBrowser('chrome').setChromeOptions(options).build();

    // Login como usuario presupuesto
    await driver.get(`${BASE}/`);
    await driver.wait(until.elementLocated(By.css('form')), timeout);
    const userInput = await driver.findElement(By.css('input[name="usuario"], input[type="text"], input:first-of-type'));
    await userInput.clear();
    await userInput.sendKeys('presupuestoe2e');
    const passInput = await driver.findElement(By.css('input[name="contraseña"], input[type="password"]'));
    await passInput.clear();
    await passInput.sendKeys('presupuesto123');
    const loginBtn = await driver.findElement(By.css('button[type="submit"], button'));
    await loginBtn.click();
    await driver.wait(until.urlContains('/presupuesto'), timeout);
    console.log('✅ Login presupuesto exitoso');
  });

  after(async () => {
    if (driver) await driver.quit();
  });

  it('Filtra por No. OC, abre modal CUR, lo cierra, vuelve a abrir, guarda y traslada a Contabilidad', async () => {
    console.log(`🔍 Filtrando OC en Presupuesto: ${OC_DOC}`);

    // Filtro No. OC
    const filtroOc = await driver.wait(
      until.elementLocated(By.xpath("//input[@placeholder='No. O.C' or @placeholder='No. OC' or contains(@placeholder,'No. O.C')]")),
      timeout
    );
    await filtroOc.clear();
    await filtroOc.sendKeys(OC_DOC);

    // Esperar fila
    let row = null;
    for (let i = 1; i <= 15; i++) {
      row = await findRowByText(OC_DOC);
      if (row) {
        console.log(`✅ Fila encontrada (intento ${i})`);
        break;
      }
      await driver.sleep(700);
    }
    if (!row) await takeShot('fila-no-encontrada-presupuesto');
    expect(row, 'No se encontró la fila en Presupuesto').to.not.be.null;

    // Click para abrir modal CUR (primer click abre modal de CUR Aprobado según lógica)
    await driver.executeScript('arguments[0].scrollIntoView({behavior:"smooth",block:"center"});', row);
    await driver.sleep(300);
    await row.click();
    console.log('✅ Clic en fila (abrir modal CUR)');

    // Esperar modal CUR
    let curModal = await driver.wait(
      until.elementLocated(By.xpath("//div[contains(@class,'modal-dialog')]//h5[contains(.,'CUR Aprobado')]/ancestor::div[contains(@class,'modal-content')]")),
      timeout
    );
    console.log('✅ Modal CUR abierto');

    // Cerrar modal con botón Cancelar
    const cancelarBtn = await driver.findElement(By.xpath("//button[contains(.,'Cancelar')]"));
    await cancelarBtn.click();
    await driver.sleep(500);
    // Asegurar que se cerró
    let stillOpen = await driver.findElements(By.xpath("//div[contains(@class,'modal-dialog')]//h5[contains(.,'CUR Aprobado')]"));
    if (stillOpen.length) {
      console.log('⚠️ Modal no cerró con Cancelar, intentando botón X');
      try {
        const closeX = await driver.findElement(By.css('button.btn-close, button.btn-close-white'));
        await closeX.click();
        await driver.sleep(400);
      } catch (e) {}
    }

    // Reabrir (click fila nuevamente)
    await row.click();
    await driver.wait(until.elementLocated(By.xpath("//h5[contains(.,'CUR Aprobado')]")), timeout);
    console.log('✅ Modal CUR reabierto');

    // Input CUR Aprobado
    const curInput = await driver.findElement(By.xpath("//input[@placeholder='CUR Aprobado' or @placeholder='CUR aprobado' or contains(@placeholder,'CUR Aprob')]"));
    await curInput.clear();
    await curInput.sendKeys(CUR_APROBADO_VAL);
    console.log('✍️ Ingresado CUR Aprobado:', CUR_APROBADO_VAL);

    // Guardar
    const guardarBtn = await driver.findElement(By.xpath("//button[contains(.,'Guardar')]"));
    await guardarBtn.click();
    console.log('💾 Guardado CUR Aprobado');

    // Esperar cierre modal
    for (let i = 0; i < 10; i++) {
      const modals = await driver.findElements(By.xpath("//h5[contains(.,'CUR Aprobado')]"));
      if (!modals.length) break;
      await driver.sleep(300);
    }

    // Verificar que CUR Aprobado aparece en la fila (refrescar fila text)
    let textRow = await row.getText();
    if (!textRow.includes(CUR_APROBADO_VAL)) {
      // puede que la fila se re-renderizó -> volver a buscar
      for (let i = 0; i < 10; i++) {
        row = await findRowByText(OC_DOC);
        if (row) {
          textRow = await row.getText();
          if (textRow.includes(CUR_APROBADO_VAL)) break;
        }
        await driver.sleep(500);
      }
    }
    if (!textRow.includes(CUR_APROBADO_VAL)) await takeShot('cur-no-visible');
    expect(textRow.includes(CUR_APROBADO_VAL), 'El CUR aprobado no se reflejó en la tabla').to.be.true;
    console.log('✅ CUR Aprobado visible en la fila');

    // Ahora debería aparecer botón Enviar (title="Enviar") en la columna Acciones
    let enviarBtn = null;
    try {
      enviarBtn = await row.findElement(By.css("button[title='Enviar']"));
    } catch (e) {
      console.log('⚠️ Botón Enviar no encontrado en fila; escaneando botones...');
      const btns = await row.findElements(By.css('button'));
      for (const b of btns) {
        const title = await b.getAttribute('title');
        if (title && title.toLowerCase().includes('enviar')) { enviarBtn = b; break; }
      }
    }
    expect(enviarBtn, 'No se encontró botón Enviar para traslado').to.not.be.null;
    await driver.executeScript('arguments[0].scrollIntoView({block:"center"});', enviarBtn);
    await driver.sleep(200);
    try { await enviarBtn.click(); } catch (e) { await driver.executeScript('arguments[0].click();', enviarBtn); }
    console.log('✅ Botón Enviar clicado');

    // Modal traslado -> seleccionar Contabilidad
    await driver.wait(until.elementLocated(By.xpath("//h5[contains(.,'¿A dónde trasladar?')]")), timeout);
    const contabBtn = await driver.findElement(By.xpath("//button[contains(.,'Contabilidad') or contains(.,'CONTABILIDAD')]") );
    await contabBtn.click();
    console.log('🚚 Traslado a Contabilidad solicitado');

    // Esperar confirmación (cierre modal)
    for (let i = 0; i < 10; i++) {
      const modals = await driver.findElements(By.xpath("//h5[contains(.,'¿A dónde trasladar?')]"));
      if (!modals.length) break;
      await driver.sleep(400);
    }

    // Validar que ya no está en Presupuesto (fila puede desaparecer del filtro)
    await driver.sleep(1000);
    const stillRow = await findRowByText(OC_DOC);
    if (stillRow) {
      console.log('⚠️ Fila aún visible (puede ser render asíncrono)');
    } else {
      console.log('✅ Fila ya no aparece en Presupuesto (traslado aplicado)');
    }
  });
});
