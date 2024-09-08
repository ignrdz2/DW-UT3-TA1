const addTaskButton = document.getElementById('addTaskBtn');
const taskModal = document.getElementById('taskModal');
const closeModalButton = document.querySelector('.modal-background');
const cancelTaskButton = document.getElementById('cancelTaskBtn');
const taskForm = document.getElementById('taskForm');
const toggleModeBtn = document.getElementById('toggleModeBtn');
const serverURL = "http://localhost:3000/api/tasks/";

// Mapa de conversiones de valores a nombres visibles
const userMap = {
    "Persona1": "Juan",
    "Persona2": "Diego",
    "Persona3": "Álvaro"
};

// Columnas de tareas
const taskColumns = {
    backlog: document.getElementById('backlog').querySelector('.tasks'),
    todo: document.getElementById('todo').querySelector('.tasks'),
    'in-progress': document.getElementById('in-progress').querySelector('.tasks'),
    blocked: document.getElementById('blocked').querySelector('.tasks'),
    done: document.getElementById('done').querySelector('.tasks')
};

let currentTaskId = null; // Variable para almacenar la tarea actual en edición

// Función para alternar entre modos oscuro y claro
toggleModeBtn.addEventListener('click', toggleMode);
function toggleMode() {
    let currentMode = document.documentElement.getAttribute('data-theme');
    if (currentMode === 'light') {
        document.documentElement.setAttribute('data-theme', 'dark');
    } else {
        document.documentElement.setAttribute('data-theme', 'light');
    }
}

// Función para cambiar el fondo de la columna
backgroundSelector.addEventListener('change', changeBackground);
function changeBackground() {
    let selectedBackground = document.getElementById("backgroundSelector").value;
    if (selectedBackground === "Default") {
        document.getElementById("columnsContainer").style.backgroundImage = "";
    } else {
        document.getElementById("columnsContainer").style.backgroundImage = "url('" + selectedBackground + "')";
    }
}

// Modal - Funciones para abrir y cerrar el modal
function openModal() {
    taskModal.classList.add('is-active');
    taskForm.reset();  // Limpiar el formulario cuando se abre el modal
}

function closeModal() {
    taskModal.classList.remove('is-active');
    taskForm.reset();  // Limpiar el formulario cuando se cierra el modal
    document.querySelector('.modal-card-title').textContent = 'Tarea'; // Resetear el título
    currentTaskId = null; // Resetear el ID para nuevas tareas
}

addTaskButton.addEventListener('click', openModal);
closeModalButton.addEventListener('click', closeModal);
cancelTaskButton.addEventListener('click', closeModal);

// Función para abrir el modal de edición de tarea
function openEditModal(taskId) {
    currentTaskId = taskId; // Almacena el ID de la tarea que se está editando
    const taskElement = document.querySelector(`[data-id='${taskId}']`);

    if (!taskElement) {
        console.error("No se encontró el elemento de la tarea con ID:", taskId);
        return;
    }

    // Verificar que todos los elementos existen antes de acceder a sus propiedades
    const titleElement = taskElement.querySelector('h3');
    const descriptionElement = taskElement.querySelector('.description');
    const assignedElement = taskElement.querySelector('.details p:first-child');
    const priorityElement = taskElement.querySelector('.priority');
    const deadlineElement = taskElement.querySelector('.deadline');

    if (titleElement && descriptionElement && assignedElement && priorityElement && deadlineElement) {
        // Cargar la información de la tarea en los campos del formulario
        taskForm['taskTitle'].value = titleElement.textContent;
        taskForm['taskDescription'].value = descriptionElement.textContent;
        taskForm['taskAssigned'].value = Object.keys(userMap).find(key => userMap[key] === assignedElement.textContent.split(': ')[1]) || assignedElement.textContent.split(': ')[1];
        taskForm['taskPriority'].value = priorityElement.textContent.split(': ')[1];
        taskForm['taskStatus'].value = taskElement.closest('.column').id;
        taskForm['taskDeadline'].value = deadlineElement.textContent.split(': ')[1];
    } else {
        console.error("Error al cargar la información de la tarea. Verifica los selectores.");
        return;
    }

    // Cambiar el título del modal para indicar que es una edición
    document.querySelector('.modal-card-title').textContent = 'Editar Tarea';

    // Abrir el modal
    taskModal.classList.add('is-active');
}

