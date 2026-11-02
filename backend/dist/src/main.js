"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const common_1 = require("@nestjs/common");
async function bootstrap() {
    var _a;
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.enableCors({ origin: true, credentials: true });
    app.useGlobalPipes(new common_1.ValidationPipe({ whitelist: true, transform: true }));
    const port = (_a = process.env.PORT) !== null && _a !== void 0 ? _a : 4000;
    await app.listen(port, '0.0.0.0');
    console.log(`🚀 Smart Water Backend running on http://0.0.0.0:${port}`);
}
bootstrap();
//# sourceMappingURL=main.js.map