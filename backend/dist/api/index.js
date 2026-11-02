"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = handler;
require("reflect-metadata");
const core_1 = require("@nestjs/core");
const platform_express_1 = require("@nestjs/platform-express");
const express = require("express");
const common_1 = require("@nestjs/common");
const { AppModule } = require('../dist/app.module');
const server = express();
let appReady = null;
async function bootstrap() {
    const app = await core_1.NestFactory.create(AppModule, new platform_express_1.ExpressAdapter(server), {
        logger: ['error', 'warn'],
    });
    app.enableCors({ origin: true, credentials: true });
    app.useGlobalPipes(new common_1.ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
}
function getApp() {
    if (!appReady) {
        appReady = bootstrap();
    }
    return appReady;
}
async function handler(req, res) {
    await getApp();
    server(req, res);
}
//# sourceMappingURL=index.js.map