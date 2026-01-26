import { app, startSchedulers } from "./app.js";
import { config } from "./config.js";
import { logger } from "./lib/logger.js";
import { tableService } from "./services/tableService.js";
import { adminAuthService } from "./services/adminAuthService.js";

async function bootstrap() {
  await tableService.ensureSeedData();
  await adminAuthService.createInitialAdmin("admin", "admin123");
  startSchedulers();

  const port = config.port;
  app.listen(port, () => {
    console.log(`Server running on ${port}`);
    logger.info({ port }, "Server started");
  });
}

bootstrap().catch((err) => {
  logger.error({ err }, "Failed to start application");
  process.exit(1);
});
