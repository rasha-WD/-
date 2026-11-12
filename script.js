// ================================
// إعدادات الموقع والبيانات
// ================================

const $ = id => document.getElementById(id);

let tasks = JSON.parse(localStorage.getItem("myTasks")) || [];

let currentDate = new Date();
let currentView = "month";
let selectedDate = null;

const months = [
    "يناير", "فبراير", "مارس", "أبريل",
    "مايو", "يونيو", "يوليو", "أغسطس",
    "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"
];

const days = [
    "السبت", "الأحد", "الإثنين", "الثلاثاء",
    "الأربعاء", "الخميس", "الجمعة"
];

const priorityNames = {
    high: "عالية 🔴",
    medium: "متوسطة 🟡",
    low: "منخفضة 🟢"
};

function saveTasks() {
    localStorage.setItem("myTasks", JSON.stringify(tasks));
}

function dateKey(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
}

function parseTaskDate(task) {
    return new Date(`${task.date}T${task.time}:00`);
}

function isSameDay(a, b) {
    return dateKey(a) === dateKey(b);
}

function getStartOfWeek(date) {
    const result = new Date(date);
    result.setDate(result.getDate() - (result.getDay() + 1) % 7);
    result.setHours(0, 0, 0, 0);
    return result;
}

// ================================
// الإحصائيات
// ================================

function updateStats() {
    const completed = tasks.filter(t => t.completed).length;
    const pending = tasks.filter(t => !t.completed).length;

    const late = tasks.filter(t =>
        !t.completed && parseTaskDate(t) < new Date()
    ).length;

    $("totalTasks").textContent = tasks.length;
    $("completedTasks").textContent = completed;
    $("pendingTasks").textContent = pending;
    $("lateTasks").textContent = late;
}

// ================================
// عرض التقويم
// ================================

function renderCalendar() {
    const calendar = $("calendar");

    calendar.className = "calendar";
    calendar.innerHTML = "";

    if (currentView === "year") {
        renderYear(calendar);
    } else if (currentView === "month") {
        renderMonth(calendar);
    } else if (currentView === "week") {
        renderWeek(calendar);
    } else if (currentView === "day") {
        renderDay(calendar);
    }
}

function renderMonth(calendar) {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    $("calendarTitle").textContent =
        `${months[month]} ${year}`;

    const firstDay = new Date(year, month, 1);
    const start = (firstDay.getDay() + 1) % 7;
    const totalDays = new Date(year, month + 1, 0).getDate();

    calendar.style.gridTemplateColumns =
        "repeat(7, minmax(0, 1fr))";

    days.forEach(day => {
        const el = document.createElement("div");
        el.className = "day-name";
        el.textContent = day;
        calendar.appendChild(el);
    });

    for (let i = 0; i < start; i++) {
        const empty = document.createElement("div");
        empty.className = "calendar-day empty";
        calendar.appendChild(empty);
    }

    for (let day = 1; day <= totalDays; day++) {
        const date = new Date(year, month, day);
        const key = dateKey(date);

        const cell = document.createElement("div");
        cell.className = "calendar-day";

        if (isSameDay(date, new Date())) {
            cell.classList.add("today");
        }

        if (selectedDate === key) {
            cell.classList.add("selected");
        }

        const number = document.createElement("div");
        number.className = "day-number";
        number.textContent = day;
        cell.appendChild(number);

        const dayTasks = tasks.filter(t => t.date === key);

        dayTasks.slice(0, 3).forEach(task => {
            const item = document.createElement("div");
            item.className = "calendar-task";

            if (task.completed) item.classList.add("done");

            item.textContent = task.name;
            item.title = task.name;
            cell.appendChild(item);
        });

        if (dayTasks.length > 3) {
            const more = document.createElement("small");
            more.textContent = `+${dayTasks.length - 3} مهام`;
            cell.appendChild(more);
        }

        cell.addEventListener("click", () => {
            selectedDate = key;
            renderCalendar();
            renderTasks();
        });

        calendar.appendChild(cell);
    }
}

// ================================
// التقويم السنوي
// ================================

function renderYear(calendar) {
    calendar.className = "year-view";

    const year = currentDate.getFullYear();

    $("calendarTitle").textContent = `سنة ${year}`;

    months.forEach((month, index) => {
        const card = document.createElement("div");
        card.className = "month-card";

        const count = tasks.filter(t => {
            const date = new Date(t.date + "T00:00:00");
            return date.getFullYear() === year &&
                   date.getMonth() === index;
        }).length;

        card.innerHTML = `
            <strong>${month}</strong>
            <p>${count} مهمة</p>
        `;

        card.addEventListener("click", () => {
            currentDate = new Date(year, index, 1);
            currentView = "month";
            selectedDate = null;
            updateViewButtons();
            renderCalendar();
            renderTasks();
        });

        calendar.appendChild(card);
    });
}

// ================================
// التقويم الأسبوعي
// ================================

