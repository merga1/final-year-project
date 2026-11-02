"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DevicesService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const device_entity_1 = require("./device.entity");
const valve_command_entity_1 = require("./valve-command.entity");
let DevicesService = class DevicesService {
    constructor(repo, commandRepo) {
        this.repo = repo;
        this.commandRepo = commandRepo;
    }
    findAll() {
        return this.repo.find({ order: { createdAt: 'DESC' } });
    }
    async findOne(id) {
        const device = await this.repo.findOneBy({ id });
        if (!device)
            throw new common_1.NotFoundException(`Device ${id} not found`);
        return device;
    }
    async findByMeterId(meterId) {
        return this.repo.findOneBy({ meterId });
    }
    async create(data) {
        const device = this.repo.create(data);
        return this.repo.save(device);
    }
    async updateByMeterId(meterId, data) {
        await this.repo.update({ meterId }, data);
        return this.repo.findOneBy({ meterId });
    }
    createValveCommand(data) {
        return this.commandRepo.save(this.commandRepo.create(data));
    }
    count() {
        return this.repo.count();
    }
    countByConnectivity(connectivity) {
        return this.repo.countBy({ connectivity: connectivity });
    }
};
exports.DevicesService = DevicesService;
exports.DevicesService = DevicesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(device_entity_1.Device)),
    __param(1, (0, typeorm_1.InjectRepository)(valve_command_entity_1.ValveCommand)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], DevicesService);
//# sourceMappingURL=devices.service.js.map