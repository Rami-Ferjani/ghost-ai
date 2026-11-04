

when i choose a project from the side bar i get  this error 

 GET /editor/14b78897-5736-4984-a346-cc890903ad29? 500 in 1452ms (next.js: 17ms, proxy.ts: 11ms, application-code: 1424ms)

[browser] Uncaught Error: Forbidden

    at assertCanReadProject (lib\\share-collaborators.ts:58:11)

    at  getCollaborators (lib\\share-collaborators.ts:97:3)

    at  EditorWorkspacePage (app\\editor\\\[roomId\]\\page.tsx:30:25)

  56 |

  57 |   if (!isCollaborator) {

&gt; 58 |     throw new CollaboratorServiceError(403, "Forbidden");

     |           ^

  59 |   }

  60 | }

fix it