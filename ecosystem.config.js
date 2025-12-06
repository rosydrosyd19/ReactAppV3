module.exports = {
    apps: [
        {
            name: "reactappv3-backend",
            cwd: "./backend",
            script: "server.js",
            instances: 1,
            autorestart: true,
            watch: false,
            max_memory_restart: '1G',
            env: {
                NODE_ENV: "development",
                // Allowed origins for backend
                ALLOWED_ORIGINS: "http://localhost:5173,http://192.168.100.155:5173"
            },
            env_production: {
                NODE_ENV: "production",
                PORT: 3001
            }
        },
        {
            name: "reactappv3-frontend",
            cwd: "./frontend",
            script: "npm",
            args: "run dev",
            instances: 1,
            autorestart: true,
            watch: false,
            env: {
                // Ensure vite binds to network
                HOST: "0.0.0.0"
            }
        }
    ]
};
