Wire the editor home sidebar and dialogs to the teal project API.



##data fetching



The editor home page is a server compoenet.

Fetch owned and shared proejcts server-side using the existing project data helper and pass both lists to the sidebar.

No client-side fetching for initial load.



## `use Project Action`

create a hook in `hooks/` that manages dialog state and project mutations.



**Create**

-manage create dialog state

-manage project name input

-generate a short unique suffix

-call `POST /api/projects`

-navigate to the new workspace



The project ID and Liveblocks room ID should stay aligned.

**Rename**

-store target project id + current name

-call `PATCH /api/projects/[id]`

-refresh on success



**delete**

-store target project

-call `DELETE /api/projects/[id]`

-redirect to `/editor` if deleting the active workspace

-otherwise refresh



## Wiring

Connect the hook to the sidebar and dialogs.

-create dialog shows room ID preview

-rename dialog pre-fills current name

-delete dialog shows project name



## Check when DOne

-sidebar uses real project date

-create navigates to workspace

-rename updates correctly

-delete refreshes or redirects correctly

-\`npm run build\` passes