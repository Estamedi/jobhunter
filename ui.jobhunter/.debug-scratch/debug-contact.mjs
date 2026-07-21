import { chromium } from 'playwright'

const BASE = 'http://localhost:5173'

const capturedRequests = []
const consoleMessages = []

const browser = await chromium.launch({ headless: true })
const context = await browser.newContext()
const page = await context.newPage()

page.on('console', (msg) => {
  consoleMessages.push({ type: msg.type(), text: msg.text() })
})
page.on('pageerror', (err) => {
  consoleMessages.push({ type: 'pageerror', text: err.message })
})
page.on('response', async (res) => {
  if (res.url().includes('/api/')) {
    let body = ''
    try { body = await res.text() } catch {}
    console.log('API RESPONSE', res.request().method(), res.url(), res.status(), body.slice(0,300))
  }
})
page.on('requestfailed', (req) => {
  console.log('REQUEST FAILED', req.method(), req.url(), req.failure()?.errorText)
})
page.on('request', (req) => {
  if (req.url().includes('/api/')) {
    console.log('API REQUEST', req.method(), req.url())
  }
})

// Log in
await page.goto(`${BASE}/sign-in`, { waitUntil: 'networkidle' })
await page.waitForTimeout(500)

// Try to find email/password inputs
const emailInput = page.locator('input[name="email"], input[type="email"]').first()
const passwordInput = page.locator('input[name="password"], input[type="password"]').first()
await emailInput.click()
await emailInput.fill('administrator@localhost.com')
await passwordInput.click()
await passwordInput.fill('Administrator1!')
console.log('email value:', await emailInput.inputValue())
console.log('password value:', await passwordInput.inputValue())
await page.screenshot({ path: '/home/saber/Repository/MyProjects/jobhunt-crm/jobhunter/ui.jobhunter/.debug-scratch/00-before-submit.png' })
const signInButtons = await page.getByRole('button', { name: /sign in/i }).all()
console.log('num sign in buttons found:', signInButtons.length)
await page.getByRole('button', { name: /sign in/i }).first().click()
await page.waitForTimeout(3000)
const toastText = await page.locator('[data-sonner-toast]').allInnerTexts().catch(() => [])
console.log('toasts:', toastText)
await page.screenshot({ path: '/home/saber/Repository/MyProjects/jobhunt-crm/jobhunter/ui.jobhunter/.debug-scratch/00b-after-submit.png' })
const formErrors = await page.locator('form p, form [role="alert"]').allInnerTexts().catch(() => [])
console.log('form errors:', formErrors)

console.log('URL after login:', page.url())

// Navigate to applications list
await page.goto(`${BASE}/applications`, { waitUntil: 'networkidle' })
await page.waitForTimeout(1500)
console.log('URL after nav to /applications:', page.url())

// Click the application card "Acme Corp / Backend Engineer" inside the Wishlist column
let opened = false
try {
  await page.getByText('Acme Corp', { exact: false }).first().click({ timeout: 5000 })
  opened = true
} catch (e) {
  console.log('card click failed', e.message)
}

if (!opened) {
  console.log('Could not find application card. Dumping page content snippet.')
  const bodyText = await page.locator('body').innerText()
  console.log(bodyText.slice(0, 3000))
}

await page.waitForTimeout(1500)
console.log('URL after clicking Wishlist app:', page.url())

await page.screenshot({ path: '/tmp/claude-1000/-home-saber-Repository-MyProjects-jobhunt-crm-jobhunter/31567d14-dcb5-4952-829f-ecf327a05288/scratchpad/01-after-click.png', fullPage: true })

// Find the "Main contact" panel and its edit (pencil) icon
const dialog = page.locator('[role="dialog"]').first()
const mainContactHeading = dialog.getByText('Main contact', { exact: false }).first()
await mainContactHeading.scrollIntoViewIfNeeded()
await page.waitForTimeout(300)
console.log('main contact heading count:', await mainContactHeading.count())

await page.screenshot({ path: '/tmp/claude-1000/-home-saber-Repository-MyProjects-jobhunt-crm-jobhunter/31567d14-dcb5-4952-829f-ecf327a05288/scratchpad/02-app-dialog.png', fullPage: true })

// The Main contact panel is a card; find the pencil/edit button that is a sibling near the heading.
// Structure: <div card> <div header with icon + "Main contact" + edit button> ... </div>
const mainContactCard = dialog.locator('div').filter({ has: page.getByText('Main contact', { exact: true }) }).last()
const editPencilButton = mainContactCard.locator('button').first()
console.log('main contact card button count:', await mainContactCard.locator('button').count())

// ==== SET UP NETWORK LISTENER BEFORE INTERACTING WITH EDIT DIALOG ====
const contactRequests = []
page.on('request', (req) => {
  if (req.url().includes('/api/contacts/')) {
    contactRequests.push({
      phase: 'request',
      method: req.method(),
      url: req.url(),
      postData: req.postData(),
      headers: req.headers(),
    })
  }
})
page.on('response', async (res) => {
  if (res.url().includes('/api/contacts/')) {
    let body = ''
    try { body = await res.text() } catch {}
    contactRequests.push({
      phase: 'response',
      method: res.request().method(),
      url: res.url(),
      status: res.status(),
      body,
    })
  }
})

await editPencilButton.click()
await page.waitForTimeout(800)
await page.screenshot({ path: '/tmp/claude-1000/-home-saber-Repository-MyProjects-jobhunt-crm-jobhunter/31567d14-dcb5-4952-829f-ecf327a05288/scratchpad/03-edit-contact-dialog.png', fullPage: true })

const editDialog = page.locator('[role="dialog"]').filter({ hasText: 'Edit main contact' }).first()
console.log('edit dialog count:', await editDialog.count())

const jobTitleInput = editDialog.locator('input').nth(1) // 0: fullname likely after combobox; will verify via screenshot
// We'll refine selector after reviewing screenshot 03

await browser.close()
console.log('CONSOLE MESSAGES:', JSON.stringify(consoleMessages, null, 2))
console.log('CONTACT REQUESTS SO FAR:', JSON.stringify(contactRequests, null, 2))
