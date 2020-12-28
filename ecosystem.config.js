module.exports = {
  apps: [
    {
      name: 'diva',
      script: 'app/bin/diva',
      node_args: '-r esm',

      env: {
        NODE_ENV: 'development',
        BIND_IP: '127.0.0.1',
        PORT: 3911
      }
    }
  ]
}