// Crear elemento de tarea en el DOM
function createTaskElement(title, description, assigned, priority, deadline, status, id) {
    const taskElement = document.createElement('div');
    taskElement.classList.add('box', 'task');

    // Asignar clases de color según la prioridad
    const priorityClass = {
        'Low': 'priority-low',
        'Medium': 'priority-medium',
        'High': 'priority-high'
    }[priority] || 'priority-low';

    taskElement.classList.add(priorityClass);
    taskElement.dataset.id = id;
    taskElement.draggable = true;

    // Definir la imagen de perfil según el usuario asignado
    const profilePics = {
        'Persona1': '1.jpg',
        'Persona2': '3.jpg',
        'Persona3': '2.jpg'
    };
    const profilePic = profilePics[assigned] || '2.jpg';
    const assignedName = userMap[assigned] || assigned;

    taskElement.innerHTML = `
        <div class="task-header">
            <img src="${profilePic}" alt="${assignedName}" class="profile-pic">
            <div class="task-title">
                <h3>${title}</h3>
                <p class="description">${description}</p>
            </div>
        </div>
        <div class="details">
            <p>
                <i class="fa-solid fa-user"></i>
                <strong>Asignado:</strong> ${assignedName}
            </p>
            <p class="priority ${priority.toLowerCase()}">
                <i class="fa-solid fa-tag"></i>
                <strong>Prioridad:</strong> ${priority}
            </p>
        </div>
        <p class="deadline">
            <i class="fa-solid fa-clock"></i>
            <strong>Fecha límite:</strong> ${deadline}
        </p>
    `;

    // Evento de arrastrar (dragstart)
    taskElement.addEventListener('dragstart', function(event) {
        event.dataTransfer.setData('text/plain', id);
    });

    // Evento de clic para editar la tarea
    taskElement.addEventListener('click', function() {
        openEditModal(id);
    });

    return taskElement;
}

// Obtener todas las tareas y renderizarlas
async function fetchTasks() {
    try {
        const response = await fetch(serverURL);
        const tasks = await response.json();
        console.log(tasks);
        clearAllColumns();  // Limpia todas las columnas antes de renderizar las tareas
        renderTasks(tasks);
    } catch (error) {
        console.error('Error obteniendo tareas: ', error);
    }
}

// Limpiar todas las columnas
function clearAllColumns() {
    Object.values(taskColumns).forEach(column => {
        column.innerHTML = '';  // Elimina todas las tareas existentes de cada columna
    });
}

// Renderizar tareas en el DOM
function renderTasks(tasks) {
    tasks.forEach(task => {
        const taskElement = createTaskElement(
            task.title,
            task.description,
            task.assignedTo,
            task.priority,
            task.endDate,
            task.status,
            task.id
        );
        const column = taskColumns[task.status.toLowerCase().replace(' ', '-')];
        if (column) {
            column.appendChild(taskElement);  // Agrega la tarea solo a la columna correspondiente
        } else {
            console.error(`Column for status "${task.status}" not found.`);
        }
    });
}

// POST - Añadir nueva tarea
async function addTask(task) {
    try {
        const response = await fetch(serverURL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(task)
        });
        if (!response.ok) {
            throw new Error('Error en la solicitud POST');
        }
        const newTask = await response.json();
        console.log('Task added:', newTask);
        fetchTasks();  // Refrescar las tareas después de agregar
    } catch (error) {
        console.error('Error adding task:', error);
    }
}

