import { app } from './app';
import { initDb } from './init';

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    await initDb();
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer(); 