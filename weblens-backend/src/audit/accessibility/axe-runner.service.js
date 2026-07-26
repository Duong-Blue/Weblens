"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var AxeRunnerService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AxeRunnerService = void 0;
const common_1 = require("@nestjs/common");
const axe = __importStar(require("axe-core"));
const jsdom_1 = require("jsdom");
let AxeRunnerService = AxeRunnerService_1 = class AxeRunnerService {
    logger = new common_1.Logger(AxeRunnerService_1.name);
    async runAxeOnHtml(html) {
        this.logger.debug('Running axe-core on HTML string');
        try {
            const dom = new jsdom_1.JSDOM(html);
            const results = await axe.run(dom.window.document, {
                runOnly: {
                    type: 'tag',
                    values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice']
                },
                resultTypes: ['violations', 'passes', 'incomplete', 'inapplicable'],
            });
            return results;
        }
        catch (error) {
            this.logger.error(`Error running axe-core: ${error.message}`, error.stack);
            throw error;
        }
    }
    processResults(results) {
        return results;
    }
};
exports.AxeRunnerService = AxeRunnerService;
exports.AxeRunnerService = AxeRunnerService = AxeRunnerService_1 = __decorate([
    (0, common_1.Injectable)()
], AxeRunnerService);
//# sourceMappingURL=axe-runner.service.js.map