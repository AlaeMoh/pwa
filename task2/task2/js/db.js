
var promiseDB = idb.open("TodoDB", 1, function (upgradeDB) {
  if (!upgradeDB.objectStoreNames.contains("Tasks")) {
    upgradeDB.createObjectStore("Tasks", {
      keyPath: "id",
      autoIncrement: true,
    });
  }
});

var DB = {
  addTask: function (task) {
    return promiseDB.then(function (db) {
      var tx = db.transaction("Tasks", "readwrite");
      return tx.objectStore("Tasks").add(task);
    });
  },

  getAllTasks: function () {
    return promiseDB.then(function (db) {
      return db.transaction("Tasks", "readonly").objectStore("Tasks").getAll();
    });
  },

  markDone: function (id) {
    return promiseDB
      .then(function (db) {
        return db.transaction("Tasks", "readonly").objectStore("Tasks").get(id);
      })
      .then(function (task) {
        if (!task) return;
        task.done = true;
        return promiseDB.then(function (db) {
          return db
            .transaction("Tasks", "readwrite")
            .objectStore("Tasks")
            .put(task);
        });
      });
  },

  deleteTask: function (id) {
    return promiseDB.then(function (db) {
      return db
        .transaction("Tasks", "readwrite")
        .objectStore("Tasks")
        .delete(id);
    });
  },
};
