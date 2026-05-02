/**
 * Demo seed script — run with: npx tsx scripts/seed.ts
 * Creates a demo team with sample tasks, meetings, and code reviews.
 */
import { Firestore, FieldValue } from '@google-cloud/firestore'

const db = new Firestore({ projectId: 'promptwars-chennai-495105' })

const TEAM_ID = 'demo-team'

async function seed() {
  console.log('Seeding demo data...')

  // Team
  await db.collection('teams').doc(TEAM_ID).set({
    name: 'TeamPulse Demo Team',
    memberIds: ['user-alok', 'user-priya', 'user-dev', 'user-sanjay'],
    createdAt: FieldValue.serverTimestamp(),
  })

  // Sample tasks
  const tasks = [
    { title: 'Fix login timeout bug', description: 'Users are being logged out after 5 min of inactivity', status: 'IN_PROGRESS', priority: 'HIGH', estimatedHours: 4, assigneeId: 'user-priya', tags: ['bug', 'auth'], subtasks: [{ title: 'Reproduce the issue', done: true }, { title: 'Fix session refresh logic', done: false }] },
    { title: 'Implement dark mode', description: 'Add dark mode support to the mobile app', status: 'TODO', priority: 'MEDIUM', estimatedHours: 8, assigneeId: 'user-dev', tags: ['frontend', 'ux'], subtasks: [{ title: 'Design tokens for dark theme', done: false }, { title: 'Update component styles', done: false }, { title: 'System preference detection', done: false }] },
    { title: 'Database schema migration', description: 'Migrate to new users schema before release', status: 'BLOCKED', priority: 'CRITICAL', estimatedHours: 3, assigneeId: 'user-sanjay', tags: ['backend', 'database'], subtasks: [] },
    { title: 'Write API documentation', description: 'Document all new REST endpoints', status: 'TODO', priority: 'LOW', estimatedHours: 5, assigneeId: 'user-alok', tags: ['docs'], subtasks: [] },
    { title: 'Performance testing setup', description: 'Configure k6 load tests for all critical endpoints', status: 'TODO', priority: 'MEDIUM', estimatedHours: 6, assigneeId: null, tags: ['testing', 'devops'], subtasks: [] },
    { title: 'OAuth Google integration', description: 'Add Google OAuth login flow with refresh tokens', status: 'DONE', priority: 'HIGH', estimatedHours: 10, assigneeId: 'user-alok', tags: ['auth', 'backend'], subtasks: [] },
    { title: 'CI/CD pipeline setup', description: 'Configure GitHub Actions for automated deployments', status: 'DONE', priority: 'HIGH', estimatedHours: 8, assigneeId: 'user-dev', tags: ['devops'], subtasks: [] },
    { title: 'User analytics dashboard', description: 'Build analytics dashboard to track user engagement metrics', status: 'IN_PROGRESS', priority: 'MEDIUM', estimatedHours: 16, assigneeId: 'user-priya', tags: ['frontend', 'analytics'], subtasks: [{ title: 'Define KPI metrics', done: true }, { title: 'Chart components', done: false }, { title: 'Backend aggregation API', done: false }] },
  ]

  const batch = db.batch()
  for (const task of tasks) {
    const ref = db.collection('tasks').doc()
    batch.set(ref, {
      teamId: TEAM_ID,
      aiGenerated: false,
      dueDate: null,
      reporterId: 'user-alok',
      ...task,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    })
  }
  await batch.commit()
  console.log(`Created ${tasks.length} sample tasks`)

  // Sample code review
  const reviewRef = db.collection('codeReviews').doc()
  await reviewRef.set({
    teamId: TEAM_ID,
    repoName: 'alok108/teampulse',
    prNumber: 42,
    prUrl: 'https://github.com/alok108/teampulse/pull/42',
    qualityScore: 58,
    status: 'DONE',
    issues: [
      { severity: 'ERROR', type: 'SECURITY', file: 'src/db.js', line: 12, message: 'SQL injection vulnerability: user input concatenated directly into query', suggestion: 'Use parameterized queries or prepared statements' },
      { severity: 'WARNING', type: 'PERFORMANCE', file: 'src/users.js', line: 45, message: 'N+1 query pattern detected in user list endpoint', suggestion: 'Use a JOIN or batch loading to fetch related data in one query' },
      { severity: 'INFO', type: 'STYLE', file: 'src/users.js', line: 8, message: 'console.log left in production code', suggestion: 'Use a proper logger with log levels' },
    ],
    overallFeedback: 'This code has a critical SQL injection vulnerability that must be fixed before merging. Consider using an ORM or parameterized queries throughout.',
    linkedTaskId: null,
    createdAt: FieldValue.serverTimestamp(),
    completedAt: FieldValue.serverTimestamp(),
  })

  console.log('Demo data seeded successfully!')
  console.log(`Team ID: ${TEAM_ID}`)
}

seed().catch(console.error)
