---
source_url: https://expressjs.com/en/advanced/best-practice-security/
fetched_at: 2026-11-08
title: "Production Best Practices: Security · Express.js"
---

# Production Best Practices: Security

The term “production” refers to the stage in the software lifecycle when an application or API is generally available to its end-users or consumers. In contrast, in the “development” stage, you’re still actively writing and testing code, and the application is not open to external access.

Development and production environments are usually set up differently and have vastly different requirements. What’s fine in development may not be acceptable in production. For example, in a development environment you may want verbose logging of errors for debugging, while the same behavior can become a security concern in a production environment.

## Don’t use deprecated or vulnerable versions of Express

Express 2.x and 3.x are no longer maintained. Security and performance issues in these versions won’t be fixed. Do not use them! Prefer the latest stable release. Also ensure you are not using any of the vulnerable Express versions listed on the Security updates page.

## Use TLS

If your app deals with or transmits sensitive data, use Transport Layer Security (TLS) to secure the connection and the data. This technology encrypts data before it is sent from the client to the server, thus preventing some common (and easy) hacks. Although Ajax and POST requests might not be visibly obvious and seem “hidden” in browsers, their network traffic is vulnerable to packet sniffing and man-in-the-middle attacks.

In general, we recommend Nginx to handle TLS. A handy tool to get a free TLS certificate is Let’s Encrypt.

## Do not trust user input

For web applications, one of the most critical security requirements is proper user input validation and handling. Ultimately, the responsibility for validating and correctly handling the types of user input your application accepts is yours.

### Prevent open redirects

An example of potentially dangerous user input is an open redirect, where an application accepts a URL as user input and uses `res.redirect` to set the location header. An application must validate that it supports redirecting to the incoming URL to avoid sending users to malicious links.

## Use Helmet

Helmet can help protect your app from some well-known web vulnerabilities by setting HTTP headers appropriately.

Helmet sets the following headers by default:

- `Content-Security-Policy`
- `Cross-Origin-Opener-Policy`
- `Cross-Origin-Resource-Policy`
- `Origin-Agent-Cluster`
- `Referrer-Policy`
- `Strict-Transport-Security`
- `X-Content-Type-Options`
- `X-DNS-Prefetch-Control`
- `X-Download-Options`
- `X-Frame-Options`
- `X-Permitted-Cross-Domain-Policies`
- `X-Powered-By` (removed)
- `X-XSS-Protection` (disabled by Helmet)

```js
import helmet from 'helmet';
app.use(helmet());
```

## Reduce fingerprinting

By default, Express sends the `X-Powered-By` response header that you can disable:

```js
app.disable('x-powered-by');
```

Add your own not-found handler and error handler so default Express error pages do not fingerprint the stack:

```js
app.use((req, res, next) => {
  res.status(404).send("Sorry can't find that!");
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});
```

## Use cookies securely

Don’t use the default session cookie name and set cookie security options appropriately.

- `express-session` stores session data on the server; only the session ID is in the cookie. Default in-memory storage is **not designed for production** — use a scalable session store.
- `cookie-session` serializes the entire session into the cookie; only for small, non-sensitive session data.

Cookie options: `secure`, `httpOnly`, `domain`, `path`, `expires`.

## Prevent brute-force attacks against authorization

Block authorization attempts using:

1. Consecutive failed attempts by the same user name and IP address
2. Failed attempts from an IP over a longer period

`rate-limiter-flexible` provides tools for this technique.

## Ensure your dependencies are secure

Since npm@6, npm automatically reviews every install request. Use `npm audit` to analyze your dependency tree. Consider Snyk and GitHub Advisory Database.

## Additional considerations

- Always filter and sanitize user input to protect against XSS and command injection
- Defend against SQL injection attacks by using parameterized queries or prepared statements
- Use safe-regex to ensure regular expressions are not susceptible to ReDoS
