import * as axe from 'axe-core';
export declare class AxeRunnerService {
    private readonly logger;
    runAxeOnHtml(html: string): Promise<axe.AxeResults>;
    processResults(results: axe.AxeResults): axe.AxeResults;
}
