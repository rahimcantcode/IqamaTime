import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

test('passing congregation times never claims the religious prayer window has ended', () => {
  const rail = readFileSync('components/prayer-focus-rail.tsx', 'utf8')
  assert.doesNotMatch(rail, /Prayer Ended/i)
  assert.match(rail, /All listed iqamas have passed/)
  assert.match(rail, /All listed khutbah starts have passed/)
})


test('Friday references are khutbah starts and missing times never appear as due now', () => {
  const rail = readFileSync('components/prayer-focus-rail.tsx', 'utf8')
  assert.equal((rail.match(/First listed khutbah' : 'Adhan time'/g) || []).length, 2)
  assert.match(rail, /!card\.adhanTime \?/)
  assert.match(rail, /Khutbah schedule unavailable/)
  assert.match(rail, /Adhan schedule unavailable/)
  assert.match(rail, /Until first listed khutbah/)
})
test('prayer rail leaves portal dialogs and editable arrow keys alone', () => {
  const rail = readFileSync('components/prayer-focus-rail.tsx', 'utf8')
  assert.match(rail, /!e\.currentTarget\.contains\(target\)/)
  assert.match(rail, /target\.closest\('input, textarea, select, \[contenteditable="true"\]'\)/)
})
