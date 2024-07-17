module.exports = {
    apps: [
      {
        name: 'nestjs-app',          // Application name
        script: 'dist/main.js',      // Script to run your NestJS application
        instances: 'max',            // Use 'max' to run the maximum number of instances based on the number of CPU cores
        exec_mode: 'cluster',        // Use 'cluster' mode to spread the load across multiple instances
        env: {
          NODE_ENV: 'development',   // Environment variables for development
          PORT: 3000
        },
        env_production: {
          NODE_ENV: 'production',    // Environment variables for production
          PORT: 3000
        }
      }
    ]
  };
  