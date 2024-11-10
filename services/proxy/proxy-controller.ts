export abstract class ProxyController {
    apiKey: string;
    constructor(apiKey: string) {
        this.apiKey = apiKey;
    }
    action(host: string, port: number): Promise<{ success: boolean, data?: any }> {
        return Promise.resolve({ success: true });
    }
}
export abstract class RotateProxyController extends  ProxyController {
    rotate(host: string, port: number): Promise<{ success: boolean, data?: any }> {
        return Promise.resolve({ success: true });
    }
    override action(host: string, port: number): Promise<{ success: boolean, data?: any }> {
        return this.rotate(host, port);
    }
}
export class ProxyMartRotateProxyController extends RotateProxyController {
    constructor(apiKey: string) {
        super(apiKey);
    }
    override async rotate(host: string, port: number) {
        const response = await fetch(`https://api.proxymart.net/api/change-ip?api_key=${this.apiKey}&host=${host}&port=${port}`, {
            "body": null,
            "method": "GET",
        });
        if (response.status !== 200) {
            return { success: false };
        }
        return { success: true, };
    }
}