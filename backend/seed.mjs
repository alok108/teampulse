/**
 * Demo seed script — run with: node scripts/seed.mjs
 * (run from backend/ directory so node can find @google-cloud/firestore)
 */
import { Firestore, FieldValue } from '@google-cloud/firestore'

const db = new Firestore({ projectId: 'promptwars-chennai-495105', databaseId: 'teampulse' })
const TEAM_ID = 'demo-team'

async function clearCollection(name) {
  const snap = await db.collection(name).where('teamId', '==', TEAM_ID).get()
  const batch = db.batch()
  snap.docs.forEach(d => batch.delete(d.ref))
  if (snap.size > 0) await batch.commit()
  console.log(`Cleared ${snap.size} existing docs from ${name}`)
}

async function seed() {
  console.log('Seeding demo data into "teampulse" database...')

  // Clear existing demo data so we can re-run
  await clearCollection('tasks')
  await clearCollection('meetings')
  await clearCollection('codeReviews')

  // Team
  await db.collection('teams').doc(TEAM_ID).set({
    name: 'TeamPulse Demo Team',
    memberIds: ['user-alok', 'user-priya', 'user-dev', 'user-sanjay', 'user-meera'],
    createdAt: FieldValue.serverTimestamp(),
  })
  console.log('Created team: demo-team')

  // Sample team members
  const users = [
    { id: 'user-alok', name: 'Alok Kumar', role: 'Tech Lead', email: 'alok@teampulse.io' },
    { id: 'user-priya', name: 'Priya Sharma', role: 'Backend Engineer', email: 'priya@teampulse.io' },
    { id: 'user-dev', name: 'Dev Patel', role: 'Frontend Engineer', email: 'dev@teampulse.io' },
    { id: 'user-sanjay', name: 'Sanjay Rao', role: 'DevOps Engineer', email: 'sanjay@teampulse.io' },
    { id: 'user-meera', name: 'Meera Iyer', role: 'Product Manager', email: 'meera@teampulse.io' },
  ]

  const userBatch = db.batch()
  for (const u of users) {
    userBatch.set(db.collection('users').doc(u.id), {
      name: u.name, email: u.email, role: u.role, teamId: TEAM_ID, currentTaskIds: [],
    })
  }
  await userBatch.commit()
  console.log(`Created ${users.length} users`)

  // Sample tasks — realistic spread across statuses
  const now = Date.now()
  const day = 24 * 60 * 60 * 1000
  const tasks = [
    {
      title: 'Fix login timeout bug', description: 'Users are being logged out after 5 minutes of inactivity instead of the configured 30 minutes. Investigation shows the session refresh logic has a race condition with the JWT validation middleware.',
      status: 'IN_PROGRESS', priority: 'HIGH', estimatedHours: 4, assigneeId: 'user-priya',
      tags: ['bug', 'auth', 'session'],
      subtasks: [{ title: 'Reproduce the issue locally', done: true }, { title: 'Fix session refresh race condition', done: false }, { title: 'Add regression tests', done: false }],
      dueDate: new Date(now + 2 * day).toISOString().split('T')[0],
    },
    {
      title: 'Implement dark mode for mobile app', description: 'Add full dark mode support to the React Native mobile app. Should respect system preferences and allow manual override in settings.',
      status: 'TODO', priority: 'MEDIUM', estimatedHours: 12, assigneeId: 'user-dev',
      tags: ['frontend', 'mobile', 'ux'],
      subtasks: [{ title: 'Define dark theme tokens', done: false }, { title: 'Update component library', done: false }, { title: 'System preference detection', done: false }, { title: 'Settings toggle UI', done: false }],
      dueDate: null,
    },
    {
      title: 'Database schema migration for v2 release', description: 'Migrate user_profiles and notifications tables to v2 schema. Includes data backfill and zero-downtime migration plan.',
      status: 'BLOCKED', priority: 'CRITICAL', estimatedHours: 8, assigneeId: 'user-sanjay',
      tags: ['backend', 'database', 'migration'],
      subtasks: [{ title: 'Review migration plan', done: true }, { title: 'Get DBA approval', done: false }],
      dueDate: new Date(now + 4 * day).toISOString().split('T')[0],
    },
    {
      title: 'Write API documentation for v2 endpoints', description: 'Document all new REST endpoints introduced in v2. OpenAPI spec + usage examples.',
      status: 'TODO', priority: 'LOW', estimatedHours: 6, assigneeId: 'user-alok',
      tags: ['docs', 'api'], subtasks: [], dueDate: null,
    },
    {
      title: 'Set up performance testing pipeline', description: 'Configure k6 load tests for all critical API endpoints. Run nightly in CI and alert on regressions >10%.',
      status: 'TODO', priority: 'MEDIUM', estimatedHours: 10, assigneeId: null,
      tags: ['testing', 'devops', 'performance'], subtasks: [], dueDate: null,
    },
    {
      title: 'Google OAuth integration', description: 'Implement Google OAuth login with refresh token rotation and offline access scope.',
      status: 'DONE', priority: 'HIGH', estimatedHours: 10, assigneeId: 'user-alok',
      tags: ['auth', 'backend', 'oauth'], subtasks: [{ title: 'Backend OAuth flow', done: true }, { title: 'Frontend integration', done: true }, { title: 'Token rotation', done: true }], dueDate: null,
    },
    {
      title: 'CI/CD pipeline migration to Cloud Build', description: 'Move from Jenkins to Cloud Build with parallel test stages and auto-deploy on merge.',
      status: 'DONE', priority: 'HIGH', estimatedHours: 16, assigneeId: 'user-sanjay',
      tags: ['devops', 'ci-cd'], subtasks: [], dueDate: null,
    },
    {
      title: 'User analytics dashboard', description: 'Build internal dashboard showing DAU, MAU, retention curves, and top features. Real-time data via BigQuery streaming.',
      status: 'IN_PROGRESS', priority: 'MEDIUM', estimatedHours: 24, assigneeId: 'user-priya',
      tags: ['frontend', 'analytics', 'bigquery'],
      subtasks: [{ title: 'Define KPI metrics', done: true }, { title: 'BigQuery aggregation queries', done: true }, { title: 'Chart components', done: false }, { title: 'Real-time refresh logic', done: false }],
      dueDate: new Date(now + 7 * day).toISOString().split('T')[0],
    },
    {
      title: 'Implement push notification rate limiting', description: 'Add per-user rate limit (max 10/hour) and per-tenant rate limit to prevent notification spam.',
      status: 'IN_PROGRESS', priority: 'HIGH', estimatedHours: 6, assigneeId: 'user-priya',
      tags: ['backend', 'notifications'],
      subtasks: [{ title: 'Token bucket algorithm', done: false }, { title: 'Redis backend for counters', done: false }],
      dueDate: new Date(now + 3 * day).toISOString().split('T')[0],
    },
    {
      title: 'Onboarding flow A/B test', description: 'Run an A/B test on the new 3-step onboarding flow vs the current 5-step flow. Track activation rate and time-to-first-action.',
      status: 'BLOCKED', priority: 'MEDIUM', estimatedHours: 4, assigneeId: 'user-meera',
      tags: ['product', 'experiment'], subtasks: [], dueDate: null,
    },
  ]

  const taskBatch = db.batch()
  for (const t of tasks) {
    const ref = db.collection('tasks').doc()
    taskBatch.set(ref, {
      teamId: TEAM_ID, aiGenerated: false, reporterId: 'user-alok', ...t,
      createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp(),
    })
  }
  await taskBatch.commit()
  console.log(`Created ${tasks.length} sample tasks`)

  // Sample meeting summary
  await db.collection('meetings').add({
    teamId: TEAM_ID,
    rawText: 'Sprint planning - May 1, 2026. Attendees: Alok, Priya, Dev, Sanjay, Meera. Discussion: login timeout bug needs fixing by Wednesday - Priya. Dark mode for mobile starting Monday - Dev. DB migration before Thursday release - Sanjay. Move to weekly releases. Need API docs - Alok.',
    parsedAt: FieldValue.serverTimestamp(),
    actionItems: [
      { title: 'Fix login timeout bug', ownerId: 'user-priya', ownerName: 'Priya', dueDate: '2026-05-06', priority: 'HIGH', taskId: null },
      { title: 'Start dark mode implementation', ownerId: 'user-dev', ownerName: 'Dev', dueDate: '2026-05-04', priority: 'MEDIUM', taskId: null },
      { title: 'Complete DB migration', ownerId: 'user-sanjay', ownerName: 'Sanjay', dueDate: '2026-05-07', priority: 'CRITICAL', taskId: null },
    ],
  })
  console.log('Created 1 meeting summary')

  // Sample code reviews
  const reviews = [
    {
      teamId: TEAM_ID, repoName: 'alok108/teampulse', prNumber: 42,
      prUrl: 'https://github.com/alok108/teampulse/pull/42',
      qualityScore: 58, status: 'DONE',
      issues: [
        { severity: 'ERROR', type: 'SECURITY', file: 'src/auth/db.ts', line: 12, message: 'SQL injection: user input concatenated into query', suggestion: 'Use parameterized queries' },
        { severity: 'WARNING', type: 'PERFORMANCE', file: 'src/users/list.ts', line: 45, message: 'N+1 query pattern detected', suggestion: 'Use a JOIN or batch loading' },
        { severity: 'INFO', type: 'STYLE', file: 'src/users/list.ts', line: 8, message: 'console.log left in production code', suggestion: 'Use a structured logger' },
      ],
      overallFeedback: 'Critical SQL injection vulnerability that must be fixed before merging. Also has an N+1 query that will hurt performance at scale.',
      linkedTaskId: null, createdAt: FieldValue.serverTimestamp(), completedAt: FieldValue.serverTimestamp(),
    },
    {
      teamId: TEAM_ID, repoName: 'alok108/teampulse', prNumber: 43,
      prUrl: 'https://github.com/alok108/teampulse/pull/43',
      qualityScore: 87, status: 'DONE',
      issues: [
        { severity: 'INFO', type: 'STYLE', file: 'src/api/notifications.ts', line: 22, message: 'Magic number 3600 should be a named constant', suggestion: 'Extract as ONE_HOUR_SECONDS = 3600' },
      ],
      overallFeedback: 'Solid implementation of notification rate limiting. Good test coverage and clean abstraction. Minor stylistic improvement suggested.',
      linkedTaskId: null, createdAt: FieldValue.serverTimestamp(), completedAt: FieldValue.serverTimestamp(),
    },
    {
      teamId: TEAM_ID, repoName: 'alok108/teampulse', prNumber: 44,
      prUrl: 'https://github.com/alok108/teampulse/pull/44',
      qualityScore: 72, status: 'DONE',
      issues: [
        { severity: 'WARNING', type: 'COMPLEXITY', file: 'src/dashboard/insights.ts', line: 67, message: 'Function has cyclomatic complexity of 14', suggestion: 'Extract the bottleneck-detection branch into its own function' },
        { severity: 'INFO', type: 'MAINTAINABILITY', file: 'src/dashboard/insights.ts', line: 102, message: 'Missing JSDoc on exported function', suggestion: 'Add docstring describing inputs and return shape' },
      ],
      overallFeedback: 'Functional and tests pass, but the main insights function is doing too much. Consider breaking it up for readability.',
      linkedTaskId: null, createdAt: FieldValue.serverTimestamp(), completedAt: FieldValue.serverTimestamp(),
    },
  ]
  for (const r of reviews) {
    await db.collection('codeReviews').add(r)
  }
  console.log(`Created ${reviews.length} code reviews`)

  console.log('\n=== Demo data seeded successfully! ===')
  console.log(`Team ID: ${TEAM_ID}`)
  console.log(`Users: ${users.length}, Tasks: ${tasks.length}, Reviews: ${reviews.length}`)
}

seed().catch(e => { console.error(e); process.exit(1) })
