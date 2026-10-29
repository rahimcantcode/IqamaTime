import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { guideStepIndex, shouldAutoOpenGuide } from '../components/first-visit-guide'

test('first dashboard visit auto-opens only for an unseen, logged-out profile', () => {
  assert.equal(shouldAutoOpenGuide(true, false, false, false), true)
  assert.equal(shouldAutoOpenGuide(true, false, true, false), false)
  assert.equal(shouldAutoOpenGuide(true, false, false, true), false)
})

test('Settings manual guide never auto-opens regardless of completion or login state', () => {
  for (const seen of [true, false]) for (const loggedIn of [true, false]) {
    assert.equal(shouldAutoOpenGuide(false, true, seen, loggedIn), false)
    assert.equal(shouldAutoOpenGuide(true, true, seen, loggedIn), false)
  }
})

test('guide Next and Back cannot go beyond the first or last step', () => {
  assert.equal(guideStepIndex(0, -1, 4), 0)
  assert.equal(guideStepIndex(0, 1, 4), 1)
  assert.equal(guideStepIndex(3, 1, 4), 3)
  assert.equal(guideStepIndex(3, -1, 4), 2)
})

test('Settings mounts a controlled guide and opens it directly without navigation or a dashboard-only event', () => {
  const settings = readFileSync('components/settings-page-client.tsx', 'utf8')
  assert.match(settings, /<FirstVisitGuide autoOpen=\{false\} open=\{guideOpen\} onOpenChange=\{setGuideOpen\}/)
  assert.match(settings, /onClick=\{\(\) => setGuideOpen\(true\)\}/)
  assert.doesNotMatch(settings, /dispatchEvent\(new CustomEvent\('iqamatime:open-guide'/)
  assert.match(readFileSync('components/dashboard.tsx', 'utf8'), /<FirstVisitGuide\s*\/>/)
})

test('guide uses accessible dialog controls and does not clear completion when reopened', () => {
  const guide = readFileSync('components/first-visit-guide.tsx', 'utf8')
  assert.match(guide, /<Dialog\.Content/)
  assert.match(guide, /<Dialog\.Title/)
  assert.match(guide, /<Dialog\.Description/)
  assert.match(guide, /aria-label="Close guide"/)
  assert.match(guide, /onCloseAutoFocus/)
  assert.doesNotMatch(guide, /localStorage\.removeItem\(ONBOARDING_KEY\)/)
})
