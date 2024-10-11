import { InitData, InitDataExtractor } from "./common/initData.ts";
import { logger } from "./common/logger.ts";
import { Time, Timer } from "./common/timer.ts";
import { AppProxy } from "./services/proxy/proxy.ts";

abstract class TelegramApplication {
    private MIN_EXECUTION_INTERVAL: number = Time.HOUR * 4;    
    private MAX_EXECUTION_INTERVAL: number = Time.HOUR * 6;
    private MAX_RETRY: number = 5;

    protected appName: string = "app-name";
    protected initData: string = "";
    protected extractedInitData: InitData | undefined = undefined;

    protected proxy: AppProxy | undefined = undefined;
    protected client: Deno.HttpClient = Deno.createHttpClient({ });

    protected minExecutionInterval: number = this.MIN_EXECUTION_INTERVAL;
    protected maxExecutionInterval: number = this.MAX_EXECUTION_INTERVAL;
    protected maxRetry: number = this.MAX_RETRY;
    protected retry: number = 0;

    constructor(initData: string, proxy?: string) {
        this.initData = initData;
        this.extractedInitData = InitDataExtractor.extract(initData);

        this.setProxy(proxy);
    }

    setInitData(initData: string) {
        this.initData = initData;
    }
    getInitData() {
        return this.initData;
    }

    setProxy(proxy?: string) {
        this.proxy = new AppProxy(proxy);
        if (this.proxy.isValid()) {
            this.client = Deno.createHttpClient({ proxy: {
                url: this.proxy.getUrl(),
                basicAuth: this.proxy.getBasicAuth(),
            } });
        } else {
            this.client = Deno.createHttpClient({ });
        }
    }
    getProxy() {
        return this.proxy;
    }

    getHttpClient() {
        return this.client;
    }

    protected setExecutionInterval(min: number, max?: number) {
        this.minExecutionInterval = min;
        this.maxExecutionInterval = max ?? min;
    }
    protected resetExecutionInterval() {
        this.minExecutionInterval = this.MIN_EXECUTION_INTERVAL;
        this.maxExecutionInterval = this.MAX_EXECUTION_INTERVAL;
    }

    protected setMaxRetry(max: number) {
        if (max < 0) {
            throw new Error("Max retry must be greater than or equal to 0");
        }
        this.maxRetry = max;
        this.retry = 0;
    }
    protected resetRetry() {
        this.retry = 0;
    }
    protected incrementRetry() {
        this.retry++;
    }
    protected isMaxRetryReached() {
        return this.retry >= this.maxRetry;
    }

    
    onExecutionStart() {
        if (this.isMaxRetryReached()) {
            logger.info(`[${this.appName} ${this.extractedInitData?.user.username}]`, "Max retry reached");
            return { shouldStop: true };
        }
        return { shouldStop: false };
    }

    onExecutionSuccess() {
        this.resetRetry();
    }

    onExecutionFailed(error: any) {
        logger.error(error);
        this.incrementRetry();
    }

    async onExecutionEnd() {
        await this.waitNextExecution();
    }

    waitNextExecution() {
        const { promise, timeMs } = Timer.sleepRandom(this.minExecutionInterval, this.maxExecutionInterval);
        const minutes = Math.floor(timeMs / Time.MINUTE);
        logger.info(`[${this.appName} ${this.extractedInitData?.user.username}]`, `Next execution in ${minutes} minutes`);
        return promise;
    }
    abstract onRunExecution(): Promise<void>;

    async execute() {
        do {
            try {
                const { shouldStop } = this.onExecutionStart();
                if (shouldStop) {
                    break;
                }

                await this.onRunExecution();

                this.onExecutionSuccess();
            } catch (error) {
                this.onExecutionFailed(error);
            } finally {
                await this.onExecutionEnd();
            }
        } while(true);

        return Promise.resolve();
    };
}


export { TelegramApplication };