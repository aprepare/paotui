const http = require('http')

function request(method, path, body, token) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : ''
    const headers = { 'Content-Type': 'application/json' }
    if (token) headers.Authorization = `Bearer ${token}`
    if (data) headers['Content-Length'] = Buffer.byteLength(data)
    const req = http.request({ hostname: 'localhost', port: 3000, path, method, headers }, res => {
      let b = ''
      res.on('data', d => b += d)
      res.on('end', () => resolve(JSON.parse(b)))
    })
    req.on('error', reject)
    if (data) req.write(data)
    req.end()
  })
}

async function main() {
  const login = await request('POST', '/api/admin/login', { username: 'admin', password: 'admin123' })
  if (login.code !== 0) { console.log('Login failed:', login); return }
  const token = login.data.token
  console.log('Login OK')

  const endpoints = [
    ['GET', '/api/admin/dashboard'],
    ['GET', '/api/admin/express-orders?page=1&pageSize=5'],
    ['GET', '/api/admin/errand-tasks?page=1&pageSize=5'],
    ['GET', '/api/admin/forum-posts?page=1&pageSize=5'],
    ['GET', '/api/admin/market-goods?page=1&pageSize=5'],
    ['GET', '/api/admin/team-activities?page=1&pageSize=5'],
    ['GET', '/api/admin/carpool?page=1&pageSize=5'],
    ['GET', '/api/admin/skills?page=1&pageSize=5'],
    ['GET', '/api/admin/messages?page=1&pageSize=5'],
    ['GET', '/api/admin/withdrawals?page=1&pageSize=5'],
    ['GET', '/api/admin/food/shops?page=1&pageSize=5'],
    ['GET', '/api/admin/food/items?page=1&pageSize=5'],
    ['GET', '/api/admin/food/orders?page=1&pageSize=5'],
    ['GET', '/api/admin/wash/products?page=1&pageSize=5'],
    ['GET', '/api/admin/wash/orders?page=1&pageSize=5'],
    ['GET', '/api/admin/analytics/overview?days=7'],
    ['GET', '/api/admin/analytics/revenue?days=7'],
    ['GET', '/api/admin/home-config'],
    ['GET', '/api/admin/welfare-config'],
    ['GET', '/api/admin/users?page=1&pageSize=5'],
    ['GET', '/api/admin/stats']
  ]

  let pass = 0, fail = 0
  for (const [method, path] of endpoints) {
    try {
      const res = await request(method, path, null, token)
      if (res.code === 0) { pass++; console.log(`  PASS ${method} ${path.split('?')[0]}`) }
      else { fail++; console.log(`  FAIL ${method} ${path.split('?')[0]} -> ${res.msg}`) }
    } catch (err) {
      fail++; console.log(`  ERROR ${method} ${path.split('?')[0]} -> ${err.message}`)
    }
  }
  console.log(`\nResults: ${pass} passed, ${fail} failed out of ${endpoints.length}`)
}

main().catch(console.error)
