# ts tools #

Some tools I extracted from my daily work.

Source: https://bitbucket.org/martinmo/ts-tools/src

## ts-smtp-test-server ##

Test your email sending code in an integration test.

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
        text: "some text",
        to: "to@me.de",
    });

    expect(server.messages).length(1);

    const mail = server.messages[0];
    expect(mail.from.text).to.eq("me@me.de");
    expect(mail.to.text).to.eq("to@me.de");
    expect(mail.text).to.eq("some text");
    expect(mail.html).to.eq("some html");
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

    const messages = await server.waitForMessages(2);

    expect(messages).length(2);
    expect(messages[0].text).to.contain("1");
    expect(messages[1].text).to.contain("2");
});

it("can wait for mails with timeout", async () => {
    await expectError(server.waitForMessages(1, 1));
});
```