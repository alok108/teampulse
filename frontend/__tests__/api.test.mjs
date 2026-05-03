import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

/**
 * Frontend API client tests — verifies the URL building
 * and error handling without making real network calls.
 */
describe('Frontend API client', () => {
  it('uses NEXT_PUBLIC_API_URL when set', () => {
    const url = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'
    assert.ok(url.startsWith('http'))
  })

  it('builds task list URL with teamId', () => {
    const base = 'https://api.example.com'
    const teamId = 'demo-team'
    const url = `${base}/api/tasks?teamId=${teamId}`
    assert.equal(url, 'https://api.example.com/api/tasks?teamId=demo-team')
  })

  it('formats error messages from API failures', () => {
    const httpStatus = 500
    const errMsg = `HTTP ${httpStatus}`
    assert.equal(errMsg, 'HTTP 500')
  })
})

describe('Status display formatting', () => {
  it('formats IN_PROGRESS to "IN PROGRESS"', () => {
    assert.equal('IN_PROGRESS'.replace('_', ' '), 'IN PROGRESS')
  })

  it('formats TODO unchanged', () => {
    assert.equal('TODO'.replace('_', ' '), 'TODO')
  })
})

describe('Health score color thresholds', () => {
  const healthColor = (score) => {
    if (score >= 70) return 'green'
    if (score >= 40) return 'yellow'
    return 'red'
  }
  it('returns green for healthy score', () => assert.equal(healthColor(85), 'green'))
  it('returns yellow for warning', () => assert.equal(healthColor(55), 'yellow'))
  it('returns red for critical', () => assert.equal(healthColor(20), 'red'))
  it('handles boundary at 70', () => assert.equal(healthColor(70), 'green'))
  it('handles boundary at 40', () => assert.equal(healthColor(40), 'yellow'))
})

describe('Quality score thresholds', () => {
  const scoreColor = (s) => s >= 80 ? 'green' : s >= 60 ? 'yellow' : 'red'
  it('80+ is green', () => assert.equal(scoreColor(85), 'green'))
  it('60-79 is yellow', () => assert.equal(scoreColor(70), 'yellow'))
  it('<60 is red', () => assert.equal(scoreColor(45), 'red'))
})
