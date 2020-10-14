module.exports = {
  /**
   * Application configuration section
   * http://pm2.keymetrics.io/docs/usage/application-declaration/
   */
  apps : [

     {
      name      : 'schedule',
      script    : 'schedule.js',
      env: {
        COMMON_VARIABLE: 'true',
	  TZ: 'America/Los_Angeles'
      },
      env_production : {
        NODE_ENV: 'production'
      },
      cwd	: '/root/api',
      watch	: "schedule.js",
      ignore_watch : ["node_modules","public","Data","epubs"],
      "cron_restart": "05 00 * * *",
      "log_date_format"  : "YY/MM/DD HH:mm:ss"

    },
    {
      name      : 'timetrack',
      script    : 'timetrack.js',
      env: {
        COMMON_VARIABLE: 'true',
	  TZ: 'America/Los_Angeles'
      },
      env_production : {
        NODE_ENV: 'production'
      },
      cwd	: '/root/api',
      watch	: "timetrack.js",
      ignore_watch : ["node_modules","public","Data","epubs"],
      "cron_restart": "05 00 * * *",
      "log_date_format"  : "YY/MM/DD HH:mm:ss"

    },
    {
      name      : 'propagator',
      script    : 'propagator.js',
      env: {
        COMMON_VARIABLE: 'true',
	  TZ: 'America/Los_Angeles'
      },
      env_production : {
        NODE_ENV: 'production'
      },
      cwd	: '/root/api',
      watch	: "propagator.js",
      ignore_watch : ["node_modules","public","Data","epubs"],
      "cron_restart": "05 00 * * *",
      "log_date_format"  : "YY/MM/DD HH:mm:ss"

    },
    {
      name      : 'import',
      script    : 'import.js',
      env: {
        COMMON_VARIABLE: 'true',
	  TZ: 'America/Los_Angeles'
      },
      env_production : {
        NODE_ENV: 'production'
      },
      cwd	: '/root/api',
      watch	: "import.js",
      ignore_watch : ["node_modules","public","Data","epubs"],
      "cron_restart": "05 00 * * *",
      "log_date_format"  : "YY/MM/DD HH:mm:ss"
    },
    {
      name      : 'analytics',
      script    : 'analytics.js',
      env: {
        COMMON_VARIABLE: 'true',
	  TZ: 'America/Los_Angeles'
      },
      env_production : {
        NODE_ENV: 'production'
      },
      cwd	: '/root/api',
      watch	: "analytics.js",
      ignore_watch : ["node_modules","public","Data","epubs"],
      "cron_restart": "05 00 * * *",
      "log_date_format"  : "YY/MM/DD HH:mm:ss"

    },
    {
      name      : 'endpoint',
      script    : 'endpoint.js',
      env: {
        COMMON_VARIABLE: 'true',
	  TZ: 'America/Los_Angeles'
      },
      env_production : {
        NODE_ENV: 'production'
      },
      cwd	: '/root/api',
      watch	: "endpoint.js",
      ignore_watch : ["node_modules","public","Data","epubs"],
      "cron_restart": "05 00 * * *",
      "log_date_format"  : "YY/MM/DD HH:mm:ss"

    },
    {
      name      : 'bot',
      script    : 'bot.js',
      env: {
        COMMON_VARIABLE: 'true',
	  TZ: 'America/Los_Angeles'
      },
      env_production : {
        NODE_ENV: 'production'
      },
      cwd	: '/root/api',
      watch	: "bot.js",
      ignore_watch : ["node_modules","public","Data","epubs"],
      "cron_restart": "05 00 * * *",
      "log_date_format"  : "YY/MM/DD HH:mm:ss"
    },
    {
      name      : 'elevate',
      script    : 'elevate.js',
      env: {
        COMMON_VARIABLE: 'true',
	  TZ: 'America/Los_Angeles'
      },
      env_production : {
        NODE_ENV: 'production'
      },
      cwd	: '/root/api',
      watch	: "elevate.js",
      ignore_watch : ["node_modules","public","Data","epubs"],
      "cron_restart": "05 00 * * *",
      "log_date_format"  : "YY/MM/DD HH:mm:ss"

    },
    {
      name      : 'bookstore',
      script    : 'bookstore.js',
      env: {
        COMMON_VARIABLE: 'true',
	  TZ: 'America/Los_Angeles'
      },
      env_production : {
        NODE_ENV: 'production'
      },
      cwd	: '/root/api',
      watch	: "bookstore.js",
      ignore_watch : ["node_modules","public","Data","epubs"],
      "cron_restart": "05 00 * * *",
      "log_date_format"  : "YY/MM/DD HH:mm:ss"
    },
    {
      name      : 'cas-bridge',
      script    : 'cas-bridge.js',
      env: {
        COMMON_VARIABLE: 'true',
	  TZ: 'America/Los_Angeles'
      },
      env_production : {
        NODE_ENV: 'production'
      },
      cwd	: '/root/api',
      watch	: "cas-bridge.js",
      ignore_watch : ["node_modules","public","Data","epubs"],
      "cron_restart": "05 00 * * *",
      "log_date_format"  : "YY/MM/DD HH:mm:ss"
    },
  ],
};
