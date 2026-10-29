import { test } from 'node:test'
import assert from 'node:assert/strict'
import { parseSMSTimes } from './sms'

const day = {
  fajr: { iqamahTime: '7:00 AM' }, dhuhr: { iqamahTime: '2:00 PM' },
  asr: { iqamahTime: '5:00 PM' }, maghrib: { iqamahTime: '6:45 PM' },
  isha: { iqamahTime: '8:15 PM' },
  jumaTimes: [{ khutbaTime: '1:30 PM' }, { khutbaTime: '2:20 PM' }, { khutbaTime: '3:15 PM' }],
}
const widget = (days: unknown[], keyword = 'var') => `<script>${keyword} mn=${JSON.stringify({ note: 'A } brace and "quote"', prayerTimes: days })};other();</script>`

test('SMS parses nested/minified JSON without a trailing newline or executing script', () => {
  for (const keyword of ['var', 'let', 'const']) {
    const times = parseSMSTimes(widget([day], keyword), '2026-10-29')
    assert.equal(times.fajr, '7:00 AM')
    assert.equal(times.jummah3, '3:15 PM')
  }
})
test('SMS selects the matching date and rejects stale/ambiguous schedules', () => {
  const times = parseSMSTimes(widget([{ ...day, date: '2026-10-30', fajr: { iqamahTime: '7:30 AM' } }, { ...day, date: '2026-10-29' }]), '2026-10-29')
  assert.equal(times.fajr, '7:00 AM')
  assert.throws(() => parseSMSTimes(widget([{ ...day, date: '2026-10-28' }]), '2026-10-29'), /no unambiguous prayer schedule/)
  assert.throws(() => parseSMSTimes(widget([day, day]), '2026-10-29'), /no unambiguous prayer schedule/)
})
test('SMS diagnoses the actual upstream shortcode outage without fabricating times', () => {
  assert.throws(() => parseSMSTimes('<h6>[MadinaAPPS-Daily-Single-Time type="fajrIqamah"]</h6>', '2026-10-29'), /unrendered MadinaAPPS/)
  assert.throws(() => parseSMSTimes(widget([{ ...day, fajr: { adhaanTime: '6:20 AM' } }]), '2026-10-29'), /missing fajr/)
  assert.throws(() => parseSMSTimes('<script>var mn={"prayerTimes":', '2026-10-29'), /incomplete/)
})
