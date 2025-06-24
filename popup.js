document.addEventListener("DOMContentLoaded", function() {
  // DOM elements
  const companyInput = document.getElementById("companyInput");
  const titleInput = document.getElementById("titleInput");
  const addJobBtn = document.getElementById("addJobBtn");
  const jobsList = document.getElementById("jobsList");
  const jobCount = document.getElementById("jobCount");
  const clearAllBtn = document.getElementById("clearAllBtn");
  const downloadCsvBtn = document.getElementById("downloadCsvBtn");
  const successMessage = document.getElementById("successMessage");
  const menuBtn = document.getElementById("menuBtn");
  const dropdownMenu = document.getElementById("dropdownMenu");
  const uploadCsvBtn = document.getElementById("uploadCsvBtn");
  const csvFileInput = document.getElementById("csvFileInput");
  const quickLinksBtn = document.getElementById("quickLinksBtn");
  const quickLinksSection = document.getElementById("quickLinksSection");
  const linkForm = document.getElementById('linkForm');
  const linkLabel = document.getElementById('linkLabel');
  const linkUrl = document.getElementById('linkUrl');
  const linksList = document.getElementById('linksList');
  const backToJobsBtn = document.getElementById('backToJobsBtn');
  const modalContent = document.querySelector('.modal-content');
  const modalHeader = document.querySelector('.modal-header');

  // Load jobs from storage and display them
  loadJobs();

  addJobBtn.addEventListener("click", addJob);
  clearAllBtn.addEventListener("click", clearAllJobs);
  downloadCsvBtn.addEventListener("click", downloadCSV);
  uploadCsvBtn.addEventListener("click", () => { csvFileInput.click(); });
  csvFileInput.addEventListener("change", handleCsvUpload);
  menuBtn.addEventListener("click", (event) => {
    event.stopPropagation();
    dropdownMenu.classList.toggle("show");
  });
  window.addEventListener("click", (event) => {
    if (dropdownMenu.classList.contains("show")) {
      dropdownMenu.classList.remove("show");
    }
  });
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
  if (quickLinksBtn) {
    quickLinksBtn.addEventListener("click", () => {
      modalContent.style.display = 'none';
      quickLinksSection.style.display = 'block';
      quickLinksBtn.style.display = 'none';
      if (modalHeader) modalHeader.style.display = 'none';
      loadLinks();
    });
  }
  if (backToJobsBtn) {
    backToJobsBtn.addEventListener('click', () => {
      document.getElementById('quickLinksSection').style.display = 'none';
      modalContent.style.display = 'block';
      quickLinksBtn.style.display = 'block';
      if (modalHeader) modalHeader.style.display = 'flex';
    });
  }
  if (linkForm) {
    linkForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const label = linkLabel.value;
      const url = linkUrl.value;
      if (!url.trim()) return;
      addLink(label, url);
      linkLabel.value = '';
      linkUrl.value = '';
      linkUrl.focus();
    });
  }
});

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
  
  jobsList.innerHTML = sortedJobs.map((job) => `
    <div class="job-item">
      <div class="job-info">
        <div class="job-company">${escapeHtml(job.company)}</div>
        <div class="job-title">${escapeHtml(job.title)}</div>
        <div class="job-date">${formatDate(job.date)}</div>
      </div>
      <button class="delete-btn" data-job-id="${job.id}">×</button>
    </div>
  `).join('');

  // Add event listeners for delete buttons (CSP-compliant)
  jobsList.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const jobId = btn.getAttribute('data-job-id');
      deleteJob(jobId);
    });
  });
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
      newJobs.push({
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        company,
        title,
        date
      });
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

function loadLinks() {
  chrome.storage.local.get(['quickLinks'], (data) => {
    const links = data.quickLinks || [];
    renderLinks(links);
  });
}

