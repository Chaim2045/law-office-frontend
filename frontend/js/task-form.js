// ================================================
// 📋 Task Form Handler
// ================================================

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('task-form');
    const resultDiv = document.getElementById('result');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        await submitTask();
    });
});

async function submitTask() {
    const form = document.getElementById('task-form');
    const resultDiv = document.getElementById('result');

    // Collect form data
    const formData = new FormData(form);
    const assignedToSelect = document.getElementById('assigned-to');
    const selectedOption = assignedToSelect.options[assignedToSelect.selectedIndex];

    const taskData = {
        title: formData.get('title'),
        description: formData.get('description') || null,
        category: formData.get('category'),
        assigned_to: formData.get('assigned-to'),
        assigned_to_email: selectedOption.dataset.email,
        created_by: 'מערכת', // TODO: Get from login
        created_by_email: 'office@ghlawoffice.co.il',
        due_date: formData.get('due-date') || null,
        priority: formData.get('priority'),
        notes: formData.get('notes') || null
    };

    // Show loading
    showResult('⏳ שולח משימה...', 'info');

    try {
        const startTime = performance.now();

        const response = await fetch(`${window.API_URL}/api/tasks`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(taskData)
        });

        const endTime = performance.now();
        const responseTime = Math.round(endTime - startTime);

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        showResult(
            `✅ המשימה נוצרה בהצלחה!<br>
            📋 מזהה: <strong>${result.task_id}</strong><br>
            ⚡ זמן תגובה: ${responseTime}ms`,
            'success'
        );

            // Reset form
            form.reset();

            // Auto-hide after 5 seconds
            setTimeout(() => {
                resultDiv.style.display = 'none';
            }, 5000);

        } else {
            throw new Error(result.message || 'שגיאה לא ידועה');
        }

    } catch (error) {
        console.error('❌ Error:', error);
        showResult(`❌ שגיאה: ${error.message}`, 'error');
    }
}

function showResult(message, type) {
    const resultDiv = document.getElementById('result');
    resultDiv.innerHTML = message;
    resultDiv.className = `result result-${type}`;
    resultDiv.style.display = 'block';
}
