const EIMZO_URL = "wss://127.0.0.1:13579/";

export class EIMZOClient {
    constructor() {
        this.socket = null;
    }

    async connect() {
        return new Promise((resolve, reject) => {
            if (this.socket && this.socket.readyState === WebSocket.OPEN) {
                resolve();
                return;
            }

            try {
                this.socket = new WebSocket(EIMZO_URL);

                this.socket.onopen = () => {
                    resolve();
                };

                this.socket.onerror = (error) => {
                    reject(error);
                };

                this.socket.onclose = () => {
                    this.socket = null;
                };
            } catch (e) {
                reject(e);
            }
        });
    }

    async listAllUserKeys() {
        await this.connect();

        return new Promise((resolve, reject) => {
            const itemId = "gen_" + Date.now();
            const request = {
                plugin: "pfx",
                name: "list_all_certificates",
                arguments: [],
                id: itemId
            };

            const handler = (event) => {
                const data = JSON.parse(event.data);
                if (data.id === itemId) {
                    this.socket.removeEventListener('message', handler);
                    if (data.success) {
                        resolve(data.certificates);
                    } else {
                        reject(data.reason);
                    }
                }
            };

            this.socket.addEventListener('message', handler);
            this.socket.send(JSON.stringify(request));
        });
    }

    async createPkcs7(keyId, content) {
        await this.connect();

        return new Promise((resolve, reject) => {
            const itemId = "sign_" + Date.now();
            const request = {
                plugin: "pfx",
                name: "create_pkcs7",
                arguments: [keyId, content],
                id: itemId
            };

            const handler = (event) => {
                const data = JSON.parse(event.data);
                if (data.id === itemId) {
                    this.socket.removeEventListener('message', handler);
                    if (data.success) {
                        resolve(data.pkcs7_64);
                    } else {
                        reject(data.reason);
                    }
                }
            };

            this.socket.addEventListener('message', handler);
            this.socket.send(JSON.stringify(request));
        });
    }

    // Helper to parse subject name (CN, UIC, etc might be in the subject string)
    static parseSubject(subject) {
        const parts = {};
        if (!subject) return parts;

        subject.split(',').forEach(part => {
            const [key, value] = part.trim().split('=');
            if (key && value) {
                parts[key] = value;
            }
        });
        return parts;
    }
}
