const http = require('http')

const data = JSON.stringify({ username: 'admin', password: 'admin123' })
const req = http.request({
  hostname: 'localhost', port: 3000, path: '/api/admin/login',
  method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) }
}, res => {
  let body = ''
  res.on('data', d => body += d)
  res.on('end', () => console.log(body))
})
req.write(data)
req.end()
