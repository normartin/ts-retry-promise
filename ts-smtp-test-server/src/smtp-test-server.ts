import {ParsedMail, simpleParser} from "mailparser";
import {SMTPServer, SMTPServerAuthentication, SMTPServerAuthenticationResponse, SMTPServerSession} from "smtp-server";
import {Readable} from "stream";
import {defaultRetryConfig, retry} from "ts-retry-promise";
import {Mail} from "./mail";

export interface SmtpServerConfig {
    port?: number;
    secure?: boolean;
    authentication?: (user: string, passwd: string) => boolean;
    host?: string;
}

const defaultOptions: SmtpServerConfig = {
    authentication: () => true,
    host: "localhost",
    port: 2025,
    secure: false,
};

export class SmtpTestServer {

    public config: SmtpServerConfig;
    public messages: Mail[] = [];
    private server: SMTPServer;

    constructor(serverConfig?: SmtpServerConfig) {
        this.config = Object.assign({}, defaultOptions, serverConfig);

        this.server = new SMTPServer({
            onAuth: authFunction(this.config),
            onData: dataFunction((mail) => this.messages.push(new Mail(mail))),
            secure: this.config.secure,
        });
    }

    public start(): Promise<SmtpTestServer> {
        return new Promise<SmtpTestServer>((resolve) => {
            this.server.listen(this.config.port, this.config.host, () => resolve(this));
        });
    }

    public clear() {
        this.messages = [];
    }

    public shutdown(): Promise<void> {
        return new Promise<void>((resolve) => {
            this.server.close(() => resolve());
        });
    }

    public async waitForMessages(numberOfMessages: number, timeout?: number): Promise<Mail[]> {
        return retry(async () => this.messages, {
            timeout: timeout ? timeout : defaultRetryConfig.timeout,
            until: (messages: Mail[]) => messages.length === numberOfMessages,
        });
    }
}

function authFunction(config: SmtpServerConfig): (auth: SMTPServerAuthentication,
                                                  session: SMTPServerSession,
                                                  callback: (err: Error | null | undefined,
                                                             response: SMTPServerAuthenticationResponse) => void) => void {
    return ((auth, session, callback) => {
        if (config.authentication(auth.username, auth.password)) {
            callback(undefined, {user: auth.username});
        } else {
            callback(new Error("Invalid username or password"), undefined);
        }
    });
}

function dataFunction(messageCB: (mail: ParsedMail) => void): (stream: Readable,
                                                               session: SMTPServerSession,
                                                               callback: (err?: Error | null) => void) => void {
    return (stream, session, callback) => {

        simpleParser(stream, (err, mail) => {
            messageCB(mail);
            callback(err);
        });

    };
}
