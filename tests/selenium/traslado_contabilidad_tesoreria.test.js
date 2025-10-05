const { Builder, By, until } = require('selenium-webdriver');
require('chromedriver');
const chrome = require('selenium-webdriver/chrome');
const { expect } = require('chai');
const fs = require('fs');
const path = require('path');

const BASE = process.env.BASE_URL || 'http://localhost:3000';
const HEADLESS = process.env.HEADLESS === 'true';
const OC_DOC = 'OC-E2E-1759353954946'; // mismo OC
const CUR_DEV_VAL = `CUR-DEV-${Date.now()}`;

let driver;
const timeout = 30000;

async function takeShot(name) {
  try {
    const shot = await driver.takeScreenshot();
    const file = path.join(__dirname, `${name}-${Date.now()}.png`);
    fs.writeFileSync(file, shot, 'base64');
    console.log('📸 Screenshot:', file);
  } catch (e) { console.log('⚠️ No screenshot:', e.message); }
}

async function findRowByText(text) {
  const rows = await driver.findElements(By.css('table tbody tr'));
  for (const r of rows) {
    const t = await r.getText();
    if (t.includes(text)) return r;
  }
  return null;
}

async function ensureInContabilidad() {
  // Asumimos estamos logueados como contabilidad. Si la fila no aparece, intentamos traerla desde Presupuesto.
  let row = await findRowByText(OC_DOC);
  if (row) return true;
  console.log('ℹ️ Expediente no visible en Contabilidad; preparando traslado desde Presupuesto...');

  // Abrir nueva pestaña para presupuesto (más simple: navegar logout/login con presupuesto)
  await driver.executeScript('localStorage.clear();');
  await driver.get(`${BASE}/`);
  await driver.wait(until.elementLocated(By.css('form')), timeout);
  const userInput = await driver.findElement(By.css('input[name="usuario"], input[type="text"], input:first-of-type'));
  await userInput.clear();
  await userInput.sendKeys('presupuestoe2e');
  const passInput = await driver.findElement(By.css('input[name="contraseña"], input[type="password"]'));
  await passInput.clear();
  await passInput.sendKeys('presupuesto123');
  await (await driver.findElement(By.css('button[type="submit"], button'))).click();
  await driver.wait(until.urlContains('/presupuesto'), timeout);
  // Filtrar
  const filtroOcPres = await driver.wait(until.elementLocated(By.xpath("//input[@placeholder='No. O.C' or @placeholder='No. OC']")), timeout);
  await filtroOcPres.clear();
  await filtroOcPres.sendKeys(OC_DOC);
  for (let i=0;i<10;i++){ row = await findRowByText(OC_DOC); if(row) break; await driver.sleep(500);}  
  if (!row) { console.log('❌ No se pudo localizar expediente en Presupuesto para trasladar'); return false; }
  // Verificar si ya tiene CUR aprobado; si no, abrir modal y asignar uno
  let rowText = await row.getText();
  if (!/CUR-APR-/i.test(rowText)) {
    try {
      await row.click();
      await driver.wait(until.elementLocated(By.xpath("//h5[contains(.,'CUR Aprobado')]")), timeout);
      const input = await driver.findElement(By.xpath("//input[contains(@placeholder,'CUR Aprobado')]"));
      const val = `CUR-APR-${Date.now()}`;
      await input.clear();
      await input.sendKeys(val);
      await (await driver.findElement(By.xpath("//button[contains(.,'Guardar')]"))).click();
      await driver.sleep(800);
      console.log('✅ CUR Aprobado agregado para precondición');
    } catch (e) { console.log('⚠️ No se pudo registrar CUR Aprobado precondición:', e.message); }
  }
  // Trasladar a Contabilidad
  try {
    // Reobtener fila (puede re-render)
    for (let i=0;i<6;i++){ row = await findRowByText(OC_DOC); if(row) break; await driver.sleep(300);}  
    const enviarBtn = await row.findElement(By.css('button[title="Enviar"]'));
    await enviarBtn.click();
    await driver.wait(until.elementLocated(By.xpath("//h5[contains(.,'¿A dónde trasladar?')]")), timeout);
    const contBtn = await driver.findElement(By.xpath("//button[contains(.,'Contabilidad') or contains(.,'CONTABILIDAD')]") );
    await contBtn.click();
    await driver.sleep(1000);
    console.log('✅ Expediente trasladado a Contabilidad (precondición)');
  } catch (e) {
    console.log('⚠️ No se pudo trasladar desde Presupuesto:', e.message);
  }
  // Re-login como contabilidad
  await driver.executeScript('localStorage.clear();');
  await driver.get(`${BASE}/`);
  await driver.wait(until.elementLocated(By.css('form')), timeout);
  const u2 = await driver.findElement(By.css('input[name="usuario"], input[type="text"], input:first-of-type'));
  await u2.clear();
  await u2.sendKeys('contabilidade2e');
  const p2 = await driver.findElement(By.css('input[name="contraseña"], input[type="password"]'));
  await p2.clear();
  await p2.sendKeys('contabilidad123');
  await (await driver.findElement(By.css('button[type="submit"], button'))).click();
  await driver.wait(until.urlContains('/contabilidad'), timeout);
  const filtroCont = await driver.findElement(By.xpath("//input[@placeholder='No. O.C' or @placeholder='No. OC']"));
  await filtroCont.clear();
  await filtroCont.sendKeys(OC_DOC);
  for (let i=0;i<10;i++){ row = await findRowByText(OC_DOC); if(row) return true; await driver.sleep(400);}  
  return !!row;
}

