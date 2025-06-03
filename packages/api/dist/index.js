"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = require("./app");
const PORT = Number(process.env.PORT) || 3000;
const server = app_1.app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
// Handle server errors
server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is already in use. Trying a different port...`);
        const newPort = PORT + 1;
        server.listen(newPort, () => {
            console.log(`Server is running on port ${newPort}`);
        });
    }
    else {
        console.error('Server error:', error);
        process.exit(1);
    }
});
