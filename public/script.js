// Load available demo time slots when page loads
document.addEventListener('DOMContentLoaded', async function () {
    await loadDemoTimeSlots();
    setupFormValidation();
  });
  
  async function loadDemoTimeSlots() {
    try {
      const demoTimeSelect = document.getElementById('demoTime');
      if (!demoTimeSelect) return console.error('Dropdown element not found');
  
      while (demoTimeSelect.options.length > 1) {
        demoTimeSelect.remove(1);
      }
  
      const response = await fetch('/api/demo-slots');
      if (!response.ok) throw new Error('Failed to fetch demo slots');
  
      const slots = await response.json();
      slots.forEach(slot => {
        const option = document.createElement('option');
        const dateTime = new Date(slot.time);
  
        const date = dateTime.toLocaleDateString('en-US', {
          weekday: 'short', month: 'short', day: 'numeric'
        });
  
        const time = dateTime.toLocaleTimeString('en-US', {
          hour: '2-digit', minute: '2-digit'
        });
  
        const availableSpots = slot.capacity - slot.current_count;
        const availabilityText = availableSpots > 0
          ? `(${availableSpots} spots available)`
          : '(FULL)';
  
        option.value = slot.id;
        option.text = `${date}, ${time} ${availabilityText}`;
        option.disabled = !slot.available;
  
        if (!slot.available) {
          option.text += ' – FULL';
        }
  
        demoTimeSelect.appendChild(option);
      });
    } catch (err) {
      console.error('Error loading demo time slots:', err);
    }
  }
  
  function setupFormValidation() {
    const registrationForm = document.getElementById("registrationForm");
    if (!registrationForm) return;
  
    registrationForm.addEventListener("submit", async function (e) {
      e.preventDefault();
  
      const form = e.target;
      const fullName = form.fullName.value.trim();
      const email = form.email.value.trim();
      const studentId = form.studentId.value.trim();
      const number = form.number.value.trim();
      const course = form.course?.value || '';
      const demoTime = form.demoTime.value;
      const projectDescription = form.projectDescription.value.trim();
      const requirements = form.requirements?.value.trim() || '';
      const confirmation = form.confirmation.checked;
  
      if (!confirmation) return alert("You must confirm that you're prepared to give your demo.");
  
      const nameRegex = /^[A-Za-z]+(?:\s[A-Za-z]+)+$/;
      const idRegex = /^\d{8}$/;
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[A-Za-z]{2,}$/;
      const phoneRegex = /^\d{3}-\d{3}-\d{4}$/;
  
      if (!nameRegex.test(fullName)) return alert("Name must include first and last name using letters only");
      if (!idRegex.test(studentId)) return alert("Student ID must be exactly 8 digits");
      if (!emailRegex.test(email)) return alert("Invalid email format");
      if (!phoneRegex.test(number)) return alert("Phone number must be in the format 999-999-9999");
  
      const formData = new FormData();
      formData.append('fullName', fullName);
      formData.append('email', email);
      formData.append('studentId', studentId);
      formData.append('number', number);
      formData.append('course', course);
      formData.append('demoTime', demoTime);
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
  
  document.getElementById("newRegistrationBtn")?.addEventListener("click", () => {
    document.getElementById("confirmationMessage").classList.add("hidden");
    document.getElementById("registrationForm").classList.remove("hidden");
    document.getElementById("registrationForm").reset();
  });
  