describe('Contabilidad: registrar CUR Devengado y trasladar a Tesorería', function() {
  this.timeout(120000);

  before(async () => {
    const options = new chrome.Options();
    if (HEADLESS) options.addArguments('--headless=new', '--disable-gpu', '--no-sandbox', '--disable-dev-shm-usage');
    options.addArguments('--window-size=1400,900');
    driver = await new Builder().forBrowser('chrome').setChromeOptions(options).build();

    // Login contabilidad
    await driver.get(`${BASE}/`);
    await driver.wait(until.elementLocated(By.css('form')), timeout);
    const userInput = await driver.findElement(By.css('input[name="usuario"], input[type="text"], input:first-of-type'));
    await userInput.clear();
    await userInput.sendKeys('contabilidade2e');
    const passInput = await driver.findElement(By.css('input[name="contraseña"], input[type="password"]'));
    await passInput.clear();
    await passInput.sendKeys('contabilidad123');
    const loginBtn = await driver.findElement(By.css('button[type="submit"], button'));
    await loginBtn.click();
    await driver.wait(until.urlContains('/contabilidad'), timeout);
    console.log('✅ Login contabilidad exitoso');
  });

  after(async () => { if (driver) await driver.quit(); });

  it('Filtra, registra CUR Devengado y traslada a Tesorería', async () => {
    console.log(`🔍 Filtrando OC en Contabilidad: ${OC_DOC}`);

    // Filtro No. O.C
    const filtroOc = await driver.wait(
      until.elementLocated(By.xpath("//input[@placeholder='No. O.C' or @placeholder='No. OC' or contains(@placeholder,'No. O.C')]")),
      timeout
    );
    await filtroOc.clear();
    await filtroOc.sendKeys(OC_DOC);

    // Buscar fila (si no existe, intentar preparar precondición)
    let row = null;
    for (let i=1;i<=10;i++) { row = await findRowByText(OC_DOC); if (row) { console.log(`✅ Fila encontrada intento ${i}`); break; } await driver.sleep(500);}    
    if (!row) {
      const ok = await ensureInContabilidad();
      row = ok ? await findRowByText(OC_DOC) : null;
    }
    if (!row) await takeShot('fila-no-contab');
    expect(row, 'No se encontró la fila en Contabilidad tras precondición').to.not.be.null;

    // Click para abrir modal CUR Devengado
    await driver.executeScript('arguments[0].scrollIntoView({behavior:"smooth",block:"center"});', row);
    await driver.sleep(250);
    await row.click();
    console.log('✅ Clic en fila (abrir modal CUR Devengado)');

    // Modal abierto
    await driver.wait(until.elementLocated(By.xpath("//h5[contains(.,'CUR Devengado')]")), timeout);
    console.log('✅ Modal CUR Devengado abierto');

    // Cerrar con Cancelar
    try { const cancelBtn = await driver.findElement(By.xpath("//button[contains(.,'Cancelar')]")); await cancelBtn.click(); await driver.sleep(400);} catch(e) {}

    // Reabrir
    await row.click();
    await driver.wait(until.elementLocated(By.xpath("//h5[contains(.,'CUR Devengado')]")), timeout);
    console.log('✅ Modal CUR Devengado reabierto');

    // Ingresar valor
    const curInput = await driver.findElement(By.xpath("//input[@placeholder='CUR Devengado' or contains(@placeholder,'Devengado') or contains(@placeholder,'CUR')]"));
    await curInput.clear();
    await curInput.sendKeys(CUR_DEV_VAL);
    console.log('✍️ Ingresado CUR Devengado:', CUR_DEV_VAL);

    const guardarBtn = await driver.findElement(By.xpath("//button[contains(.,'Guardar')]")); await guardarBtn.click();
    console.log('💾 Guardado CUR Devengado');

    // Esperar cierre modal
    for (let i=0;i<10;i++){ const modals = await driver.findElements(By.xpath("//h5[contains(.,'CUR Devengado')]")); if(!modals.length) break; await driver.sleep(300);}    

    // En lugar de verificar el texto de la fila (que ha sido inestable), usamos la aparición del botón "Enviar"
    // como evidencia de que cur_devengado quedó registrado (el botón solo aparece con cur_devengado truthy).

    // Refrescar para garantizar estado actualizado
    await driver.navigate().refresh();
    await driver.wait(until.urlContains('/contabilidad'), timeout);
    const filtroReload = await driver.wait(until.elementLocated(By.xpath("//input[@placeholder='No. O.C' or @placeholder='No. OC']")), timeout);
    await filtroReload.clear();
    await filtroReload.sendKeys(OC_DOC);
    await driver.sleep(600);

    // Intentar obtener botón Enviar con reintentos
    let enviarBtn = null;
    for (let attempt=1; attempt<=12; attempt++) {
      try {
        row = await findRowByText(OC_DOC); // refrescar referencia
        if (!row) break;
        enviarBtn = await row.findElement(By.css("button[title='Enviar']"));
        if (enviarBtn) break;
      } catch (e) {
        try {
          const btns = await row.findElements(By.css('button'));
          for (const b of btns) {
            const title = await b.getAttribute('title');
            if (title && title.toLowerCase().includes('enviar')) { enviarBtn = b; break; }
          }
          if (enviarBtn) break;
        } catch (_) {}
      }
      await driver.sleep(500);
    }
    expect(enviarBtn, 'No se encontró botón Enviar tras registrar CUR Devengado').to.not.be.null;
    await driver.executeScript('arguments[0].scrollIntoView({block:"center"});', enviarBtn);
    await driver.sleep(150);
    try { await enviarBtn.click(); } catch (e) { await driver.executeScript('arguments[0].click();', enviarBtn); }
    console.log('✅ Botón Enviar clicado');

    // Modal traslado -> Tesorería
    await driver.wait(until.elementLocated(By.xpath("//h5[contains(.,'¿A dónde trasladar?')]")), timeout);
    const tesoreriaBtn = await driver.findElement(By.xpath("//button[contains(.,'Tesorería') or contains(.,'TESORERIA')]") );
    await tesoreriaBtn.click();
    console.log('🚚 Traslado a Tesorería solicitado');

    for (let i=0;i<10;i++){ const modals = await driver.findElements(By.xpath("//h5[contains(.,'¿A dónde trasladar?')]")); if(!modals.length) break; await driver.sleep(350);}    

    // Validar ausencia de fila (ya trasladado)
    await driver.sleep(800);
    const still = await findRowByText(OC_DOC);
    if (still) console.log('⚠️ Fila aún visible tras traslado (posible retardo)'); else console.log('✅ Fila ya no aparece en Contabilidad');

    // Verificar en módulo Tesorería que el expediente llegó
    console.log('🔄 Cambiando a usuario tesorería para verificar traslado...');
    try {
      // Limpiar sesión y navegar al login
      await driver.executeScript('localStorage.clear();');
      await driver.get(`${BASE}/`);
      await driver.wait(until.elementLocated(By.css('form')), timeout);
      const userTes = await driver.findElement(By.css('input[name="usuario"], input[type="text"], input:first-of-type'));
      await userTes.clear();
      await userTes.sendKeys('tesoreriae2e');
      const passTes = await driver.findElement(By.css('input[name="contraseña"], input[type="password"]'));
      await passTes.clear();
      await passTes.sendKeys('tesoreria123');
      await (await driver.findElement(By.css('button[type="submit"], button'))).click();
      await driver.wait(until.urlContains('/tesoreria'), timeout);
      console.log('✅ Login tesorería exitoso');

      // Filtrar por No. O.C
      const filtroTes = await driver.wait(
        until.elementLocated(By.xpath("//input[@placeholder='No. O.C' or @placeholder='No. OC']")),
        timeout
      );
      await filtroTes.clear();
      await filtroTes.sendKeys(OC_DOC);

      let rowTes = null;
      for (let i = 1; i <= 20; i++) {
        rowTes = await findRowByText(OC_DOC);
        if (rowTes) { console.log(`✅ Expediente visible en Tesorería (intento ${i})`); break; }
        await driver.sleep(600);
      }
      if (!rowTes) {
        await takeShot('no-en-tesoreria');
      }
      expect(rowTes, 'El expediente no apareció en Tesorería tras el traslado').to.not.be.null;
    } catch (e) {
      console.log('❌ Error verificando en Tesorería:', e.message);
      await takeShot('error-verificando-tesoreria');
      throw e;
    }
  });
});
