module.exports = {
    apps: [{
        name: 'paotui-server',
        script: 'app.js',
        cwd: '/opt/paotui-server',
        exec_mode: 'fork',
        instances: 1,
        autorestart: true,
        watch: false,
        max_memory_restart: '256M',
        env: {
            NODE_ENV: 'production',
            PORT: 3000
        },
        error_file: '/opt/paotui-server/logs/error.log',
        out_file: '/opt/paotui-server/logs/out.log',
        log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
    }]
}
