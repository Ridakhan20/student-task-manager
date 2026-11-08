const taskList = document.querySelector("#task-list");
const form = document.querySelector("#task-form");
const message = document.querySelector("#message");

function showMessage(text, isError = false) {
  message.textContent = text;
  message.style.color = isError ? "#b42318" : "#168052";
}

function updateCounts(tasks) {
  document.querySelector("#total-count").textContent = tasks.length;
  document.querySelector("#progress-count").textContent =
    tasks.filter(task => task.status === "In Progress").length;
  document.querySelector("#completed-count").textContent =
    tasks.filter(task => task.status === "Completed").length;
}

async function loadTasks() {
  try {
    const response = await fetch("/api/tasks");
    if (!response.ok) throw new Error("Unable to load tasks.");
    const tasks = await response.json();
    updateCounts(tasks);
    taskList.replaceChildren();

    if (tasks.length === 0) {
      const empty = document.createElement("p");
      empty.className = "muted";
      empty.textContent = "No tasks yet. Add your first task above.";
      taskList.append(empty);
      return;
    }

    tasks.forEach(task => {
      const card = document.createElement("article");
      card.className = "task";

      const details = document.createElement("div");
      const title = document.createElement("h3");
      title.textContent = task.title;
      const description = document.createElement("p");
      description.textContent = task.description || "No description";
      details.append(title, description);

      const actions = document.createElement("div");
      actions.className = "task-actions";

      const status = document.createElement("select");
      status.setAttribute("aria-label", `Status for ${task.title}`);
      ["Pending", "In Progress", "Completed"].forEach(value => {
        const option = document.createElement("option");
        option.value = value;
        option.textContent = value;
        option.selected = task.status === value;
        status.append(option);
      });
      status.addEventListener("change", () => updateTask(task.id, status.value));

      const remove = document.createElement("button");
      remove.className = "delete-button";
      remove.type = "button";
      remove.textContent = "Delete";
      remove.addEventListener("click", () => deleteTask(task.id));

      actions.append(status, remove);
      card.append(details, actions);
      taskList.append(card);
    });
  } catch (error) {
    taskList.textContent = error.message;
  }
}

async function updateTask(id, status) {
  try {
    const response = await fetch(`/api/tasks/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status })
    });
    if (!response.ok) throw new Error("Could not update task.");
    showMessage("Task status updated.");
    await loadTasks();
  } catch (error) {
    showMessage(error.message, true);
  }
}

async function deleteTask(id) {
  if (!confirm("Delete this task?")) return;
  try {
    const response = await fetch(`/api/tasks/${id}`, { method: "DELETE" });
    if (!response.ok) throw new Error("Could not delete task.");
    showMessage("Task deleted.");
    await loadTasks();
  } catch (error) {
    showMessage(error.message, true);
  }
}

form.addEventListener("submit", async event => {
  event.preventDefault();
  const formData = new FormData(form);
  const payload = {
    title: formData.get("title"),
    description: formData.get("description")
  };

  try {
    const response = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Could not add task.");
    form.reset();
    showMessage("Task added and saved to PostgreSQL.");
    await loadTasks();
  } catch (error) {
    showMessage(error.message, true);
  }
});

document.querySelector("#refresh-button").addEventListener("click", loadTasks);
loadTasks();
