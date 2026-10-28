```markdown
The database schema is read. Build the backend project API routes only.

**Architecture:** Implement these as Next.js API route handlers that call Prisma directly to query and mutate the database. Do not create a separate backend API or make HTTP requests to Prisma; use the existing Prisma client.

##Routes

-`GET /api/project` , list current user's projects

-`POST /api/projects` ,create project

-`PATCH /api/projects/[projectId]`,rename project

-`DELETE /api/projects/[projectId]` ,delete project

## Rules

Use the authenticated Clerk user ID as `ownerId`.

When creating:

-default missing project name to `Untitles Project`

-use the schema`s existing ID [stretegy.do](http://stretegy.do) not add sequential IDs



security:

-unauthenticated requests return `401`

-only the project owner can rename or delete

-non-owner mutations return `403`



Kepp this backkend-only.Do not wire the UI yet



##Check when Done

-Routes exist for list/create/rename/delete

-owner checks are enforced for rename/delete

-`401` and `403` responses are handled correctly

-`npm run build` passes
```