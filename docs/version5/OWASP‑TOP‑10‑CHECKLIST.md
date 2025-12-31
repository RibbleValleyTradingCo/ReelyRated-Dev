# OWASP Top 10 Checklist

This checklist is designed to help you ensure your application addresses the most critical security risks as defined by the [OWASP Top 10](https://owasp.org/www-project-top-ten/).

## 1. Broken Access Control

- [ ] Verify all access controls are enforced on the server side.
- [ ] Ensure users can only access resources they are authorized for.
- [ ] Test for privilege escalation and horizontal access flaws.

## 2. Cryptographic Failures

- [ ] Use strong, industry-standard encryption (e.g., TLS 1.2+) for data in transit.
- [ ] Store sensitive data (passwords, secrets) securely using strong hashing (e.g., bcrypt, Argon2).
- [ ] Avoid legacy or broken cryptographic algorithms.

## 3. Injection

- [ ] Use parameterized queries or ORM to prevent SQL injection.
- [ ] Sanitize and validate all user inputs.
- [ ] Avoid dynamic code execution from untrusted sources.

## 4. Insecure Design

- [ ] Consider security at every stage of development (threat modeling, secure design patterns).
- [ ] Implement rate limiting and account lockout mechanisms.
- [ ] Separate privileges and minimize attack surface.

## 5. Security Misconfiguration

- [ ] Disable default accounts, unnecessary services, and sample apps.
- [ ] Set secure HTTP headers (e.g., Content Security Policy, X-Frame-Options).
- [ ] Keep frameworks and dependencies up to date.

## 6. Vulnerable and Outdated Components

- [ ] Use tools to identify and update vulnerable dependencies.
- [ ] Remove unused dependencies and components.
- [ ] Monitor for disclosed vulnerabilities in third-party libraries.

## 7. Identification and Authentication Failures

- [ ] Enforce strong password policies and multi-factor authentication.
- [ ] Implement secure session management (e.g., session timeouts, cookie flags).
- [ ] Protect against brute force and credential stuffing attacks.

## 8. Software and Data Integrity Failures

- [ ] Use trusted repositories and package managers for dependencies.
- [ ] Validate code and configuration integrity (e.g., code signing, checksums).
- [ ] Protect CI/CD pipelines from unauthorized changes.

## 9. Security Logging and Monitoring Failures

- [ ] Implement centralized logging of security-relevant events.
- [ ] Monitor logs for suspicious activity and potential attacks.
- [ ] Retain logs securely and protect them from tampering.

## 10. Server-Side Request Forgery (SSRF)

- [ ] Validate and sanitize all URLs and user-supplied requests.
- [ ] Restrict outbound network access from the application server.
- [ ] Use network segmentation and firewall rules to limit SSRF impact.

---

**References:**

- [OWASP Top 10 Project](https://owasp.org/www-project-top-ten/)
- [OWASP Cheat Sheet Series](https://cheatsheetseries.owasp.org/)