function renderWeek(calendar) {
    calendar.className = "week-view";

    const start = getStartOfWeek(currentDate);

    const end = new Date(start);
    end.setDate(start.getDate() + 6);

    $("calendarTitle").textContent =
        `${dateKey(start)} — ${dateKey(end)}`;

    for (let i = 0; i < 7; i++) {
        const date = new Date(start);
        date.setDate(start.getDate() + i);

        const key = dateKey(date);

        const column = document.createElement("div");
        column.className = "week-column";

        const heading = document.createElement("strong");
        heading.textContent =
            `${days[i]} ${date.getDate()}`;
        column.appendChild(heading);

        const dayTasks = tasks.filter(t => t.date === key);

        dayTasks.forEach(task => {
            const item = document.createElement("div");
            item.className = "calendar-task";
            if (task.completed) item.classList.add("done");
            item.textContent = `${task.time} ${task.name}`;
            column.appendChild(item);
        });

        column.addEventListener("click", () => {
            selectedDate = key;
            renderCalendar();
            renderTasks();
        });

        calendar.appendChild(column);
    }
}

// التقويم اليومي
function renderDay(calendar) {
    calendar.className = "day-view";

    const date = selectedDate
        ? new Date(selectedDate + "T00:00:00")
        : new Date(currentDate);

    $("calendarTitle").textContent =
        `مهام يوم ${date.toLocaleDateString("ar-SA")}`;

    const key = dateKey(date);

    const dayTasks = tasks
        .filter(t => t.date === key)
        .sort((a, b) => a.time.localeCompare(b.time));

    if (dayTasks.length === 0) {
        calendar.innerHTML =
            '<p class="empty-message">لا توجد مهام لهذا اليوم ✨</p>';
        return;
    }

    dayTasks.forEach(task => {
        const item = document.createElement("div");
        item.className = "day-task";

        item.innerHTML = `
            <div class="day-task-time">${task.time}</div>
            <div class="day-task-info"></div>
        `;

        const info = item.querySelector(".day-task-info");

        const name = document.createElement("strong");
        name.textContent = task.name;

        const description = document.createElement("p");
        description.textContent = task.description || "بدون وصف";

        const priority = document.createElement("small");
        priority.textContent =
            "الأهمية: " + priorityNames[task.priority];

        info.append(name, description, priority);

        if (task.completed) {
            item.classList.add("completed");
        }

        calendar.appendChild(item);
    });
}



// ================================
// التنقل بين الفترات
// ================================

$("prevBtn").addEventListener("click", () => {
    if (currentView === "month") {
        currentDate.setMonth(currentDate.getMonth() - 1);
    } else if (currentView === "week") {
        currentDate.setDate(currentDate.getDate() - 7);
    } else {
        currentDate.setFullYear(currentDate.getFullYear() - 1);
    }

    selectedDate = null;
    renderCalendar();
    renderTasks();
});

$("nextBtn").addEventListener("click", () => {
    if (currentView === "month") {
        currentDate.setMonth(currentDate.getMonth() + 1);
    } else if (currentView === "week") {
        currentDate.setDate(currentDate.getDate() + 7);
    } else {
        currentDate.setFullYear(currentDate.getFullYear() + 1);
    }

    selectedDate = null;
    renderCalendar();
    renderTasks();
});

// ================================
// تبديل طرق عرض التقويم
// ================================

function changeView(view) {
    currentView = view;
    selectedDate = null;
    updateViewButtons();
    renderCalendar();
    renderTasks();
}

function updateViewButtons() {
    document.querySelectorAll("[data-view]").forEach(btn => {
        btn.classList.toggle(
            "active",
            btn.dataset.view === currentView
        );
    });

    $("calendar").className = "calendar";
}

document.querySelectorAll("[data-view]").forEach(btn => {
    btn.addEventListener("click", () => {
        changeView(btn.dataset.view);
    });
});

// ================================
// نافذة إضافة المهام
// ================================

$("addTaskBtn").addEventListener("click", () => {
    $("taskModal").classList.add("show");
});

$("closeModal").addEventListener("click", closeModal);

$("taskModal").addEventListener("click", e => {
    if (e.target === $("taskModal")) closeModal();
});

function closeModal() {
    $("taskModal").classList.remove("show");
}

// ================================
// إضافة مهمة جديدة
// ================================

$("taskForm").addEventListener("submit", async e => {
    e.preventDefault();

    if (!("Notification" in window)) {
        alert("متصفحك لا يدعم إشعارات المهام.");
    } else if (Notification.permission === "default") {
        try {
            await Notification.requestPermission();
        } catch (error) {
            console.error(error);
        }
    }

    const task = {
        id: Date.now().toString(),
        name: $("taskName").value.trim(),
        description: $("taskDescription").value.trim(),
        date: $("taskDate").value,
        time: $("taskTime").value,
        priority: $("taskPriority").value,
        duration: Number($("taskDuration").value),
        durationUnit: $("durationUnit").value,
        completed: false,
        reminded: false
    };

    if (!task.name || !task.date || !task.time ||
        !task.duration || task.duration < 1) {
        alert("يرجى التأكد من إدخال جميع البيانات بشكل صحيح.");
        return;
    }

    if (parseTaskDate(task) <= new Date()) {
        alert("يرجى اختيار موعد تسليم في المستقبل.");
        return;
    }

    tasks.push(task);

    saveTasks();
    $("taskForm").reset();

    closeModal();
    selectedDate = null;

    updateStats();
    renderCalendar();
    renderTasks();
});

