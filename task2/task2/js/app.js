

(function populateSelects() {
  var dayEl = document.getElementById("taskDay");
  var monthEl = document.getElementById("taskMonth");
  var yearEl = document.getElementById("taskYear");

  for (var d = 1; d <= 31; d++) {
    var o = document.createElement("option");
    o.value = o.textContent = d < 10 ? "0" + d : "" + d;
    dayEl.appendChild(o);
  }

  [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ].forEach(function (m, i) {
    var o = document.createElement("option");
    o.value = i + 1;
    o.textContent = m;
    monthEl.appendChild(o);
  });

  var now = new Date();
  for (var y = now.getFullYear(); y <= now.getFullYear() + 5; y++) {
    var o = document.createElement("option");
    o.value = o.textContent = y;
    yearEl.appendChild(o);
  }

  dayEl.value = now.getDate() < 10 ? "0" + now.getDate() : "" + now.getDate();
  monthEl.value = now.getMonth() + 1;
  yearEl.value = now.getFullYear();
})();

function log(msg) {
  var ul = document.getElementById("logList");
  var li = document.createElement("li");
  li.textContent = msg;
  ul.appendChild(li);
  ul.scrollTop = ul.scrollHeight;
}

function markDoneInDOM(id) {
  var el = document.querySelector('.task-card[data-id="' + id + '"]');
  if (el) el.classList.add("done");
}

function onTaskDue(task) {
  DB.markDone(task.id).then(function () {
    markDoneInDOM(task.id);
    log('"' + task.title + '" is due — marked done.');
  });
}

function renderTask(task) {
  var list = document.getElementById("tasksList");

  var empty = list.querySelector(".empty-msg");
  if (empty) empty.remove();

  var due = new Date(task.dueTime);
  var dateStr = due.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  var timeStr = due.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });

  var card = document.createElement("div");
  card.className = "task-card" + (task.done ? " done" : "");
  card.dataset.id = task.id;

  card.innerHTML =
    '<div class="task-left">' +
    '<span class="task-check" aria-hidden="true"></span>' +
    '<div class="task-body">' +
    '<p class="task-title">' +
    task.title +
    "</p>" +
    '<p class="task-meta">' +
    timeStr +
    " &nbsp;·&nbsp; " +
    dateStr +
    "</p>" +
    "</div>" +
    "</div>" +
    '<button class="del-btn" aria-label="Delete task">&#x2715;</button>';

  card.querySelector(".del-btn").onclick = function () {
    DB.deleteTask(task.id).then(function () {
      card.classList.add("removing");
      card.addEventListener("animationend", function () {
        card.remove();
        if (!list.querySelector(".task-card"))
          list.innerHTML = '<p class="empty-msg">No tasks yet.</p>';
      });
      log('"' + task.title + '" deleted.');
    });
  };

  list.appendChild(card);

  Notify.schedule(task, onTaskDue);
}

function loadTasks() {
  DB.getAllTasks().then(function (tasks) {
    var list = document.getElementById("tasksList");
    list.innerHTML = "";
    if (!tasks.length) {
      list.innerHTML = '<p class="empty-msg">No tasks yet.</p>';
      return;
    }
    tasks.forEach(renderTask);
    log("Entries all displayed.");
  });
}

document.getElementById("addTaskBtn").onclick = function () {
  var title = document.getElementById("taskTitle").value.trim();
  var hh = parseInt(document.getElementById("taskHH").value, 10);
  var mm = parseInt(document.getElementById("taskMM").value, 10);
  var day = parseInt(document.getElementById("taskDay").value, 10);
  var month = parseInt(document.getElementById("taskMonth").value, 10) - 1;
  var year = parseInt(document.getElementById("taskYear").value, 10);

  if (!title) {
    log("⚠ Please enter a task title.");
    return;
  }
  if (isNaN(hh) || isNaN(mm)) {
    log("⚠ Please enter a valid time.");
    return;
  }

  var due = new Date(year, month, day, hh, mm, 0, 0);
  var task = { title: title, dueTime: due.getTime(), done: false };

  DB.addTask(task)
    .then(function (newId) {
      task.id = newId;
      renderTask(task);
      log('Added: "' + title + '" due ' + due.toLocaleString("en-GB"));
      document.getElementById("taskTitle").value = "";
      document.getElementById("taskHH").value = "";
      document.getElementById("taskMM").value = "";
    })
    .catch(function (e) {
      log("Error: " + e);
    });
};

document.getElementById("taskTitle").addEventListener("keydown", function (e) {
  if (e.key === "Enter") document.getElementById("addTaskBtn").click();
});

log("App initialised.");
promiseDB.then(function () {
  log("Database initialised.");
  Notify.requestPermission();
  loadTasks();
});



card.querySelector('.task-check').onclick = function() {
    if (task.done) return;
    DB.markDone(task.id).then(function() {
        markDoneInDOM(task.id); 
        log('"' + task.title + '" marked done manually.');
    });
};