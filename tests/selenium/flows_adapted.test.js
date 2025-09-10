const { Builder, By, until } = require('selenium-webdriver');
require('chromedriver');
const chrome = require('selenium-webdriver/chrome');
const { expect } = require('chai');

const BASE = process.env.BASE_URL || 'http://localhost:3000'; // URL base de la aplicación
const HEADLESS = process.env.HEADLESS === 'true'; // Ejecutar en modo headless

let driver; // Inicializa el driver de Selenium
const timeout = 20000; // Tiempo de espera para las pruebas
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

//   Flujo adaptado: login -> crear -> trasladar -> eliminar
describe('Flujo adaptado: login -> crear -> trasladar -> eliminar', function() {
  this.timeout(120000);

  before(async () => {
    const options = new chrome.Options();
    if (HEADLESS) options.addArguments('--headless=new', '--disable-gpu');
    options.addArguments('--window-size=1400,900');

    driver = await new Builder().forBrowser('chrome').setChromeOptions(options).build();

    // Navega al dominio de la app primero (misma origin) y espera carga completa
    await driver.get(BASE);
    await driver.wait(async () => {
      try {
        const ready = await driver.executeScript('return document.readyState');
        const origin = await driver.executeScript('return window.location.origin');
        return ready === 'complete' && origin === new URL(BASE).origin;
      } catch (e) {
        return false;
      }
    }, timeout);

    // Intenta setear localStorage en el mismo origin; si falla, lo registra y continúa
    try {
      await driver.executeScript("localStorage.setItem('rol','compras'); localStorage.setItem('token','dummy-token');");
    } catch (e) {
      // si falla aquí, probablemente la app redirige a otra origin o hay CSP; log para depuración
      console.warn('No se pudo acceder a localStorage en', BASE, e);
    }

    // Ahora navega a la página protegida /compras
    await driver.get(`${BASE}/compras`);
    await driver.wait(
      until.elementLocated(By.xpath("//button[contains(., 'REGISTRAR') or contains(., 'Registrar')] | //table")),
      timeout
    );
  });

  after(async () => {
    if (driver) await driver.quit();
  });

  it('Crear expediente (modal genérico)', async () => {
    UNIQUE_REF = `TEST-${Date.now()}`;

    // Asegúrate de esperar y buscar botón Registrar con varios selectores
    const registrarBtn = await driver.wait(
      until.elementLocated(By.xpath("//button[contains(., 'REGISTRAR') or contains(., 'Registrar') or @data-testid='open-create']")),
      timeout
    );
    await registrarBtn.click();

    // espera modal
    await driver.wait(until.elementLocated(By.css('.modal-dialog, form')), timeout);

    // Rellena el primer input de texto del modal
    const input = await driver.findElement(By.css('.modal-dialog input[type="text"], .modal-dialog input:not([type]), form input[type="text"], form input:not([type])'));
    await input.clear();
    await input.sendKeys(UNIQUE_REF);

    const saveBtn = await driver.findElement(By.xpath("//button[contains(., 'Guardar') or contains(., 'Registrar') or contains(., 'Crear') or @data-testid='save']"));
    await saveBtn.click();

    // espera que la fila aparezca
    await driver.wait(async () => {
      const row = await findRowByText(UNIQUE_REF);
      return row !== null;
    }, timeout);
  });

  it('Trasladar expediente usando ModalTraslado', async () => {
    const row = await findRowByText(UNIQUE_REF);
    expect(row, 'fila creada no encontrada').to.not.be.null;

    // obtener botón trasladar en el elemento de fila fresco
    const trasladarBtn = await row.findElement(By.css('button[title="Trasladar"], button[aria-label="trasladar"], button[data-testid="trasladar"]'));
    await trasladarBtn.click();

    // espera modal
    await driver.wait(until.elementLocated(By.css('.modal-body')), timeout);
    const contabilidadBtn = await driver.findElement(By.xpath("//div[contains(@class,'modal-body')]//button[contains(., 'Contabilidad')]"));
    await contabilidadBtn.click();

    // espera que el texto "Contabilidad" aparezca en la fila
    await driver.wait(async () => {
      const r = await findRowByText(UNIQUE_REF);
      const t = await r.getText();
      return /contabilidad/i.test(t);
    }, timeout);
  });

  it('Eliminar expediente', async () => {
    const start = Date.now();
    let row = null;

    // reintentar encontrar y eliminar la fila hasta agotar timeout
    while ((Date.now() - start) < timeout) {
      try {
        row = await findRowByText(UNIQUE_REF);
        if (!row) {
          await driver.sleep(500);
          continue;
        }

        // obtener botón eliminar en el elemento de fila fresco
        const eliminarBtn = await row.findElement(By.css('button[title="Eliminar"], button[aria-label="eliminar"], button[data-testid="delete"]'));
        await eliminarBtn.click();

        // manejar confirmación (alert nativo o modal)
        try {
          await driver.wait(until.alertIsPresent(), 2000);
          const alert = await driver.switchTo().alert();
          await alert.accept();
        } catch (e) {
          const confirmBtns = await driver.findElements(By.xpath("//button[contains(., 'Eliminar') or contains(., 'Sí') or contains(., 'Confirmar')]"));
          if (confirmBtns.length) await confirmBtns[0].click();
        }

        // esperar que la fila desaparezca
        const removed = await driver.wait(async () => {
          const r = await findRowByText(UNIQUE_REF);
          return r === null;
        }, 10000).catch(()=>false);

        if (removed) return; // éxito

      } catch (err) {
        // reintentar en errores temporales / stale / interceptados
        if (err.name && (err.name === 'StaleElementReferenceError' || err.name === 'ElementClickInterceptedError')) {
          await driver.sleep(500);
          continue;
        }
        throw err;
      }
    }

    // si llegó aquí, no se eliminó en el tiempo esperado -> falla explícita
    const still = await findRowByText(UNIQUE_REF);
    expect(still, 'No se pudo eliminar la fila de pruebas').to.be.null;
  });
});
