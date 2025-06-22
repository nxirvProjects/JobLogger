// DOM elements
const companyInput = document.getElementById("companyInput");
const titleInput = document.getElementById("titleInput");
const addJobBtn = document.getElementById("addJobBtn");
const jobsList = document.getElementById("jobsList");
const jobCount = document.getElementById("jobCount");
const clearAllBtn = document.getElementById("clearAllBtn");
const downloadCsvBtn = document.getElementById("downloadCsvBtn");
const successMessage = document.getElementById("successMessage");

// Load jobs from storage and display them
function loadJobs() {
  chrome.storage.local.get(["jobs"], (data) => {
    const jobs = data.jobs || [];
    displayJobs(jobs);
    updateJobCount(jobs.length);
  });
}

// Display jobs in the list
function displayJobs(jobs) {
  if (jobs.length === 0) {
    jobsList.innerHTML = '<div class="empty-state">No jobs logged yet</div>';
    return;
  }

  // Sort jobs by date (newest first)
  const sortedJobs = jobs.sort((a, b) => new Date(b.date) - new Date(a.date));
  
  jobsList.innerHTML = sortedJobs.map((job, index) => `
    <div class="job-item">
      <div class="job-info">
        <div class="job-company">${escapeHtml(job.company)}</div>
        <div class="job-title">${escapeHtml(job.title)}</div>
        <div class="job-date">${formatDate(job.date)}</div>
      </div>
      <button class="delete-btn" onclick="deleteJob(${index})">×</button>
    </div>
  `).join('');
}

// Update job count display
function updateJobCount(count) {
  jobCount.textContent = count;
}

// Add a new job
function addJob() {
  const company = companyInput.value.trim();
  const title = titleInput.value.trim();

  if (!company || !title) {
    alert("Please fill in both company and job title fields.");
    return;
  }

  const newJob = {
    company,
    title,
    date: new Date().toISOString()
  };

  chrome.storage.local.get(["jobs"], (data) => {
    const jobs = data.jobs || [];
    jobs.push(newJob);
    
    chrome.storage.local.set({ jobs }, () => {
      displayJobs(jobs);
      updateJobCount(jobs.length);
      showSuccessMessage();
      clearInputs();
    });
  });
}

// Delete a job by index
function deleteJob(index) {
  chrome.storage.local.get(["jobs"], (data) => {
    const jobs = data.jobs || [];
    jobs.splice(index, 1);
    
    chrome.storage.local.set({ jobs }, () => {
      displayJobs(jobs);
      updateJobCount(jobs.length);
    });
  });
}

// Clear all jobs
function clearAllJobs() {
  if (confirm("Are you sure you want to clear all logged jobs?")) {
    chrome.storage.local.set({ jobs: [] }, () => {
      displayJobs([]);
      updateJobCount(0);
    });
  }
}

// Show success message
function showSuccessMessage() {
  successMessage.style.display = "block";
  setTimeout(() => {
    successMessage.style.display = "none";
    successMessage.textContent = "Job logged successfully!";
  }, 3000);
}

// Clear input fields
function clearInputs() {
  companyInput.value = "";
  titleInput.value = "";
  companyInput.focus();
}

// Utility functions
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// Download jobs as CSV
function downloadCSV() {
  chrome.storage.local.get(["jobs"], (data) => {
    const jobs = data.jobs || [];
    
    if (jobs.length === 0) {
      alert("No jobs to download.");
      return;
    }

    // Create CSV content
    const headers = ["Company", "Job Title", "Date Logged"];
    const csvContent = [
      headers.join(","),
      ...jobs.map(job => [
        `"${job.company.replace(/"/g, '""')}"`,
        `"${job.title.replace(/"/g, '""')}"`,
        `"${formatDateForCSV(job.date)}"`
      ].join(","))
    ].join("\n");

    // Create and download file
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `job_applications_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Show success message
    successMessage.textContent = `CSV downloaded with ${jobs.length} jobs!`;
  });
}

// Format date for CSV (more readable format)
function formatDateForCSV(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit',
    second: '2-digit'
  });
}

// Event listeners
addJobBtn.addEventListener("click", addJob);

clearAllBtn.addEventListener("click", clearAllJobs);

downloadCsvBtn.addEventListener("click", downloadCSV);

// Allow Enter key to submit
companyInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    titleInput.focus();
  }
});

titleInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    addJob();
  }
});

// Load jobs when popup opens
document.addEventListener("DOMContentLoaded", loadJobs); 