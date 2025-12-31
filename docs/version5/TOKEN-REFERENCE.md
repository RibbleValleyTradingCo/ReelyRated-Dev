# Token Reference

This document provides a comprehensive reference for all tokens used in the system. Tokens are unique identifiers that represent various entities and actions within the platform.

## Token Types

### 1. User Tokens

- Represent individual users.
- Used for authentication and authorization.
- Format: `user_<unique_id>`

### 2. Session Tokens

- Represent user sessions.
- Used to maintain state between requests.
- Format: `session_<unique_id>`

### 3. API Tokens

- Used to authenticate API requests.
- Can have different scopes and permissions.
- Format: `api_<unique_id>`

### 4. Access Tokens

- Short-lived tokens for accessing resources.
- Typically used in OAuth flows.
- Format: `access_<unique_id>`

### 5. Refresh Tokens

- Long-lived tokens used to obtain new access tokens.
- Format: `refresh_<unique_id>`

## Token Security

- Tokens should be stored securely.
- Use HTTPS to transmit tokens.
- Rotate tokens regularly.
- Revoke tokens when no longer needed.

## Token Usage Examples

### Example: Using a User Token

```bash
curl -H "Authorization: Bearer user_123456" https://api.example.com/profile
```

### Example: Refreshing an Access Token

```bash
curl -X POST https://api.example.com/token/refresh \
     -d "refresh_token=refresh_abcdef"
```

For more detailed information on token management, refer to the [Authentication Guide](AUTHENTICATION.md).
