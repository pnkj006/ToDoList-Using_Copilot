# Blockday To-Do List

Blockday is a small, responsive to-do list with a block-style, Minecraft-inspired look. It helps you plan everyday tasks, track completed work, and keep your progress saved in your browser.

## Features

- Add tasks with normal, high, or low priority.
- Assign or change a task's due date with a date picker, or clear it to return the task to the No Due Date group.
- See due dates on task cards and identify overdue tasks that are still active.
- Optionally enable reminders for incomplete tasks due today.
- Receive browser notifications when permission is granted, or in-app reminders when notifications are unavailable or blocked.
- Mark tasks active or complete.
- Filter tasks by All, Active, or Done.
- Search task titles.
- Delete tasks.
- See a completion count, progress bar, daily streak, and best streak.
- Save tasks in browser local storage so they remain after a refresh or browser restart in the same browser profile.
- Use the responsive layout on mobile and desktop.

## Technologies Used

- HTML for page structure.
- CSS for the responsive block-style interface.
- Vanilla JavaScript for task behavior and browser local-storage access.
- Browser `localStorage` for saving task data; there is no server-side database or API.
- DM Mono and Nunito fonts loaded from Google Fonts when an internet connection is available, with local system-font fallbacks.
- Python's built-in HTTP server is an optional way to serve the files locally. No application package manager or runtime is required.

## Project Structure

```text
ToDoList-Using_Copilot/
├── index.html    # Page markup and links to the app assets
├── styles.css    # Responsive layout and visual styles
├── frontend.js   # Task interface, rendering, filters, and interactions
├── backend.js    # Browser local-storage load/save functions
└── README.md     # Setup and usage guide
```

## Prerequisites

