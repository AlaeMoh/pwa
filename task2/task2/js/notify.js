var Notify = {
    requestPermission: function() {
        if (!('Notification' in window)) return;
        if (Notification.permission === 'default') {
            Notification.requestPermission();
        }
    },

    isGranted: function() {
        return 'Notification' in window && Notification.permission === 'granted';
    },

    schedule: function(task, onFire) {
        if (task.done) return;
        var delay = task.dueTime - Date.now();
        if (delay <= 0) return;

        setTimeout(function() {
            if (Notify.isGranted()) {
                new Notification('Task Due', {
                    body: task.title,
                    icon: 'https://cdn-icons-png.flaticon.com/512/1055/1055183.png',
                    tag: 'task-' + task.id
                });
            }
            if (typeof onFire === 'function') onFire(task);
        }, delay);
    }

};