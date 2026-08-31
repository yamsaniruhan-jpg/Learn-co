# Learn.co — Security & Authorization Specification

## Authorization Model
- **Token Verification**: Every API request to `/api/creator/*` is authenticated against `req.headers.authorization`.
- **User Scoping**: User documents, sources, resources, versions, and jobs are bound to `req.user.id`.
- **Data Isolation**: Users cannot view, modify, or delete another user's sources or generated resources.
- **Input Validation**: Text length, URL schemes, and file payloads are sanitized against malicious injection.