// ================================
// فلترة وعرض المهام
// ================================

function renderTasks() {
    const list = $("taskList");
    list.innerHTML = "";

    let filtered = [...tasks];

    const duration = $("durationFilter").value;
    const priority = $("priorityFilter").value;
    const sort = $("sortFilter").value;

    const now = new Date();

    const today = dateKey(now);
    const weekStart = getStartOfWeek(now);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 7);

    if (selectedDate) {
        filtered = filtered.filter(t => t.date === selectedDate);
    }

    if (duration === "today") {
        filtered = filtered.filter(t => t.date === today);
    }

    if (duration === "week") {
        filtered = filtered.filter(t => {
            const d = new Date(t.date + "T00:00:00");
            return d >= weekStart && d < weekEnd;
        });
    }

    if (duration === "month") {
        filtered = filtered.filter(t => {
            const d = new Date(t.date + "T00:00:00");

            return d.getMonth() === now.getMonth() &&
                   d.getFullYear() === now.getFullYear();
        });
    }

    if (duration === "overdue") {
        filtered = filtered.filter(t =>
            !t.completed && parseTaskDate(t) < now
        );
    }

    if (priority !== "all") {
        filtered = filtered.filter(t =>
            t.priority === priority
        );
    }

    filtered.sort((a, b) => {
        const difference =
            parseTaskDate(a) - parseTaskDate(b);

        return sort === "asc" ? difference : -difference;
    });

    if (filtered.length === 0) {
        list.innerHTML =
            '<p class="empty-message">لا توجد مهام هنا حالياً ✨</p>';
        return;
    }

    filtered.forEach(task => {
        const card = document.createElement("div");
        card.className = "task-card";

        if (task.completed) card.classList.add("completed");

        const info = document.createElement("div");
        info.className = "task-info";

        const name = document.createElement("div");
        name.className = "task-name";
        name.textContent = task.name;

        const description = document.createElement("p");
        description.textContent = task.description || "بدون وصف";

        const date = document.createElement("p");
        date.textContent =
            `📅 ${task.date} | ⏰ ${task.time}`;

        const durationText = document.createElement("p");
        durationText.textContent =
            `المدة: ${task.duration} ${
                task.durationUnit === "hours" ? "ساعة" : "يوم"
            }`;

        const priorityText = document.createElement("div");
        priorityText.className = `priority ${task.priority}`;
        priorityText.textContent =
            `الأهمية: ${priorityNames[task.priority]}`;

        info.append(name, description, date,
                    durationText, priorityText);

        const actions = document.createElement("div");
        actions.className = "task-actions";

        const complete = document.createElement("button");
        complete.textContent = task.completed ? "↩" : "✓";
        complete.title = "تغيير حالة المهمة";

        complete.addEventListener("click", () => {
            task.completed = !task.completed;
            saveTasks();
            refresh();
        });

        const remove = document.createElement("button");
        remove.textContent = "🗑";
        remove.className = "delete-btn";
        remove.title = "حذف المهمة";

        remove.addEventListener("click", () => {
            if (confirm("هل تريدين حذف هذه المهمة؟")) {
                tasks = tasks.filter(t => t.id !== task.id);
                saveTasks();
                refresh();
            }
        });

        actions.append(complete, remove);
        card.append(info, actions);
        list.appendChild(card);
    });
}

// ================================
// تحديث البيانات والواجهة
// ================================

function refresh() {
    saveTasks();
    updateStats();
    renderCalendar();
    renderTasks();
}

[
    "durationFilter",
    "priorityFilter",
    "sortFilter"
].forEach(id => {
    $(id).addEventListener("change", renderTasks);
});

// ================================
// منبه موعد التسليم
// ================================

function checkReminders() {
    const now = new Date();

    tasks.forEach(task => {
        const due = parseTaskDate(task);

        if (
            !task.completed &&
            !task.reminded &&
            due <= now
        ) {
            if (
                "Notification" in window &&
                Notification.permission === "granted"
            ) {
                new Notification("⏰ موعد تسليم المهمة!", {
                    body: `حان موعد تسليم: ${task.name}`,
                    tag: task.id
                });
            } else {
                alert(`⏰ حان موعد تسليم المهمة: ${task.name}`);
            }

            task.reminded = true;
            saveTasks();
        }
    });

    updateStats();
}

// التحقق من المواعيد كل 30 ثانية
setInterval(checkReminders, 30000);

// ================================
// تشغيل الموقع
// ================================

refresh();
checkReminders();