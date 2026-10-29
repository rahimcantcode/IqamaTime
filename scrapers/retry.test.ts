import { test } from 'node:test'
import assert from 'node:assert/strict'
import { isRetryableSourceError } from './retry'

test('an explicit source access denial is not repeatedly requested', () => {
  for (const status of [400, 401, 403, 404, 410]) assert.equal(isRetryableSourceError({ response: { status } }), false)
  for (const status of [408, 429, 500, 502, 503]) assert.equal(isRetryableSourceError({ response: { status } }), true)
  assert.equal(isRetryableSourceError(new Error('socket timeout')), true)
})
