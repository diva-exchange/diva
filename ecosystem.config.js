module.exports = {
  apps: [
    /*
    {
      name: 'diva.profile',
      script: 'app/bin/profile',
      node_args: '-r esm',

      env: {
        NODE_ENV: 'development',
        BIND_IP: '0.0.0.0',
        PORT: 3910
      },
      env_production: {
        NODE_ENV: 'production',
        BIND_IP: '0.0.0.0',
        PORT: 3900
      }
    },
    */
    {
      name: 'diva',
      script: 'app/bin/diva',
      node_args: '-r esm',
      kill_timeout: 5000,

      env: {
        NODE_ENV: 'development',
        BIND_IP: '127.0.0.1',
        PORT: 3911
      },
      env_production: {
        NODE_ENV: 'production',
        BIND_IP: '127.0.0.1',
        PORT: 3901
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
        BIND_IP: '0.0.0.0',
        PORT: 3912
      },
      env_production: {
        NAME_DATABASE: 'diva',
        NODE_ENV: 'production',
        BIND_IP: '0.0.0.0',
        PORT: 3902
      }
    }
    /*
    {
      name: 'iroha-keep-alive',
      script: 'app/bin/iroha-keep-alive',
      node_args: '-r esm',

      env: {
        NODE_ENV: 'development'
      },
      env_production: {
        NODE_ENV: 'production'
      }
    },
    {
      name: 'utp-proxy',
      script: 'app/bin/utp-proxy',
      node_args: '-r esm',

      min_uptime: '1h',
      max_restarts: 10,

      env: {
        NODE_ENV: 'development',
        BACKEND_BIND_IP: '127.0.0.1',
        BACKEND_PORT: 10001,
        UTP_BIND_IP: '127.0.0.1',
        LOG_LEVEL: 'trace'
      },
      env_production: {
        NODE_ENV: 'production',
        BACKEND_BIND_IP: '0.0.0.0',
        BACKEND_PORT: 10001,
        UTP_BIND_IP: '0.0.0.0',
        LOG_LEVEL: 'trace'
      }
    }
    */
  ]
}
