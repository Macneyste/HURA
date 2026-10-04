import { app } from './app.js'; import { connectDatabase } from './config/database.js'; import { env } from './config/env.js';
connectDatabase().then(() => app.listen(env.PORT, () => console.info(`HURU API listening on ${env.PORT}`))).catch((error) => { console.error('Failed to start HURU API', error); process.exit(1); });
