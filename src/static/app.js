document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // small helper to avoid inserting raw HTML from server data
  function escapeHtml(unsafe) {
    return String(unsafe)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";
      // Clear activity select and re-add default option
      activitySelect.innerHTML = '';
      const defaultOption = document.createElement('option');
      defaultOption.value = '';
      defaultOption.textContent = '-- Select an activity --';
      activitySelect.appendChild(defaultOption);

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        // Build participants section as a bulleted list (or placeholder if none)
        const participants = details.participants || [];
        const participantsHtml =
          participants.length > 0
            ? `<ul class="participants-list">${participants
                .map((p) =>
                  `<li class="participant-item">${escapeHtml(p)} <button class="delete-participant" data-activity="${escapeHtml(name)}" data-email="${escapeHtml(p)}" title="Remove participant">✕</button></li>`
                )
                .join("")}</ul>`
            : `<p class="no-participants"><em>No participants yet</em></p>`;

        activityCard.innerHTML = `
          <h4>${escapeHtml(name)}</h4>
          <p>${escapeHtml(details.description)}</p>
          <p><strong>Schedule:</strong> ${escapeHtml(details.schedule)}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          <div class="participants-section">
            <p><strong>Participants:</strong></p>
            ${participantsHtml}
          </div>
        `;

        activitiesList.appendChild(activityCard);

          // Attach click handlers for delete buttons (delegation approach)
          activityCard.querySelectorAll('.delete-participant').forEach((btn) => {
            btn.addEventListener('click', async (e) => {
              const activityName = btn.getAttribute('data-activity');
              const email = btn.getAttribute('data-email');

              try {
                const resp = await fetch(`/activities/${encodeURIComponent(activityName)}/participants?email=${encodeURIComponent(email)}`, {
                  method: 'DELETE',
                });

                const result = await resp.json();

                if (resp.ok) {
                  // refresh activities so availability and lists update
                  fetchActivities();
                } else {
                  console.error('Failed to remove participant:', result);
                  alert(result.detail || 'Failed to remove participant');
                }
              } catch (err) {
                console.error('Error removing participant:', err);
                alert('Failed to remove participant.');
              }
            });
          });

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        // Refresh activities so the new participant shows up immediately
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
