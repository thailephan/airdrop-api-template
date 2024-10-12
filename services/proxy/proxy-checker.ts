import { logger } from "../../common/logger.ts";
import { Timer } from "../../common/timer.ts";
import { AppProxy } from "./proxy.ts";

class AppProxyChecker {
    static async checkProxyIP(proxy: string) {
            let attempts = 0;
            const maxAttempts = 1;

            const appProxy = new AppProxy(proxy);
            const client = Deno.createHttpClient({
                proxy: {
                    url: appProxy.getUrl(),
                    basicAuth: appProxy.getBasicAuth(),
                }
            })
            while (attempts < maxAttempts) {
                try {
                    const response = await fetch('https://api64.ipify.org?format=json', {
                        method: "GET",
                        client,
                    });
                    const data = await response.json();
                    if (response.status === 200) {
                        return data.ip;
                    } else {
                        logger.error(`Không thể kiểm tra IP của proxy. Status code: ${response.status}`);
                    }
                } catch (error: any) {
                    attempts++;
                    logger.error(`Error khi kiểm tra IP của proxy (Lần thử ${attempts}/${maxAttempts}): ${error.message}`);
                    if (attempts < maxAttempts) {
                        await Timer.sleep(2000);
                    } else {
                        logger.error(`Error khi kiểm tra IP của proxy sau ${maxAttempts} lần thử: ${error.message}`);
                        break;
                    }
                }
        }
    }
    async check(proxy?: string) {
        if (!proxy) {
            return 'localhost';
        }

        try {
            const proxyIP = await AppProxyChecker.checkProxyIP(proxy);
            return proxyIP;
        } catch (error: any) {
            logger.error(`Không thể kiểm tra IP của proxy: ${error.message}`);
        }
        return undefined;
    }
}

export { AppProxyChecker };