abstract class FetchHeaders {
    private defaultHeaders: Headers;
    protected headers: Headers;

    constructor() {
        this.defaultHeaders = new Headers();
        this.defaultHeaders.append("accept-language", "en");
        this.defaultHeaders.append("accept", "application/json, text/plain, */*");
        this.defaultHeaders.append("cache-control", "no-cache");
        this.defaultHeaders.append("content-type", "application/json");
        this.defaultHeaders.append("pragma", "no-cache");
        this.defaultHeaders.append("priority", "u=1, i");
        this.defaultHeaders.append("referrer-policy", "strict-origin-when-cross-origin");
        this.defaultHeaders.append("User-Agent", "Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Mobile Safari/537.36");

        this.headers = this.copyFromDefault();
    }

    protected copy(src: Headers) {
        const dst = new Headers();
        this.extend(dst, src);
        return dst;
    }
    protected copyFromDefault() {
        return this.copy(this.defaultHeaders);
    }


    protected extend(dst: Headers, src: Headers) {
        for (const [key, value] of src.entries()) {
            dst.append(key, value);
        }
    }
    protected extendFromDefault(dst: Headers) {
        this.extend(dst, this.defaultHeaders);
    }

    get() {
        // const headers = this.copy(this.headers);
        // return headers;
        return this.headers;
    }
    set(headers: Headers) {
        this.headers = headers;
    }
    setKey(key: string, value: string) {
        this.headers.set(key, value);
    }
}

export default FetchHeaders;