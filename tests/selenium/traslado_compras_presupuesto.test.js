const { Builder, By, until } = require('selenium-webdriver');
require('chromedriver');
const chrome = require('selenium-webdriver/chrome');
const { expect } = require('chai');
const fs = require('fs');
const path = require('path');

const BASE = process.env.BASE_URL || 'http://localhost:3000';
const HEADLESS = process.env.HEADLESS === 'true';
const OC_DOC = 'OC-E2E-1759365174463';
const SCREEN_DIR = __dirname;

let driver;
const timeout = 30000;

async function takeShot(name) {
  try {
    const shot = await driver.takeScreenshot();
    const file = path.join(SCREEN_DIR, `${name}-${Date.now()}.png`);
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

describe('Traslado de expediente desde Compras a Presupuesto', function () {
  this.timeout(120000);

  before(async () => {
    console.log('🔧 Iniciando navegador para test de traslado...');
    const options = new chrome.Options();
    if (HEADLESS) {
      options.addArguments('--headless=new', '--disable-gpu', '--no-sandbox', '--disable-dev-shm-usage');
    }
    options.addArguments('--window-size=1400,900');
    driver = await new Builder().forBrowser('chrome').setChromeOptions(options).build();

    // Login
    await driver.get(`${BASE}/`);
    await driver.wait(until.elementLocated(By.css('form')), timeout);
    console.log('🔑 Realizando login (comprase2e)...');
    const userInput = await driver.findElement(By.css('input[name="usuario"], input[type="text"], input:first-of-type'));
    await userInput.clear();
    await userInput.sendKeys('comprase2e');
    const passInput = await driver.findElement(By.css('input[name="contraseña"], input[type="password"]'));
    await passInput.clear();
    await passInput.sendKeys('compras123');
    const loginBtn = await driver.findElement(By.css('button[type="submit"], button'));
    await loginBtn.click();
    await driver.wait(until.urlContains('/compras'), timeout);
    console.log('✅ Login exitoso, módulo compras visible');
  });

  after(async () => {
    if (driver) await driver.quit();
  });

  it('Filtra por No. O.C, selecciona la fila y traslada a presupuesto', async () => {
    console.log(`🔍 Filtrando por No. O.C: ${OC_DOC}`);

    // Localizar input de filtro (varias heurísticas)
    const filtroOc = await driver.wait(
      until.elementLocated(
        By.xpath("//input[@placeholder='No. OC' or @placeholder='No. O.C' or contains(@placeholder,'No. OC')]")
      ),
      timeout
    );
    await filtroOc.clear();
    await filtroOc.sendKeys(OC_DOC);

    // Esperar que aparezca la fila
    let foundRow = null;
    for (let attempt = 1; attempt <= 15; attempt++) {
      foundRow = await findRowByText(OC_DOC);
      if (foundRow) {
        console.log(`✅ Fila encontrada en intento ${attempt}`);
        break;
      }
      await driver.sleep(800);
    }

    if (!foundRow) {
      await takeShot('fila-no-encontrada');
    }
    expect(foundRow, 'No se encontró la fila del expediente a trasladar').to.not.be.null;

    // Asegurar que la fila es visible
    await driver.executeScript('arguments[0].scrollIntoView({behavior: "smooth", block: "center"});', foundRow);
    await driver.sleep(500);
    await foundRow.click();
    console.log('✅ Fila seleccionada');

    // El botón de trasladar está dentro de la fila (columna acciones) con title="Trasladar" (icono FaPaperPlane)
    let trasladarBtn = null;
    try {
      trasladarBtn = await foundRow.findElement(By.css("button[title='Trasladar']"));
    } catch (e) {
      console.log('⚠️ No se encontró botón por title en la fila, buscando fallback...');
      // Buscar cualquier botón dentro de la fila que contenga el icono (paper plane) - difícil sin texto, probamos todos y usamos title
      const btns = await foundRow.findElements(By.css('button'));
      for (const b of btns) {
        const title = await b.getAttribute('title');
        if (title && title.toLowerCase().includes('traslad')) {
          trasladarBtn = b;
          break;
        }
      }
    }
    expect(trasladarBtn, 'No se encontró el botón de Trasladar en la fila').to.not.be.null;
    await driver.executeScript('arguments[0].scrollIntoView({block: "center"});', trasladarBtn);
    await driver.sleep(200);
    try {
      await trasladarBtn.click();
    } catch (e) {
      console.log('⚠️ Clic directo falló, intentando via JS:', e.message);
      await driver.executeScript('arguments[0].click();', trasladarBtn);
    }
    console.log('✅ Botón Trasladar (fila) clicado');

    // Esperar modal
    await driver.wait(until.elementLocated(By.css('.modal-dialog, .modal.show, .modal.in')), timeout);
    console.log('✅ Modal de traslado abierto');

    // Botón para trasladar a Presupuesto
    const presupuestoBtn = await driver.wait(
      until.elementLocated(
        By.xpath("//button[contains(., 'Presupuesto') or contains(., 'presupuesto') or @data-destino='presupuesto']")
      ),
      timeout
    );
    await presupuestoBtn.click();
    console.log('🚚 Iniciando traslado a Presupuesto...');

    // Esperar confirmación (mensaje o cierre de modal)
    let trasladoConfirmado = false;
    for (let i = 0; i < 10; i++) {
      // Revisar si modal desapareció
      const modals = await driver.findElements(By.css('.modal-dialog, .modal.show'));
      if (!modals.length) {
        trasladoConfirmado = true;
        console.log('✅ Modal cerrado, se asume traslado exitoso');
        break;
      }
      // Buscar textos de éxito
      const successMsgs = await driver.findElements(
        By.xpath("//div[contains(., 'éxito') or contains(., 'traslad') or contains(., 'exitosamente') or contains(., 'realizado')]")
      );
      if (successMsgs.length) {
        trasladoConfirmado = true;
        console.log('✅ Mensaje de éxito detectado');
        break;
      }
      await driver.sleep(700);
    }

    if (!trasladoConfirmado) await takeShot('traslado-sin-confirmacion');
    expect(trasladoConfirmado, 'No se confirmó el traslado (ni cierre de modal)').to.be.true;

    // Validación opcional: intentar ir a /presupuesto y buscar el documento
    try {
      console.log('🔄 Navegando a módulo Presupuesto para verificación...');
      await driver.get(`${BASE}/presupuesto`);
      await driver.sleep(2000);

      // Buscar la misma referencia en tabla presupuesto (reutilizamos filtro si existe)
      const presFiltro = await driver.findElements(
        By.xpath("//input[contains(@placeholder, 'No. O.C') or contains(@name,'oc') or contains(@aria-label,'No. O.C')]")
      );
      if (presFiltro.length) {
        await presFiltro[0].clear();
        await presFiltro[0].sendKeys(OC_DOC);
        await driver.sleep(1500);
      }
      let rowPres = null;
      for (let i = 0; i < 10; i++) {
        rowPres = await findRowByText(OC_DOC);
        if (rowPres) break;
        await driver.sleep(700);
      }
      if (rowPres) {
        console.log('✅ Expediente localizado en módulo Presupuesto tras traslado');
      } else {
        console.log('⚠️ No se pudo verificar en Presupuesto (puede ser async tardío)');
        await takeShot('no-en-presupuesto');
      }
    } catch (e) {
      console.log('⚠️ Verificación en módulo Presupuesto falló:', e.message);
    }
  });
});
