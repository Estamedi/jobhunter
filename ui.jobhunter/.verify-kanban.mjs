import { chromium } from 'playwright'

const SHOT_DIR = '/tmp/claude-1000/-home-saber-Repository-MyProjects-jobhunt-crm-jobhunter/d6a040c9-47e3-4af8-9b5a-514a374a05b5/scratchpad'

async function clickEl(locator) {
  const box = await locator.boundingBox()
  if (!box) throw new Error('element not visible for click')
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2)
}

const MOCK_APPLICATIONS = [
  { id: 101, candidateId: 1, candidateName: 'Don John', jobRoleId: 10, jobRoleTitle: 'Backend Engineer', companyId: 1, companyName: 'Acme Corp', status: 'Wishlist', priority: 'Low', nextFollowUpDate: '2026-07-22T00:00:00Z' },
  { id: 102, candidateId: 1, candidateName: 'Don John', jobRoleId: 11, jobRoleTitle: 'Frontend Engineer', companyId: 2, companyName: 'Globex', status: 'Applied', priority: 'Medium' },
  { id: 103, candidateId: 1, candidateName: 'Don John', jobRoleId: 12, jobRoleTitle: 'Platform Engineer', companyId: 2, companyName: 'Globex', status: 'PhoneScreen', priority: 'High' },
  { id: 104, candidateId: 1, candidateName: 'Don John', jobRoleId: 13, jobRoleTitle: 'Staff Engineer', companyId: 3, companyName: 'Initech', status: 'Ghosted', priority: 'Low' },
]

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1400, height: 900 } })
page.on('pageerror', (err) => console.log('PAGEERROR:', err.message))

// Stub the applications API so the board has known data to group/drag, independent of
// this fresh test account's backend candidate-provisioning state (unrelated pre-existing flow).
let currentItems = JSON.parse(JSON.stringify(MOCK_APPLICATIONS))
await page.route('**/api/applications**', async (route, request) => {
  const url = new URL(request.url())
  if (request.method() === 'GET' && !url.pathname.match(/\/\d+$/)) {
    await route.fulfill({ json: { items: currentItems, total: currentItems.length } })
    return
  }
  if (request.method() === 'PATCH' && url.pathname.match(/\/api\/applications\/\d+\/status$/)) {
    const id = Number(url.pathname.split('/')[3])
    const body = request.postDataJSON()
    currentItems = currentItems.map((a) => (a.id === id ? { ...a, status: body.status } : a))
    await route.fulfill({ status: 200, json: {} })
    return
  }
  await route.continue()
})
await page.route('**/api/candidates**', (route) => route.fulfill({ json: { items: [{ id: 1, name: 'Don John' }], total: 1 } }))

await page.goto('http://localhost:5173/sign-in')
await page.waitForTimeout(800)
await page.fill('input[name="email"]', 'verify-kanban2@example.com')
await page.fill('input[name="password"]', 'VerifyKanban@123')
await clickEl(page.getByRole('button', { name: 'Sign in', exact: true }))
await page.waitForTimeout(1500)
for (let i = 0; i < 3; i++) {
  const skip = page.getByText('Skip for now')
  if (await skip.isVisible().catch(() => false)) {
    await clickEl(skip)
    await page.waitForTimeout(800)
  }
}

await page.goto('http://localhost:5173/applications')
await page.waitForTimeout(1500)
await page.screenshot({ path: `${SHOT_DIR}/20-board-seeded.png`, fullPage: true })
console.log('Seeded board screenshot saved.')

// Drag the Wishlist card ("Acme Corp") into the Applied column
const card = page.getByText('Acme Corp').locator('..')
const cardBox = await card.boundingBox()
const appliedColumn = page.getByText('Applied', { exact: true }).locator('../..')
const appliedBox = await appliedColumn.boundingBox()
console.log('cardBox', cardBox, 'appliedBox', appliedBox)

const startX = cardBox.x + cardBox.width / 2
const startY = cardBox.y + cardBox.height / 2
const endX = appliedBox.x + appliedBox.width / 2
const endY = appliedBox.y + appliedBox.height - 20

await page.mouse.move(startX, startY)
await page.mouse.down()
for (let i = 1; i <= 10; i++) {
  await page.mouse.move(startX + ((endX - startX) * i) / 10, startY + ((endY - startY) * i) / 10, { steps: 2 })
  await page.waitForTimeout(50)
}
await page.waitForTimeout(200)
await page.screenshot({ path: `${SHOT_DIR}/21-mid-drag.png`, fullPage: true })
await page.mouse.up()
await page.waitForTimeout(800)
await page.screenshot({ path: `${SHOT_DIR}/22-after-drag.png`, fullPage: true })
console.log('Drag complete. currentItems:', JSON.stringify(currentItems.map((a) => ({ id: a.id, status: a.status }))))

// Customize board: rename "Wishlist" -> "Interested", then verify it reflects on the board
await clickEl(page.getByRole('button', { name: 'Customize board' }))
await page.waitForTimeout(500)
await page.screenshot({ path: `${SHOT_DIR}/30-customize-dialog.png`, fullPage: true })

const wishlistInput = page.getByRole('dialog').getByDisplayValue('Wishlist')
await wishlistInput.fill('')
await wishlistInput.fill('Interested')
await page.waitForTimeout(300)

// Add a brand-new custom stage
const newStageInput = page.getByPlaceholder('New stage name...')
await newStageInput.fill('Take-home assignment')
await clickEl(page.getByRole('button', { name: /^Add stage$/i }))
await page.waitForTimeout(300)
await page.screenshot({ path: `${SHOT_DIR}/31-customize-after-edits.png`, fullPage: true })

await clickEl(page.getByRole('button', { name: /^Done$/i }))
await page.waitForTimeout(500)
await page.screenshot({ path: `${SHOT_DIR}/32-board-after-customize.png`, fullPage: true })

console.log('Customize flow complete.')

await browser.close()
