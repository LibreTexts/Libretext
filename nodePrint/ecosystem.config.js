module.exports = {
  /**
   * Application configuration section
   * http://pm2.keymetrics.io/docs/usage/application-declaration/
   */
  apps : [
    
    {
      name      : 'nodePrint',
      script    : 'nodePrint.js',
      env: {
        COMMON_VARIABLE: 'true',
	  TZ: 'America/Los_Angeles'
      },
      env_production : {
        NODE_ENV: 'production'
      },
      cwd	: '/root/nodePrint',
      watch	: "nodePrint.js",
      ignore_watch : ["node_modules","public","PDF"],
      "cron_restart": "25 00 * * *",
      "log_date_format"  : "YY/MM/DD HH:mm:ss"
    },
  ],
};