function renderLinks(links) {
  if (links.length === 0) {
    linksList.innerHTML = '<div style="color: #71717a; text-align: center;">No links saved yet.</div>';
    return;
  }
  linksList.innerHTML = links.map(link => `
    <div class="link-item" style="display: flex; align-items: center; justify-content: space-between; padding: 0.5rem 0.25rem 0.5rem 0.5rem; border-bottom: 1px solid var(--border); background: var(--card);">
      <span class="link-label" style="font-weight: 500; margin-right: 0.5rem; color: var(--foreground); word-break: break-all;">${link.label ? escapeHtml(link.label) : ''}</span>
      <a class="link-url" href="${escapeHtml(link.url)}" target="_blank" style="color: #2563eb; text-decoration: underline; margin-right: 0.5rem; word-break: break-all; font-size: 0.95em;">${escapeHtml(link.url)}</a>
      <div class="link-actions" style="display: flex; align-items: center; gap: 0.25rem;">
        <button class="copy" data-id="${link.id}" title="Copy" style="background: none; color: var(--primary); border: none; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; margin-right: 0.1rem; border-radius: 0.5rem; transition: color 0.15s;">
          <svg xmlns='http://www.w3.org/2000/svg' width='18' height='18' fill='none' viewBox='0 0 24 24'><rect x='9' y='9' width='13' height='13' rx='2' stroke='currentColor' stroke-width='2'/><rect x='3' y='3' width='13' height='13' rx='2' fill='none' stroke='currentColor' stroke-width='2'/></svg>
        </button>
        <button class="delete" data-id="${link.id}" title="Delete" style="background: none; color: var(--destructive); border: none; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; margin-right: 0.1rem; border-radius: 0.5rem; transition: color 0.15s;">
          <svg xmlns='http://www.w3.org/2000/svg' width='18' height='18' fill='none' viewBox='0 0 24 24'><path d='M3 6h18M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2m2 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14z' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/></svg>
        </button>
        <span class="copied-msg" id="copied-${link.id}" style="color: #10b981; font-size: 0.85em; margin-left: 0.5rem; display: none;">Copied!</span>
      </div>
    </div>
  `).join('');

  // Add event listeners for copy and delete, and only change icon color on hover/focus
  linksList.querySelectorAll('.copy').forEach(btn => {
    btn.addEventListener('mouseenter', () => btn.style.color = '#10b981');
    btn.addEventListener('mouseleave', () => btn.style.color = 'var(--primary)');
    btn.addEventListener('focus', () => btn.style.color = '#10b981');
    btn.addEventListener('blur', () => btn.style.color = 'var(--primary)');
    btn.addEventListener('click', (e) => {
      const id = btn.getAttribute('data-id');
      const link = links.find(l => l.id === id);
      if (link) {
        navigator.clipboard.writeText(link.url).then(() => {
          const msg = document.getElementById(`copied-${id}`);
          if (msg) {
            msg.style.display = 'inline';
            setTimeout(() => { msg.style.display = 'none'; }, 1200);
          }
        });
      }
    });
  });
  linksList.querySelectorAll('.delete').forEach(btn => {
    btn.addEventListener('mouseenter', () => btn.style.color = '#ef4444');
    btn.addEventListener('mouseleave', () => btn.style.color = 'var(--destructive)');
    btn.addEventListener('focus', () => btn.style.color = '#ef4444');
    btn.addEventListener('blur', () => btn.style.color = 'var(--destructive)');
    btn.addEventListener('click', (e) => {
      const id = btn.getAttribute('data-id');
      deleteLink(id);
    });
  });
}

function addLink(label, url) {
  chrome.storage.local.get(['quickLinks'], (data) => {
    const links = data.quickLinks || [];
    links.push({
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      label: label.trim(),
      url: url.trim()
    });
    chrome.storage.local.set({ quickLinks: links }, loadLinks);
  });
}

function deleteLink(id) {
  chrome.storage.local.get(['quickLinks'], (data) => {
    let links = data.quickLinks || [];
    links = links.filter(link => link.id !== id);
    chrome.storage.local.set({ quickLinks: links }, loadLinks);
  });
} 