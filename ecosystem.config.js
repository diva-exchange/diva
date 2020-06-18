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
      name: 'diva.api-0',
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
    },
    {
      name: 'diva.api-1',
      script: 'app/bin/api',
      node_args: '-r esm',
      kill_timeout: 5000,

      env: {
        NAME_DATABASE: 'diva',
        NODE_ENV: 'development',
        BIND_IP: '0.0.0.0',
        PORT: 3902
      },
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
    }
    */
  ]
}
