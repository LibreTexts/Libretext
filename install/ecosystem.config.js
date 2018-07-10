module.exports = {
  /**
   * Application configuration section
   * http://pm2.keymetrics.io/docs/usage/application-declaration/
   */
  apps : [

    // First application
    {
      name      : 'nodePrint',
      script    : 'nodePrint.js',
      env: {
        COMMON_VARIABLE: 'true'
      },
      env_production : {
        NODE_ENV: 'production'
      },
      cwd	: '/home/hagnew/awesomefiles/nodePrint',
      watch	: "nodePrint.js",
      ignore_watch : ["node_modules","public","PDF"],
    },
  ],
};
