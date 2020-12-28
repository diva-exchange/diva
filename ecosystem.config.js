module.exports = {
  apps: [
    {
      name: 'diva',
      script: 'app/bin/diva',
      node_args: '-r esm',
      kill_timeout: 5000,

      env: {
        NODE_ENV: 'development',
        BIND_IP: '127.0.0.1',
        PORT: 3911
      }
    }
  ]
}
