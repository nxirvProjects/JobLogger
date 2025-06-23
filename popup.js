// DOM elements
const companyInput = document.getElementById("companyInput");
const titleInput = document.getElementById("titleInput");
const addJobBtn = document.getElementById("addJobBtn");
const jobsList = document.getElementById("jobsList");
const jobCount = document.getElementById("jobCount");
const clearAllBtn = document.getElementById("clearAllBtn");
const downloadCsvBtn = document.getElementById("downloadCsvBtn");
const autoDetectionToggle = document.getElementById("autoDetectionToggle");
const successMessage = document.getElementById("successMessage");
const menuBtn = document.getElementById("menuBtn");
const dropdownMenu = document.getElementById("dropdownMenu");
const uploadCsvBtn = document.getElementById("uploadCsvBtn");
const csvFileInput = document.getElementById("csvFileInput");

// Load jobs from storage and display them
function loadJobs() {
  chrome.storage.local.get(["jobs", "autoDetectionEnabled"], (data) => {
    const jobs = data.jobs || [];
    displayJobs(jobs);
    updateJobCount(jobs.length);
    
    // Set auto-detection toggle state
    autoDetectionToggle.checked = data.autoDetectionEnabled !== false; // Default to true
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
  
  jobsList.innerHTML = sortedJobs.map((job) => `
    <div class="job-item">
      <div class="job-info">
        <div class="job-company">${escapeHtml(job.company)}</div>
        <div class="job-title">${escapeHtml(job.title)}</div>
        <div class="job-date">${formatDate(job.date)}</div>
      </div>
      <button class="delete-btn" onclick="deleteJob('${job.id}')">×</button>
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
    id: Date.now().toString() + Math.random().toString(36).substr(2, 9), // unique id
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

// Delete a job by id (unique identifier)
function deleteJob(jobId) {
  chrome.storage.local.get(["jobs"], (data) => {
    const jobs = data.jobs || [];
    const jobIndex = jobs.findIndex(job => job.id === jobId);
    
    if (jobIndex !== -1) {
      jobs.splice(jobIndex, 1);
      
      chrome.storage.local.set({ jobs }, () => {
        displayJobs(jobs);
        updateJobCount(jobs.length);
      });
    }
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

// Toggle auto-detection
function toggleAutoDetection() {
  const enabled = autoDetectionToggle.checked;
  chrome.storage.local.set({ autoDetectionEnabled: enabled }, () => {
    successMessage.textContent = enabled ? "Auto-detection enabled" : "Auto-detection disabled";
    showSuccessMessage();
  });
}

// Upload and process CSV file
function handleCsvUpload(event) {
  const file = event.target.files[0];
  if (!file) {
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    const text = e.target.result;
    importJobsFromCSV(text);
  };
  reader.onerror = (e) => {
    alert("Error reading file.");
    console.error("FileReader error:", e);
  };
  reader.readAsText(file);
  
  // Reset the file input so the user can upload the same file again
  csvFileInput.value = "";
}

function importJobsFromCSV(csvText) {
  const lines = csvText.trim().split(/\r?\n/);
  if (lines.length < 2) {
    alert("CSV file is empty or has no data rows.");
    return;
  }
  
  const header = lines[0].toLowerCase().split(',').map(h => h.trim().replace(/"/g, ''));
  const companyIndex = header.indexOf("company");
  const titleIndex = header.indexOf("job title");
  const dateIndex = header.indexOf("date logged");

  if (companyIndex === -1 || titleIndex === -1) {
    alert("CSV file must have 'Company' and 'Job Title' headers.");
    return;
  }

  const newJobs = [];
  for (let i = 1; i < lines.length; i++) {
    const data = lines[i].split(',').map(d => d.trim().replace(/"/g, ''));
    
    const company = data[companyIndex];
    const title = data[titleIndex];
    let date = new Date().toISOString(); // Default to now

    if (dateIndex !== -1 && data[dateIndex]) {
        const parsedDate = new Date(data[dateIndex]);
        if (!isNaN(parsedDate)) {
            date = parsedDate.toISOString();
        }
    }

    if (company && title) {
      newJobs.push({ company, title, date });
    }
  }

  if (newJobs.length === 0) {
    alert("No valid jobs found in the CSV file.");
    return;
  }

  chrome.storage.local.get(["jobs"], (result) => {
    const existingJobs = result.jobs || [];
    const existingJobSignatures = new Set(existingJobs.map(j => `${j.company.toLowerCase()}|${j.title.toLowerCase()}`));
    
    const uniqueNewJobs = newJobs.filter(job => {
        const signature = `${job.company.toLowerCase()}|${job.title.toLowerCase()}`;
        return !existingJobSignatures.has(signature);
    });

    const finalJobs = [...existingJobs, ...uniqueNewJobs];
    chrome.storage.local.set({ jobs: finalJobs }, () => {
        const importedCount = uniqueNewJobs.length;
        const skippedCount = newJobs.length - importedCount;
        successMessage.textContent = `Imported ${importedCount} jobs!`;
        if (skippedCount > 0) {
            successMessage.textContent += ` (${skippedCount} duplicates skipped)`;
        }
        showSuccessMessage();
        loadJobs();
    });
  });
}

// Event listeners
addJobBtn.addEventListener("click", addJob);

clearAllBtn.addEventListener("click", clearAllJobs);

downloadCsvBtn.addEventListener("click", downloadCSV);

uploadCsvBtn.addEventListener("click", () => {
  csvFileInput.click();
});

csvFileInput.addEventListener("change", handleCsvUpload);

autoDetectionToggle.addEventListener("change", toggleAutoDetection);

menuBtn.addEventListener("click", (event) => {
  event.stopPropagation();
  dropdownMenu.classList.toggle("show");
});

// Close dropdown if user clicks outside
window.addEventListener("click", (event) => {
  if (dropdownMenu.classList.contains("show")) {
    dropdownMenu.classList.remove("show");
  }
});

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

window.deleteJob = deleteJob; 