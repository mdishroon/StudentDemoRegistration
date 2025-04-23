// Load available demo time slots when page loads
document.addEventListener('DOMContentLoaded', async function() {
    await loadDemoTimeSlots();
    
    setupFormValidation();
});

async function loadDemoTimeSlots() {
    try {
        const demoTimeSelect = document.getElementById('demoTime');
        if (!demoTimeSelect) {
            console.error('Dropdown element not found');
            return;
        }

        // Clear previous options, keeping only the placeholder
        while (demoTimeSelect.options.length > 1) {
            demoTimeSelect.remove(1);
        }

        const response = await fetch('/api/demo-slots');
        console.log('Response status:', response.status); // Debugging
        if (!response.ok) throw new Error('Failed to fetch demo slots');

        const slots = await response.json();
        console.log('Fetched slots:', slots); // Debugging

        slots.forEach(slot => {
            const option = document.createElement('option');
            const dateTime = new Date(slot.time);

            // Format the date and time
            const date = dateTime.toLocaleDateString('en-US', { 
                weekday: 'short', 
                month: 'short', 
                day: 'numeric' 
            });

            const time = dateTime.toLocaleTimeString('en-US', { 
                hour: '2-digit', 
                minute: '2-digit'
            });

            // Show available spots
            const availableSpots = slot.capacity - slot.booked;
            const availabilityText = availableSpots > 0 
                ? `(${availableSpots} spots available)` 
                : '(FULL)';

            option.value = slot.id;
            option.text = `${date}, ${time} ${availabilityText}`;
            option.disabled = availableSpots <= 0;

            demoTimeSelect.appendChild(option);
        });
    } catch (err) {
        console.error('Error loading demo time slots:', err);
    }
}

function setupFormValidation() {
    const registrationForm = document.getElementById("registrationForm");
    if (!registrationForm) return; // Not on registration page
    
    // Set up form validation and submission
    registrationForm.addEventListener("submit", async function (e) {
        e.preventDefault();

        const form = e.target;
        const fullName = form.fullName.value.trim();
        const email = form.email.value.trim();
        const studentId = form.studentId.value.trim();
        const number = form.number.value.trim();
        const course = form.course.value;
        const demoTimeId = form.demoTime.value;
        const projectDescription = form.projectDescription.value.trim();
        const requirements = form.requirements?.value.trim() || '';
        const confirmation = form.confirmation.checked;

        // Validation
        if (!confirmation) {
            alert("You must confirm that you're prepared to give your demo.");
            return;
        }
        
        // Client-side validation
        const nameRegex = /^[A-Za-z]+(?:\s[A-Za-z]+)+$/;
        const idRegex = /^\d{8}$/;
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[A-Za-z]{2,}$/;
        const phoneRegex = /^\d{3}-\d{3}-\d{4}$/;
        
        if (!nameRegex.test(fullName)) {
            alert("Name must include first and last name using letters only");
            return;
        }
        if (!idRegex.test(studentId)) {
            alert("Student ID must be exactly 8 digits");
            return;
        }
        if (!emailRegex.test(email)) {
            alert("Invalid email format");
            return;
        }
        if (!phoneRegex.test(number)) {
            alert("Phone number must be in the format 999-999-9999");
            return;
        }

        // Prepare form data for submission
        const formData = new FormData();
        formData.append('fullName', fullName);
        formData.append('email', email);
        formData.append('studentId', studentId);
        formData.append('number', number);
        formData.append('course', course);
        formData.append('demoTimeId', demoTimeId);
        formData.append('projectDescription', projectDescription);
        formData.append('requirements', requirements);

        try {
            const response = await fetch("/api/students", {
                method: "POST",
                body: formData
            });

            const result = await response.json();

            if (response.ok) {
                document.getElementById("registrationForm").classList.add("hidden");
                document.getElementById("confirmationMessage").classList.remove("hidden");
            } else {
                alert("Error: " + result.error);
            }
        } catch (err) {
            console.error("Error submitting form:", err);
            alert("Submission failed. Try again later.");
        }
    });
}

// Set up the New Registration button
document.getElementById("newRegistrationBtn")?.addEventListener("click", () => {
    document.getElementById("confirmationMessage").classList.add("hidden");
    document.getElementById("registrationForm").classList.remove("hidden");
    document.getElementById("registrationForm").reset();
});