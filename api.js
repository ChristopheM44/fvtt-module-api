class APIModule {
    constructor() {
        this.sessionId = this.getCookie("session");
        this.socket = null;
        this.connectSocket();
    }

    getCookie(name) {
        return document.cookie.split('; ').reduce((acc, cookie) => {
            const [key, value] = cookie.split('=');
            return key === name ? decodeURIComponent(value) : acc;
        }, null);
    }

    connectSocket() {
        this.socket = io.connect(window.location.origin, {
            query: { session: this.sessionId },
            reconnection: true,
        });

        this.socket.on("connect_error", (err) => {
            console.error("WebSocket Connection Error:", err);
            this.error("WebSocket connection failed.");
        });
    }

    getQueryParams() {
        const params = new URLSearchParams(window.location.search);
        const result = {};
        
        params.forEach((value, key) => {
            try {
                result[key] = JSON.parse(value);
            } catch {
                result[key] = value;
            }
        });

        return result;
    }

    error(message) {
        this.reply({ success: false, error: message });
    }

    reply(result) {
        document.body.textContent = JSON.stringify(result, null, 2);
        if (this.socket && this.socket.connected) {
            this.socket.close();
        }
    }

    processRequest() {
        if (!this.sessionId) return this.error("User not logged in");

        const params = this.getQueryParams();

        if (!params.name) return this.error("API use requires query string 'name'");

        const args = Object.keys(params)
            .filter(key => key.startsWith("arg"))
            .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
            .map(key => params[key]);

        console.log("Got request with params:", params, args);

        this.socket.emit(params.name, ...args, (...response) => {
            this.reply({ query: params, result: response, success: true });
        });
    }
}

const api = new APIModule();
window.addEventListener("DOMContentLoaded", () => api.processRequest());