// PATCH - Actualizar tarea existente
async function updateTask(id, title, description, assigned, priority, deadline, status) {
    if (!id) {
        console.error('No se ha proporcionado un ID de tarea válido para actualizar.');
        return;
    }

    const updatedTask = {
        title: title,
        description: description,
        assignedTo: assigned,
        priority: priority,
        endDate: deadline,
        status: status
    };

    try {
        const response = await fetch(`${serverURL}${id}`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(updatedTask)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        console.log("Task updated successfully:", result);
        fetchTasks();  // Refrescar las tareas después de actualizar

    } catch (error) {
        console.error("Error updating task:", error);
    }
}

// Actualizar el DOM tras actualizar una tarea
function updateTaskInDOM(id, title, description, assigned, priority, deadline, status) {
    const taskElement = document.querySelector(`[data-id='${id}']`);

    if (taskElement) {
        taskElement.querySelector('h3').textContent = title;
        taskElement.querySelector('.description').textContent = description;
        taskElement.querySelector('.details p:first-child').innerHTML = `<i class="fa-solid fa-user"></i><strong>Asignado:</strong> ${userMap[assigned] || assigned}`;
        taskElement.querySelector('.priority').innerHTML = `<i class="fa-solid fa-tag"></i><strong>Prioridad:</strong> ${priority}`;
        taskElement.querySelector('.priority').className = `priority ${priority.toLowerCase()}`;
        taskElement.querySelector('.deadline').innerHTML = `<i class="fa-solid fa-clock"></i><strong>Fecha límite:</strong> ${deadline}`;

        // Mover la tarea a la nueva columna si el estado ha cambiado
        const currentColumn = taskElement.closest('.tasks');
        const newColumn = taskColumns[status.toLowerCase().replace(' ', '-')];
        if (currentColumn !== newColumn) {
            newColumn.appendChild(taskElement);
        }
    } else {
        console.error("No se pudo encontrar la tarea en el DOM para actualizarla.");
    }
}

// Eliminar tarea
async function deleteTask(id) {
    try {
        const response = await fetch(`${serverURL}${id}`, {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json"
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        console.log("Task deleted successfully.");
        deleteTaskFromDOM(id);

    } catch (error) {
        console.error("Error deleting task:", error);
    }
}

// Eliminar tarea del DOM
function deleteTaskFromDOM(id) {
    const taskElement = document.querySelector(`[data-id='${id}']`);
    if (taskElement) {
        taskElement.remove();
        console.log("Task removed from the DOM.");
    } else {
        console.error("No se pudo encontrar la tarea en el DOM para eliminarla.");
    }
}

// Drag and Drop
Object.keys(taskColumns).forEach(status => {
    const column = taskColumns[status];

    column.addEventListener('dragover', function(event) {
        event.preventDefault();
    });

    column.addEventListener('drop', function(event) {
        event.preventDefault();

        const taskId = event.dataTransfer.getData('text/plain');
        const taskElement = document.querySelector(`[data-id='${taskId}']`);

        if (!taskId || !taskElement) {
            console.error('Error al obtener el ID o el elemento de la tarea.');
            return;
        }

        column.appendChild(taskElement);
        updateTaskStatus(taskId, status); // Actualizar el estado de la tarea en el backend
    });
});

// Actualizar estado de la tarea al arrastrar y soltar
async function updateTaskStatus(taskId, newStatus) {
    if (!taskId) {
        console.error('No se ha proporcionado un ID de tarea válido.');
        return;
    }

    try {
        const response = await fetch(`${serverURL}${taskId}`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ status: newStatus })  // Solo actualizar el campo "status"
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        console.log("Task status updated successfully:", result);

    } catch (error) {
        console.error("Error updating task status:", error);
    }
}

// Inicializar la carga de tareas
document.addEventListener('DOMContentLoaded', fetchTasks);

// Guardar tarea desde el formulario
document.getElementById('saveTaskBtn').addEventListener('click', async function(event) {
    event.preventDefault();

    // Obtener valores del formulario
    const title = taskForm['taskTitle'].value;
    const description = taskForm['taskDescription'].value;
    const assigned = taskForm['taskAssigned'].value;
    const priority = taskForm['taskPriority'].value;
    const status = taskForm['taskStatus'].value;
    const deadline = taskForm['taskDeadline'].value;

    // Validar los campos del formulario
    if (!title || !description || !assigned || !priority || !status || !deadline) {
        alert("Por favor, completa todos los campos.");
        return;
    }

    if (currentTaskId) {
        // Actualizar tarea existente
        await updateTask(currentTaskId, title, description, assigned, priority, deadline, status);
    } else {
        // Crear una nueva tarea
        const newTask = {
            title: title,
            description: description,
            assignedTo: assigned,
            endDate: deadline,
            status: status,
            priority: priority,
            comments: []
        };
        await addTask(newTask);
    }

    // Cerrar modal y reiniciar formulario
    closeModal();
});
