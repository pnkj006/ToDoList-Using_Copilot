    (() => {
      const { loadTasks, saveTasks, loadRemindersEnabled, saveRemindersEnabled, isValidDate } = window.taskStorage;
      const list = document.querySelector('#taskList');
      const form = document.querySelector('#taskForm');
      const taskInput = document.querySelector('#taskInput');
      const filters = [...document.querySelectorAll('.filter-button')];
      const reminderToggle = document.querySelector('#reminderToggle');
      const reminderPanel = document.querySelector('#reminderPanel');
      const reminderList = document.querySelector('#reminderList');
      let filter = 'all';
      let query = '';
      let toastTimer;
      let tasks = loadTasks(showToast);
      let remindersEnabled = loadRemindersEnabled(showToast);
      let renderedDate = localDate();
      const inAppReminders = [];

      function localDate(date = new Date()) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      }

      function dateLabel(dateString) {
        if (!isValidDate(dateString)) return '';
        return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', timeZone: 'UTC' }).format(new Date(`${dateString}T12:00:00Z`));
      }

      function completionDays() {
        return [...new Set(tasks.filter(task => task.completedAt).map(task => task.completedAt.slice(0, 10)))].sort();
      }

      function streaks() {
        const days = completionDays();
        const done = new Set(days);
        let best = 0;
        let run = 0;
        let previous;
        for (const day of days) {
          const current = new Date(`${day}T12:00:00`);
          const prior = previous && new Date(`${previous}T12:00:00`);
          run = prior && (current - prior) === 86400000 ? run + 1 : 1;
          best = Math.max(best, run);
          previous = day;
        }
        const today = localDate();
        const yesterdayDate = new Date();
        yesterdayDate.setDate(yesterdayDate.getDate() - 1);
        const anchor = done.has(today) ? today : localDate(yesterdayDate);
        let current = done.has(anchor) ? 1 : 0;
        let cursor = anchor;
        while (current && done.has(localDate(new Date(new Date(`${cursor}T12:00:00`).getTime() - 86400000)))) {
          cursor = localDate(new Date(new Date(`${cursor}T12:00:00`).getTime() - 86400000));
          current++;
        }
        return { current, best };
      }

      function showToast(message) {
        const toast = document.querySelector('#toast');
        toast.textContent = message;
        toast.classList.add('visible');
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => toast.classList.remove('visible'), 2200);
      }

      function renderInAppReminders() {
        reminderList.replaceChildren();
        for (const task of inAppReminders) {
          const item = document.createElement('li');
          item.textContent = `${task.title} — Due ${dateLabel(task.dueDate)}`;
          reminderList.append(item);
        }
        reminderPanel.hidden = inAppReminders.length === 0;
      }

      function processDueReminders() {
        if (!remindersEnabled) return;
        const today = localDate();
        const dueTasks = tasks.filter(task =>
          !task.completed &&
          task.dueDate === today &&
          !task.remindedDates.includes(today)
        );
        if (dueTasks.length === 0) return;

        const notificationsAvailable = 'Notification' in window;
        const notificationPermission = notificationsAvailable ? window.Notification.permission : 'unsupported';
        for (const task of dueTasks) {
          let notified = false;
          if (notificationsAvailable && notificationPermission === 'granted') {
            try {
              new window.Notification('Quest due today', {
                body: `${task.title} — due ${dateLabel(task.dueDate)}`
              });
              notified = true;
            } catch {
              notified = false;
            }
          }
          if (!notified) inAppReminders.push({ title: task.title, dueDate: task.dueDate });
          task.remindedDates.push(today);
        }
        saveTasks(tasks, showToast);
        renderInAppReminders();
      }

      async function enableReminders() {
        if (!saveRemindersEnabled(true, showToast)) return;
        remindersEnabled = true;
        renderReminderControl();

        if (!('Notification' in window)) {
          showToast('Browser notifications are unavailable. In-app due reminders are enabled.');
        } else if (window.Notification.permission === 'default') {
          try {
            const permission = await window.Notification.requestPermission();
            showToast(permission === 'granted'
              ? 'Browser reminders enabled while the app is open.'
              : 'Notifications were not allowed. In-app due reminders are enabled.');
          } catch {
            showToast('Could not request notification permission. In-app due reminders are enabled.');
          }
        } else if (window.Notification.permission === 'denied') {
          showToast('Notifications are blocked. In-app due reminders are enabled.');
        } else {
          showToast('Browser reminders enabled while the app is open.');
        }

        processDueReminders();
      }

      function renderReminderControl() {
        reminderToggle.setAttribute('aria-pressed', String(remindersEnabled));
        reminderToggle.textContent = remindersEnabled ? 'Turn reminders off' : 'Enable reminders';
      }

      function render() {
        renderedDate = localDate();
        document.querySelector('#todayLabel').textContent = new Intl.DateTimeFormat(undefined, { weekday: 'short', month: 'short', day: 'numeric' }).format(new Date());
        const visible = tasks.filter(task => {
          const matchesFilter = filter === 'all' || (filter === 'active' && !task.completed) || (filter === 'completed' && task.completed);
          return matchesFilter && task.title.toLowerCase().includes(query);
        });
        list.replaceChildren();
        if (visible.length === 0) {
          const empty = document.createElement('div');
          empty.className = 'empty-state';
          const hasTasks = tasks.length > 0;
          empty.innerHTML = `<div class="chest" aria-hidden="true"></div><h3>${hasTasks ? 'No quests found' : 'Your quest board is empty'}</h3><p>${hasTasks ? 'Try another filter or search.' : 'Add your first quest and start building your day.'}</p>`;
          list.append(empty);
        } else {
          const today = localDate();
          const groups = [
            { title: 'Overdue', tasks: [] },
            { title: 'Due Today', tasks: [] },
            { title: 'Upcoming', tasks: [] },
            { title: 'No Due Date', tasks: [] },
            { title: 'Completed', tasks: [] }
          ];
          for (const task of visible) {
            let group;
            if (!task.dueDate) group = groups[3];
            else if (task.completed && task.dueDate < today) group = groups[4];
            else if (!task.completed && task.dueDate < today) group = groups[0];
            else if (task.dueDate === today) group = groups[1];
            else group = groups[2];
            group.tasks.push(task);
          }
          for (const group of groups) {
            if (group.tasks.length === 0) continue;
            const section = document.createElement('section');
            section.className = 'task-group';
            const heading = document.createElement('h3');
            heading.className = 'task-group-heading';
            heading.textContent = group.title;
            const groupItems = document.createElement('div');
            groupItems.className = 'task-group-items';
            for (const task of group.tasks) groupItems.append(taskElement(task));
            section.append(heading, groupItems);
            list.append(section);
          }
        }

        const incomplete = tasks.filter(task => !task.completed).length;
        const completed = tasks.length - incomplete;
        const percent = tasks.length ? Math.round(completed / tasks.length * 100) : 0;
        document.querySelector('#taskCount').textContent = `${incomplete} ${incomplete === 1 ? 'QUEST' : 'QUESTS'} LEFT`;
        document.querySelector('#progressCount').textContent = `${completed} / ${tasks.length}`;
        document.querySelector('#progressFill').style.width = `${percent}%`;
        document.querySelector('#progressBar').setAttribute('aria-valuenow', String(percent));
        document.querySelector('#progressCaption').textContent = tasks.length === 0 ? 'Add a quest and get rolling.' : percent === 100 ? 'All quests cleared. Nice work!' : `${percent}% complete. Keep placing blocks.`;
        const { current, best } = streaks();
        document.querySelector('#streakNumber').textContent = current;
        document.querySelector('#bestStreak').textContent = `${best} ${best === 1 ? 'day' : 'days'}`;
        document.querySelector('#streakNote').textContent = current ? 'You are keeping the flame alive.' : 'Complete a quest to start your streak.';
        renderReminderControl();
      }

      function refreshDateSensitiveUI() {
        if (localDate() !== renderedDate) render();
        processDueReminders();
      }

      function taskElement(task) {
        const item = document.createElement('article');
        item.className = `task-item${task.completed ? ' is-complete' : ''}`;
        const check = document.createElement('button');
        check.className = 'check-button';
        check.type = 'button';
        check.setAttribute('aria-label', `${task.completed ? 'Mark' : 'Complete'} ${task.title}`);
        check.setAttribute('aria-pressed', String(task.completed));
        check.textContent = task.completed ? '✓' : '';
        check.addEventListener('click', () => {
          task.completed = !task.completed;
          task.completedAt = task.completed ? new Date().toISOString() : null;
          saveTasks(tasks, showToast);
          render();
          processDueReminders();
          if (task.completed) showToast('Quest complete. Block placed!');
        });

        const details = document.createElement('div');
        details.className = 'task-details';
        const title = document.createElement('div');
        title.className = 'task-title';
        title.textContent = task.title;
        const meta = document.createElement('div');
        meta.className = 'task-meta';
        const priority = document.createElement('span');
        priority.className = `priority ${['low', 'medium', 'high'].includes(task.priority) ? task.priority : 'medium'}`;
        priority.textContent = `${task.priority === 'high' ? 'High' : task.priority === 'low' ? 'Low' : 'Normal'} priority`;
        meta.append(priority);
        if (task.dueDate) {
          const due = document.createElement('span');
          const overdue = !task.completed && task.dueDate < localDate();
          due.className = `due-date${overdue ? ' overdue' : ''}`;
          due.textContent = `${overdue ? 'OVERDUE' : 'DUE'} ${dateLabel(task.dueDate)}`;
          meta.append(due);
        } else {
          const noDueDate = document.createElement('span');
          noDueDate.className = 'due-date no-date';
          noDueDate.textContent = 'NO DUE DATE';
          meta.append(noDueDate);
        }
        if (task.completedAt) {
          const doneDate = document.createElement('span');
          doneDate.textContent = `DONE ${dateLabel(task.completedAt.slice(0, 10))}`;
          meta.append(doneDate);
        }
        const dueRow = document.createElement('div');
        dueRow.className = 'task-due-row';
        const dueLabel = document.createElement('label');
        dueLabel.className = 'date-input-label';
        dueLabel.textContent = 'DUE DATE';
        const dueInput = document.createElement('input');
        dueInput.className = 'task-due-input';
        dueInput.type = 'date';
        dueInput.value = task.dueDate;
        dueInput.setAttribute('aria-label', `Due date for ${task.title}`);
        dueInput.addEventListener('change', () => {
          const dueDate = dueInput.value;
          if (dueDate && !isValidDate(dueDate)) {
            showToast('Choose a valid due date.');
            return;
          }
          task.dueDate = dueDate;
          saveTasks(tasks, showToast);
          render();
          processDueReminders();
        });
        dueLabel.append(dueInput);
        dueRow.append(dueLabel);
        if (task.dueDate) {
          const clearDueDate = document.createElement('button');
          clearDueDate.className = 'clear-due-button';
          clearDueDate.type = 'button';
          clearDueDate.textContent = 'Clear';
          clearDueDate.setAttribute('aria-label', `Remove due date from ${task.title}`);
          clearDueDate.addEventListener('click', () => {
            task.dueDate = '';
            saveTasks(tasks, showToast);
            render();
          });
          dueRow.append(clearDueDate);
        }
        details.append(title, meta, dueRow);

        const actions = document.createElement('div');
        actions.className = 'task-actions';
        const remove = document.createElement('button');
        remove.className = 'icon-button';
        remove.type = 'button';
        remove.setAttribute('aria-label', `Delete ${task.title}`);
        remove.title = 'Delete quest';
        remove.textContent = '×';
        remove.addEventListener('click', () => {
          tasks = tasks.filter(entry => entry.id !== task.id);
          saveTasks(tasks, showToast);
          render();
          showToast('Quest removed.');
        });
        actions.append(remove);
        item.append(check, details, actions);
        return item;
      }

      form.addEventListener('submit', event => {
        event.preventDefault();
        const title = taskInput.value.trim();
        if (!title) return;
        const dueDate = document.querySelector('#dueInput').value;
        tasks.unshift({
          id: globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`,
          title,
          priority: document.querySelector('#priorityInput').value,
          dueDate,
          completed: false,
          completedAt: null,
          remindedDates: [],
          createdAt: new Date().toISOString()
        });
        saveTasks(tasks, showToast);
        taskInput.value = '';
        document.querySelector('#dueInput').value = '';
        filter = 'all';
        filters.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.filter === filter)));
        render();
        processDueReminders();
        taskInput.focus();
      });

      filters.forEach(button => button.addEventListener('click', () => {
        filter = button.dataset.filter;
        filters.forEach(option => option.setAttribute('aria-pressed', String(option === button)));
        render();
      }));
      document.querySelector('#searchInput').addEventListener('input', event => {
        query = event.target.value.trim().toLowerCase();
        render();
      });
      reminderToggle.addEventListener('click', () => {
        if (remindersEnabled) {
          if (!saveRemindersEnabled(false, showToast)) return;
          remindersEnabled = false;
          renderReminderControl();
          showToast('Due reminders are off.');
          return;
        }
        enableReminders();
      });
      document.addEventListener('visibilitychange', () => {
        if (!document.hidden) refreshDateSensitiveUI();
      });
      window.setInterval(() => {
        if (!document.hidden) refreshDateSensitiveUI();
      }, 60000);
      render();
      processDueReminders();
    })();
