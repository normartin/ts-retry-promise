# ts-smtp-test #

Source: https://bitbucket.org/martinmo/ts-tools/src

SMTP server for intergration tests.

Uses https://nodemailer.com/ as SMTP-Server.

```typescript
const server = new SmtpTestServer();

before(async () => {
    await server.start();
});

beforeEach(() => {
    server.clear();
});

after(async () => {
    await server.shutdown();
});

it("can receive mail", async () => {
    await sendMail(server.config, {
        attachments: [{content: "text attachment"}],
        from: "me@me.de",
        html: "some html",
        subject: "hi",
        text: "some text",
        to: "to@me.de",
    });

    expect(server.messages).length(1);

    const mail = server.messages[0];
    expect(mail.from).to.eq("me@me.de");
    expect(mail.to).to.eq("to@me.de");
    expect(mail.subject).to.eq("hi");
    expect(mail.textContent).to.eq("some text");
    expect(mail.htmlContent).to.eq("some html");
    expect(mail.attachments).length(1);
});

it("can wait for mails", async () => {
    setTimeout(() =>
        sendMail(server.config, {
                text: "1",
                to: "to@me.de",
            },
        ).catch(console.error), 5);

    setTimeout(() =>
        sendMail(server.config, {
                text: "2",
                to: "to@me.de",
            },
        ).catch(console.error), 10);

    // wait for 2 messages with a timeout of 15 millis
    const messages = await server.waitForMessages(2, 15);

    expect(messages).length(2);
    expect(messages[0].textContent).to.contain("1");
    expect(messages[1].textContent).to.contain("2");
});
```