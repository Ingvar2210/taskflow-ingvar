# Taskflow

Author: Ingvar Guðjónsson

A responsive personal to-do website built with HTML, CSS and JavaScript. It demonstrates browser APIs through a practical app: add tasks, edit their titles and priorities, mark tasks complete, delete tasks, search, sort and filter the list.

## Submission URLs

GitHub repository: https://github.com/Ingvar2210/taskflow-ingvar

GitHub Pages: add your actual public Pages URL after enabling Pages.

The website is buildless and works with GitHub Pages. A private hosted preview may also be provided, but a publicly accessible GitHub Pages link is recommended for teacher access.

## APIs used

These are browser APIs, not external web services. No API keys, accounts, external data requests or backend are required. The assignment's DOM and localStorage examples use the same kind of browser APIs.

| API | Features used | Purpose |
| --- | --- | --- |
| DOM API | getElementById, querySelector, querySelectorAll, createElement, createDocumentFragment, append, replaceChildren, textContent, classList, dataset, setAttribute, closest, addEventListener, focus | Render tasks from an array of objects, handle user interactions, update counters and manage keyboard focus. |
| Web Storage API | localStorage.getItem, setItem, removeItem, storage event | Restore tasks on startup, save changes, reset only this app's key and synchronize other tabs on the same origin. |
| History API | pushState, replaceState, popstate event | Record view changes without reloading and restore filters through browser Back and Forward. |
| URL/Location APIs | window.location.href, new URL, searchParams.get, searchParams.set | Read and update the selected filter in the URL, for example ?view=completed. |
| HTML dialog API | showModal, close | Provide keyboard-operable edit and deletion confirmation dialogs. |

Every function in app.js has a comment explaining its purpose and API usage. Custom helpers are explicitly identified as app code, not functions supplied by an API. Array methods, JSON, Date and Math are standard JavaScript features.

## Main features

- Add a task with normal, high or low priority.
- Edit its title or priority in a dialog.
- Complete and reopen tasks using a checkbox.
- Delete one task, clear completed tasks or reset the workspace after confirmation.
- Switch between All tasks, In progress and Completed.
- Search titles and sort by newest, oldest or priority.
- See remaining/completed counts and percentage progress.
- Keep tasks after a refresh or browser restart on the same origin, when local storage is available and retained.
- Synchronize open tabs through the storage event.
- Navigate between filters using browser Back and Forward. Task edits are not undone by browser navigation.
- Use the app on mobile and desktop, with visible focus styles, labeled controls and a live status message.

## Data and function design

Tasks are stored as an array of objects. Each object has id, title, priority, completed and createdAt properties. The array is serialized with JSON.stringify under the key taskflow.tasks.v1 and restored using JSON.parse.

The render function filters and sorts a copy of the array, loops over the visible tasks, creates DOM nodes and inserts them with a document fragment. Task text uses textContent, so a title containing HTML is displayed as text. Stored data is checked before use.

The add, edit, completion and deletion handlers change the array, call saveTasks and refresh the display. The app uses named functions rather than undocumented anonymous event handlers. Event delegation on the task list avoids registering new listeners for every row.

## How the APIs helped and what was difficult

DOM methods make it possible to build and update the list without reloading the page. Web Storage provides persistence without a server. The History API makes view navigation work naturally with browser controls.

DOM code is more verbose than a component framework, and rendering can replace a focused element, so focus must be restored. localStorage stores strings, requiring JSON serialization, validation and error handling. Storage may be blocked or full; in that case the app reports that changes are only in the current tab. The storage event is delivered to other tabs, not the tab that made the change. History state must be restored on popstate without pushing another entry, or Back navigation would be broken.

## Limitations

Data is local to one browser profile and origin. It is not a cloud backup, does not sync across devices and can be lost if browsing data is cleared. Private browsing may discard it. Do not use the app for sensitive data. Concurrent edits in two tabs use the latest saved complete list; there is no conflict merging. Search and sort preferences are temporary. The URL stores the view only.

If stored data is corrupt, the app shows a warning and does not overwrite it automatically on startup. Adding a new task may replace that invalid stored list. Reset removes only this app's storage key, not other sites' data.

## Run locally

Open a terminal in this project folder and run:

```sh
python3 -m http.server 8000 --directory dist
```

Visit http://localhost:8000. No installation or build is needed. Serving over HTTP is recommended because storage behavior for file URLs is not guaranteed across browsers.

## Publish on GitHub Pages

1. In this repository, keep README.md and the complete dist folder on the main branch.
2. This project includes a GitHub Actions workflow that publishes dist.
3. In repository Settings, open Pages and choose GitHub Actions as the source.
4. Push to the main branch or run the Deploy website workflow manually from the Actions tab.
5. After a successful deployment, copy the real URL from Settings → Pages into this README.
6. Submit both the repository URL and the Pages URL.

If your default branch has a different name, update the workflow's branch setting. GitHub Pages availability depends on your account and repository visibility. A public repository is the simplest option for a course project.

## Project files

- dist/index.html: semantic structure, inputs, navigation and dialogs.
- dist/style.css: responsive layout and visual styles.
- dist/app.js: commented functions and browser API behavior.
- .github/workflows/pages.yml: GitHub Pages deployment.
- README.md: project description, APIs, setup and submission guidance.

## Verification

JavaScript syntax and static references are checked during development. Logic checks exercise adding, editing, completing, deleting, resetting, storage failures, reload restoration and history-filter restoration using a simulated DOM. These checks do not replace a real-browser visual and interaction test.

Before submission, check these steps in your browser:

1. Add tasks with different priorities; refresh and confirm they remain.
2. Edit a task, complete it, reopen it and delete it.
3. Search for a title and test all sort options.
4. Change filters, then use Back and Forward.
5. Open a second tab on the same site and confirm a change appears there.
6. Cancel a deletion, then confirm a deletion. Test Clear completed and Reset.
7. Use only a keyboard and check narrow mobile and wide desktop layouts.
8. Verify both submitted URLs are accessible to the teacher.

## Recommended API documentation

- [DOM API](https://developer.mozilla.org/en-US/docs/Web/API/Document_Object_Model)
- [Web Storage API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API)
- [localStorage](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage)
- [storage event](https://developer.mozilla.org/en-US/docs/Web/API/Window/storage_event)
- [History API](https://developer.mozilla.org/en-US/docs/Web/API/History_API)
- [URL API](https://developer.mozilla.org/en-US/docs/Web/API/URL)
- [Dialog API](https://developer.mozilla.org/en-US/docs/Web/API/HTMLDialogElement)
- [GitHub Pages deployment](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)