- Git, to clone the repository: [git-scm.com/downloads](https://git-scm.com/downloads)
- A current browser such as Firefox, Chrome, Edge, or Safari.
- Python 3 for the recommended local web server:
  - [python.org/downloads](https://www.python.org/downloads/)
  - Python is already installed on some computers. Node.js and npm are not needed to run this application.

## Installation and Setup

The same Git commands work in Windows PowerShell, macOS Terminal, and Linux terminals:

```sh
git clone https://github.com/pnkj006/ToDoList-Using_Copilot.git
cd ToDoList-Using_Copilot
```

There are no application dependencies to install, no `.env` file to configure, and no `npm install` step. If Git is not installed, download the repository as a ZIP from GitHub and extract it.

## How to Run the Application

Run a local static web server from the project directory.

**Windows PowerShell** (using the Python launcher):

```powershell
py -m http.server 8000
```

**macOS or Linux:**

```sh
python3 -m http.server 8000
```

If `py` or `python3` is not recognized, install Python 3 and reopen the terminal. On Windows, `python -m http.server 8000` may also work if Python is on your PATH.

Open [http://localhost:8000](http://localhost:8000) in a browser. The server serves `index.html` from the project directory. To stop it, focus the terminal and press **Ctrl+C**.

If port 8000 is already in use, choose another port, such as `8080`, in the command and visit `http://localhost:8080`. If the page is blank, check that the server was started in the directory containing `index.html`, then reload and check the browser developer console for errors. Hard-refresh the page if recent edits do not appear. The font downloads require internet access; the app itself can still use its fallback fonts offline.

## How to Use the Application

1. Type a task into the new-task field.
2. Choose a priority and, if useful, a due date from the date picker. Leave it blank for No Due Date.
3. Select **Add quest** to add it to the list.
4. Select the square control beside a task to switch it between active and complete. Completed tasks show a check and a completion date.
5. Edit a task's due date using the date picker on its card. Select **Clear** beside the picker to remove the date.
6. Use **All**, **Active**, or **Done** to filter the task list.
7. Type into the search field to find tasks by title. Search works together with the selected filter.
8. Select the **×** control on a task card to delete it.

The progress panel and streak summary update as tasks are completed.

## Due Dates and Reminders

Use the date picker in the task form to set a date when adding a task. Each task card also has a date picker, so you can add or change the due date later. Select **Clear** to remove an assigned date. Tasks without a date stay in the **No Due Date** group. Dated tasks are grouped under **Overdue**, **Due Today**, **Upcoming**, or **Completed** (for completed tasks whose due date has passed). Incomplete tasks with a date before today are marked overdue; completed tasks are not marked overdue.

Reminders are off by default. Select **Enable reminders** to opt in. The browser asks for notification permission only after this action. If permission is granted and the browser supports the Notifications API, the app can show a browser notification for each incomplete task due today. If notifications are denied, unavailable, or cannot be displayed, the app shows an in-app reminder while the page is open. You can turn reminders off with the same control.

Due dates are stored as calendar dates (`YYYY-MM-DD`) rather than timestamps, so they are compared and displayed as local calendar days without shifting across time zones. Reminder delivery is recorded for each task/date pair, preventing the same task and date from being announced on every refresh. Changing a task's due date allows a reminder for the new date.

Reminders are checked while the app is open and when it becomes visible again. Browser notifications generally require a secure context (HTTPS; localhost is treated as secure) and browser and operating-system notification settings may suppress them. The app does not run a background service and cannot guarantee reminders while it is closed; open the app on or after the due date to check and deliver due reminders.

## Data Storage

Tasks, due dates, and per-task reminder delivery state are stored as JSON in this browser profile's local storage under the key `blockday.tasks.v1`. The reminder opt-in is stored separately. Saved data normally remains after refreshing or restarting the browser, but it is not synced to another browser, device, or user account. Clearing this site's browser storage, using private browsing, or changing the site's origin can make saved data unavailable. Storage limits or browser privacy settings can also prevent saving.

## Troubleshooting

- **Dependencies fail to install:** There are no project dependencies and no install command. Skip `npm install`; use Python only to run the local server.
- **The server does not start:** Confirm Python 3 is installed (`python3 --version`, or `py --version` on Windows), and run the command from the project directory.
- **The browser shows a blank page or missing styles:** Confirm the server is running and that `index.html`, `styles.css`, `frontend.js`, and `backend.js` are together in the project root. Reload and inspect the browser developer console.
- **Port 8000 is busy:** Start the server on another port, for example `python3 -m http.server 8080` or `py -m http.server 8080`, then open `http://localhost:8080`.
- **Changes do not appear:** Save the edited files and hard-refresh the page. Confirm you edited the copy being served.
- **Tasks are missing after a refresh:** Use the same browser and URL as before, ensure the browser allows local storage, and avoid private browsing. Check the console for storage errors. Clearing site data removes saved tasks.
- **No browser reminder appears:** Confirm reminders are enabled and the browser has granted notification permission. Check the browser's site settings and the operating system's notification settings. The in-app reminder is the fallback; reminders are not guaranteed while the app is closed.
- **Fonts look different offline:** DM Mono and Nunito are loaded from Google Fonts; system-font fallbacks are used when those fonts cannot be reached.

## Development and Contribution

Edit `index.html`, `styles.css`, `frontend.js`, or `backend.js` in a text editor. Keep the frontend and storage module script references in `index.html` in place, and test the app through the local server after changes. There is no configured automated test, lint, or build command. If Node.js is installed, the JavaScript files can be checked for syntax with:

```sh
node --check frontend.js
node --check backend.js
```

To contribute a change, create a branch, make and test a focused update, and commit it:

```sh
git switch -c my-change
git add index.html styles.css frontend.js backend.js README.md
git commit -m "Describe the change"
git push -u origin my-change
```

Push the branch and open a pull request on GitHub to share it for review.

## Deployment

This is a static site and does not need a server-side runtime. It can be hosted by GitHub Pages or another static web host. For GitHub Pages, push the project files to GitHub, open the repository's **Settings → Pages**, select the branch and repository root as the publishing source, and save. Open the published URL after the deployment finishes. Keep all four application files together. Tasks are saved separately in each visitor's browser and are not uploaded to the hosted site.

## License

No license has been specified in this repository. Check with the repository owner before reusing or redistributing the project.
