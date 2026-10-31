

after loginin and  i choose a project from the side bar, i get this error:  
**Event handlers cannot be passed to Client Component props.**  
  **&lt;... isSidebarOpen={true} onToggleSidebar={function onToggleSidebar} projectId=... projectName=... userId=...&gt;**  
                                            **^^^^^^^^^^^^^^^^^^^^^^^^^^**  
**If you need interactivity, consider converting part of this to a Client Component.**

app\\editor\\[roomId]\\page.tsx (27:10) @ EditorWorkspacePage

```
  25 |
```

26 |   // Step 3: Render workspace

**&gt;** 27 |   return &lt;WorkspaceLayout project={project} userId={userId} /&gt;;



Deeply analyze the problem and when you figure out how to fix it , present me how you intent to fix and wait for my permission to give you the green light to proceed with the fix
