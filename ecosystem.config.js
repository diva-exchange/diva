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
    },
    {
      name: 'diva.api',
      script: 'app/bin/api',
      node_args: '-r esm',
      kill_timeout: 5000,

      env: {
        NAME_DATABASE: 'diva',
        NODE_ENV: 'development',
        BIND_IP: '127.0.0.1',
        PORT: 3912
      }
    }
  ]
}
