interface Proxy {
    username: string,
    password: string,
    host: string,
    port: number 
}
class AppProxy {
    private proxy: Proxy | undefined;
    constructor(proxy?: string) {
        const isProxyValid = this.validate(proxy);
        if (!proxy || !isProxyValid) {
            this.proxy = undefined;
        } else {
            this.proxy = this.extractProxy(proxy);
        }
    }
    private extractProxy(proxy: string): Proxy {
        const [username, password, host, port] = proxy.split(/[:@]/);
        return { username, password, host, port: parseInt(port), }
    }
    private validate(proxy?: string) {
        if (!proxy) {
            return false;
        }
        const [username, password, host, portStr] = proxy.split(/[:@]/);
        const port = parseInt(portStr);
        if (!username || !password || !host || !port) {
            return false;
        }
        if (!host.match(/^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/)) {
            return false;
        }
        if (isNaN(port) || port < 0 || port > 65535) {
            return false;
        }

        return true;
    }
    getBasicAuth() {
        if (!this.proxy) {
            throw new Error("Proxy is not valid");
        }
        return {
            username: this.proxy.username,
            password: this.proxy.password,
        }
    }
    getUrl() {
        if (!this.proxy) {
            throw new Error("Proxy is not valid");
        }
        return `http://${this.proxy?.host}:${this.proxy?.port}`;
    }
    isValid() {
        return this.proxy !== undefined;
    }
}

export { AppProxy };
export type { Proxy };