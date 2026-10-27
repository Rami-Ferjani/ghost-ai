const comments = [
  {
    key: "c3-project-sidebar",
    file: "components/editor/project-sidebar.tsx",
    comment: "ProjectRow is a <button> containing nested Rename/Delete action buttons.",
    workerTask: "Change ProjectRow in components/editor/project-sidebar.tsx so its root is a non-button container (div) holding its own <button type='button'> for selection (onClick=onSelect); keep the Rename and Delete action buttons inside that container (not nested inside an interactive element), preserving selection behavior, owned-only gating (isOwnedProject) and stopPropagation. Do not change any other files. After editing, re-read the changed file to confirm the hierarchy (div root + own selection button + nested action buttons) and that selection/owned-only behavior is intact. Report files changed and validation result.",
    reviewerAngle: "Interaction/a11y angle: verify the row root is a div with its own selection button, action buttons are not nested inside an interactive element, and selection plus owned-only actions still work."
  },
  {
    key: "c4-rename-dialog",
    file: "components/editor/rename-project-dialog.tsx",
    comment: "The rename Input has no accessible name; placeholder is project.name; renameName binding intact.",
    workerTask: "Add aria-label='New project name' to the rename Input in components/editor/rename-project-dialog.tsx, keeping value, onChange, placeholder={project.name}, ref, autoFocus and the form/Confirm/renameName binding intact. Do not change any other files. After editing, re-read the changed file to confirm the accessible name is added and placeholder/renameName binding are intact and nothing else changed. Report files changed and validation result.",
    reviewerAngle: "Accessibility/state-preservation angle: verify the rename Input has an accessible name, placeholder and renameName binding are intact, and form submit still works."
  },
  {
    key: "c5-mock-projects",
    file: "lib/mock-projects.ts",
    comment: "MOCK_PROJECTS has p1,p2 ownerId 'user_1' and p3,p4,p5 'user_other' (fixed literals).",
    workerTask: "In lib/mock-projects.ts, define exported constants MOCK_USER_ID='user_1' and MOCK_SHARED_USER_ID='user_other' at the top; use MOCK_USER_ID for the owned projects (p1,p2) and MOCK_SHARED_USER_ID for the shared projects (p3,p4,p5), keeping shared projects owned by a different ID. Do not change any other files. After editing, re-read the changed file to confirm the constants are exported and used correctly and ownership still distinguishes owned from shared. Report files changed and validation result.",
    reviewerAngle: "Data-integrity angle: verify the mock identity constants are exported and used correctly for owned vs shared projects, ownership still distinguishes owned from shared, and mock-check.mjs still passes."
  },
  {
    key: "c6-slug",
    file: "lib/slug.ts",
    comment: "slugFromName uses /[^a-z0-9]+/g → '-'; 東京 yields an empty slug.",
    workerTask: "In lib/slug.ts, keep the existing Latin pipeline unchanged and add a non-empty fallback when the slug would be empty (e.g., fall back to the trimmed original lowercased, then 'project' as the final fallback) so non-Latin names like 東京 produce a non-empty slug; ensure CreateProjectDialog's Confirm becomes enabled (slug non-empty) so the mock create flow can complete. Do not change any other files. After editing, re-read the changed file to confirm 東京 yields a non-empty slug, the Latin pipeline is unchanged, and the fallback behaves correctly. Report files changed and validation result.",
    reviewerAngle: "Edge-case/data-integrity angle: verify 東京 yields a non-empty slug, the Latin pipeline is unchanged, the fallback behaves correctly, and CreateProjectDialog Confirm is enabled."
  }
];

const results = [];
for (const c of comments) {
  const worker = await runs.run(c.key, {
    agent: "worker",
    task: c.workerTask,
  });
  results.push({ key: c.key, worker: worker.output });

  const reviewer = await runs.run(c.key + "-review", {
    agent: "reviewer",
    task: `Fresh-context read-only review of the fix for ${c.file}: ${c.comment}. Angle: ${c.reviewerAngle}. Verify the fix against the current code (do not edit files). Report findings (P0/P1/P2 with file+line), evidence, and a merge verdict (accept / reject / partial with reason).`,
  });
  results.push({ key: c.key, reviewer: reviewer.output });
}

return results;
