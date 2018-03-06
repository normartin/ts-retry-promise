import {ParsedMail} from "mailparser";

export class Mail {
    constructor(private readonly mail: ParsedMail) {

    }

    public get from(): string {
        return this.mail.from.text;
    }

    public get to(): string {
        return this.mail.to.text;
    }

    public get subject(): string {
        return this.mail.subject;
    }

    public get textContent(): string {
        return this.mail.text;
    }

    public get htmlContent(): string | undefined {
        if (this.mail.html === false) {
            return undefined;
        } else {
            return this.mail.html as string;
        }
    }

    public get attachments(): Array<{ content: Buffer, filename: string }> {
        return this.mail.attachments.map((a) => {
            return {
                content: a.content,
                filename: a.filename,
            };
        });
    }
}
