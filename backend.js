(() => {
  const STORAGE_KEY = 'blockday.tasks.v1';
  const REMINDERS_KEY = 'blockday.reminders.enabled.v1';

  function isValidDate(value) {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const [year, month, day] = value.split('-').map(Number);
    if (year < 1 || month < 1 || month > 12) return false;
    const leapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
    const daysInMonth = [31, leapYear ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    return day >= 1 && day <= daysInMonth[month - 1];
  }

  function loadTasks(onError) {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      return Array.isArray(saved)
        ? saved
          .filter(task => task && typeof task.id === 'string' && typeof task.title === 'string')
          .map(task => ({
            ...task,
            dueDate: isValidDate(task.dueDate) ? task.dueDate : '',
            remindedDates: [...new Set([
              ...(Array.isArray(task.remindedDates) ? task.remindedDates.filter(isValidDate) : []),
              ...(isValidDate(task.remindedForDate) ? [task.remindedForDate] : [])
            ])]
          }))
        : [];
    } catch (error) {
      onError(error instanceof SyntaxError
        ? 'Saved task data could not be read. Starting with an empty board.'
        : 'Browser storage is unavailable. Tasks may not persist after this visit.');
      return [];
    }
  }

  function saveTasks(tasks, onError) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
      return true;
    } catch {
      onError('Could not save. Browser storage may be full.');
      return false;
    }
  }

  function loadRemindersEnabled(onError) {
    try {
      return localStorage.getItem(REMINDERS_KEY) === 'true';
    } catch {
      onError('Browser storage is unavailable. Reminder settings may not persist.');
      return false;
    }
  }

  function saveRemindersEnabled(enabled, onError) {
    try {
      localStorage.setItem(REMINDERS_KEY, String(enabled));
      return true;
    } catch {
      onError('Could not save the reminder setting. Browser storage may be full.');
      return false;
    }
  }

  window.taskStorage = Object.freeze({
    loadTasks,
    saveTasks,
    loadRemindersEnabled,
    saveRemindersEnabled,
    isValidDate
  });
})();
