# Goal

Inspect the existing codebase and create a detailed, implementation-ready plan for building the Editor Home screen, project dialogs, and sidebar actions.

**Your output will be executed by a smaller 4B coding model.** Your plan must therefore be explicit, precise, repository-specific, and divided into small steps that a less capable model can execute with minimal independent reasoning.

Your responsibility is to analyze the repository and design the implementation plan. Do not implement the feature or modify any files.

# 1. Repository inspection

Before creating the plan, inspect the actual codebase and identify:

- The existing Editor Home screen and editor layout.
- Navbar and sidebar components, including their current behavior.
- Project data structures, TypeScript types, and ownership/collaborator information.
- Existing dialogs, dropdown menus, buttons, inputs, and form components.
- Existing hooks, state-management patterns, and form validation conventions.
- Existing slug-generation utilities.
- Existing responsive/mobile sidebar behavior and outside-click handling.
- Relevant styling conventions, icons, and accessibility patterns.
- Available scripts for type checking, linting, testing, and building.

Read the relevant source files before recommending changes. Trace component relationships and state flows where necessary.

Do not invent file paths, components, types, functions, or existing behavior. Distinguish verified findings from assumptions.

# 2. Requirements to plan

## Editor Home

Reuse the existing editor layout. Do not modify navbar behavior or existing sidebar navigation behavior.

Display centrally:

- Heading: `Create a project or open existing one`
- Description: `Start a new architecture workspace or choose a project on the sidebar`
- `New Project` button with a plus icon.

Keep the layout minimal. Do not wrap this content in cards.

Clicking `New Project` opens the Create Project dialog.

## Create Project dialog

Include:

- Project name input.
- Live slug preview derived from the project name.
- Preview updates immediately as the user types.
- Appropriate input validation.

The slug should be lowercase, trimmed, hyphen-separated, and free of unnecessary repeated or leading/trailing hyphens. Special characters should be handled consistently with the existing codebase.

Reuse an existing slug utility if available. Otherwise, specify where a small reusable utility should be created and how it should behave.

The slug preview is UI-only. Do not add API calls or persistence.

## Rename Project dialog

Include:

- Input prefilled with the selected project's current name.
- Description showing the current project name.
- Automatic input focus when the dialog opens.
- Enter submits the form.

Specify how the selected project and initial form values are provided to the dialog and how stale form values are prevented when switching between projects or reopening the dialog.

## Delete Project dialog

Include:

- A destructive confirmation dialog identifying the selected project.
- Cancel and destructive Confirm buttons.
- No input and no typed confirmation phrase.

Use existing dialog conventions.

## Sidebar project actions

Add Rename and Delete actions to project items.

- Show actions only for projects owned by the current user.
- Hide actions for shared/collaborator projects.
- Ensure actions target the correct project.
- Preserve existing project selection and navigation behavior.

Wire the sidebar Create Project action to the same Create Project dialog used by Editor Home.

## Mobile sidebar

- Tapping outside an open sidebar closes it.
- Display a backdrop scrim while it is open.
- Tapping inside the sidebar must not trigger the outside-click handler.
- Preserve existing responsive behavior.
- Avoid introducing duplicate or conflicting sidebar state.

## State management

Evaluate whether a dedicated hook is appropriate for managing:

- Active dialog.
- Selected project.
- Form values and validation.
- Loading state, only if necessary.

Base the design on the actual repository architecture. Avoid unnecessary abstractions.

## Implementation constraints

The planned implementation must:

- Use mock project data only.
- Make no API calls.
- Add no database operations or persistence.
- Avoid unnecessary dependencies and refactoring.
- Preserve unrelated application behavior.
- Follow existing TypeScript, styling, and accessibility conventions.

# 3. Design the plan for a 4B coding model

The implementation plan must minimize the need for the implementing model to infer missing details.

For each implementation step, specify:

1. **Objective:** What must be accomplished.
2. **Files:** Exact existing file paths to modify and new paths to create, if necessary.
3. **Existing code to reuse:** Relevant components, functions, hooks, types, and conventions discovered during inspection.
4. **Changes required:** Concrete instructions describing what to add, change, or preserve.
5. **Interfaces and state:** Relevant props, types, state ownership, callback responsibilities, and data flow.
6. **Dependencies:** Which earlier steps must be completed first.
7. **Acceptance criteria:** Observable conditions that establish the step is complete.
8. **Verification:** The specific checks needed to confirm the change works.

Keep each step small enough that it can be implemented and checked independently.

Where multiple implementation approaches are possible, evaluate them and select one based on the existing codebase. Explain the choice briefly so the 4B model does not have to make the architectural decision itself.

Do not provide several alternative designs unless an unresolved repository constraint genuinely requires a choice.

Do not over-specify implementation details that are already handled by existing reusable components. Reference those components and explain how to use them.

# 4. Required output structure

## A. Architecture findings

Summarize the relevant repository structure and verified implementation details.

Include exact file paths and the responsibilities of the relevant components, hooks, utilities, and types.

## B. Implementation design

Describe the proposed component relationships, state ownership, event flows, and data flow.

Explain how the Editor Home and sidebar share the Create Project dialog, how Rename/Delete receive the selected project, and how ownership controls the visibility of project actions.

## C. File-by-file change list

For every file to modify or create, provide:

- Exact path.
- Whether it already exists.
- Purpose.
- Specific planned changes.
- Existing functionality that must remain unchanged.

Avoid unnecessary files and duplicated logic.

## D. Ordered implementation steps

Provide small, sequential implementation tasks with explicit dependencies and acceptance criteria.

The implementing model should be able to follow the steps in order without having to redesign the architecture.

## E. Edge cases and regressions

Specify the expected behavior for:

- Empty or whitespace-only project names.
- Slug generation for special characters.
- Dialog reopening and stale form state.
- Switching between selected projects.
- Missing or invalid selected project data.
- Shared/collaborator project permissions.
- Keyboard submission and dialog cancellation.
- Mobile outside-click behavior and event propagation.
- Preservation of existing navigation and layout.

Only include cases relevant to the actual codebase and requirements.

## F. Verification plan

List the manual acceptance tests and actual repository commands that should be run.

Do not invent package scripts or claim that tests have been executed.

## G. Instructions for the implementing model

End with a short, actionable execution checklist that tells the 4B model:

- Which step to start with.
- Which files to inspect again before editing.
- Which existing patterns to follow.
- Which constraints must never be violated.
- How to validate each step.
- How to report completion, failures, and any deviations.

# 5. Planning rules

- Inspect the repository before deciding the architecture.
- Base file paths and implementation decisions on verified source code.
- Prioritize the smallest correct change set.
- Make all essential architectural decisions in the plan.
- Keep the plan concise enough for a small model to retain and follow, but detailed enough to avoid ambiguity.
- Do not include the full implementation code.
- Do not modify files.
- Do not add unrelated enhancements.

**Final instruction:** Return only the implementation plan in the required structure. The plan will be passed to a 4B coding model, so prioritize clarity, explicit instructions, small implementation steps, and verifiable acceptance criteria over lengthy explanations.