console.log("[JobLogger] Content script loaded");

(function () {
  let isEnabled = true;
  let isShowingPopup = false;

  // Check if auto-detection is enabled
  function checkEnabled() {
    chrome.storage.local.get(["autoDetectionEnabled"], (data) => {
      isEnabled = data.autoDetectionEnabled !== false; // Default to true
    });
  }

  // Check if we're on a job application page
  function isJobApplicationPage() {
    const pathname = window.location.pathname.toLowerCase();
    const hostname = window.location.hostname.toLowerCase();
    const title = document.title.toLowerCase();
    
    // Job-related keywords
    const jobKeywords = [
      "job", "jobs", "career", "careers", "apply", "application", 
      "position", "opening", "opportunity", "employment"
    ];
    
    // Check URL and title for job keywords
    const hasJobKeywords = jobKeywords.some(keyword =>
      pathname.includes(keyword) || 
      hostname.includes(keyword) || 
      title.includes(keyword)
    );
    
    // Check for common job site domains
    const jobSites = [
      "indeed.com", "linkedin.com", "glassdoor.com", "monster.com",
      "careerbuilder.com", "ziprecruiter.com", "simplyhired.com",
      "dice.com", "angel.co", "stackoverflow.com", "github.com"
    ];
    
    const isJobSite = jobSites.some(site => hostname.includes(site));
    
    return hasJobKeywords || isJobSite;
  }

  // Extract job information from the page
  function extractJobInfo() {
    const titleSelectors = [
      "h1",
      ".job-title",
      ".position-title",
      "[data-automation='job-detail-title']",
      ".jobsearch-JobInfoHeader-title",
      ".job-title",
      ".title",
      "[class*='title']"
    ];

    let title = null;
    for (const selector of titleSelectors) {
      const element = document.querySelector(selector);
      if (element && element.innerText.trim()) {
        title = element.innerText.trim();
        break;
      }
    }

    if (!title) {
      title = document.title || "Unknown Title";
    }

    const companySelectors = [
      "meta[property='og:site_name']",
      ".company-name",
      ".employer-name",
      "[data-automation='job-company-name']",
      ".jobsearch-CompanyInfoContainer",
      ".company",
      "[class*='company']"
    ];

    let company = null;
    for (const selector of companySelectors) {
      const element = document.querySelector(selector);
      if (element) {
        if (selector.includes("meta")) {
          company = element.getAttribute("content");
        } else {
          company = element.innerText.trim();
        }
        if (company) break;
      }
    }

    // Fallback - try to extract company name from "at [Company]" in title
    if (!company) {
      const match = document.title.match(/at\s(.+)$/i);
      if (match) {
        company = match[1].trim();
      }
    }

    if (!company) {
      company = window.location.hostname.replace("www.", "") || "Unknown Company";
    }

    return { title, company, url: window.location.href };
  }

  // Show confirmation popup
  function showConfirmationPopup(jobInfo) {
    if (isShowingPopup) return;
    isShowingPopup = true;

    const popup = document.createElement("div");
    popup.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #1f2937;
      color: white;
      padding: 16px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      z-index: 10000;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      max-width: 300px;
      border: 1px solid #374151;
    `;

    popup.innerHTML = `
      <div style="margin-bottom: 12px; font-weight: 600;">Did you apply to a job?</div>
      <div style="margin-bottom: 8px; color: #d1d5db;">
        <strong>${jobInfo.company}</strong><br>
        ${jobInfo.title}
      </div>
      <div style="display: flex; gap: 8px;">
        <button id="jobLoggerYes" style="
          background: #10b981;
          color: white;
          border: none;
          padding: 6px 12px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;
        ">Yes, Log It</button>
        <button id="jobLoggerNo" style="
          background: #6b7280;
          color: white;
          border: none;
          padding: 6px 12px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;
        ">No</button>
      </div>
    `;

    document.body.appendChild(popup);

    // Add event listeners
    popup.querySelector("#jobLoggerYes").addEventListener("click", () => {
      logJob(jobInfo);
      removePopup();
    });

    popup.querySelector("#jobLoggerNo").addEventListener("click", removePopup);

    // Auto-remove after 10 seconds
    setTimeout(removePopup, 10000);

    function removePopup() {
      if (popup.parentNode) {
        popup.parentNode.removeChild(popup);
      }
      isShowingPopup = false;
    }
  }

  // Log the job
  function logJob(jobInfo) {
    const newJob = {
      company: jobInfo.company,
      title: jobInfo.title,
      date: new Date().toISOString()
    };

    chrome.storage.local.get(["jobs"], (data) => {
      const jobs = data.jobs || [];
      jobs.push(newJob);
      
      chrome.storage.local.set({ jobs }, () => {
        showSuccessToast();
      });
    });
  }

  // Show success toast
  function showSuccessToast() {
    const toast = document.createElement("div");
    toast.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: #10b981;
      color: white;
      padding: 12px 16px;
      border-radius: 6px;
      box-shadow: 0 2px 6px rgba(0,0,0,0.2);
      z-index: 10000;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
    `;
    toast.textContent = "✅ Job logged successfully!";
    
    document.body.appendChild(toast);
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 3000);
  }

  // Main detection logic
  function checkForJobApplication() {
    if (!isEnabled) return;
    
    if (isJobApplicationPage()) {
      const jobInfo = extractJobInfo();
      
      // Wait a bit for the page to fully load
      setTimeout(() => {
        showConfirmationPopup(jobInfo);
      }, 2000);
    }
  }

  // Initialize
  checkEnabled();
  
  // Listen for storage changes (when user toggles auto-detection)
  chrome.storage.onChanged.addListener((changes) => {
    if (changes.autoDetectionEnabled) {
      isEnabled = changes.autoDetectionEnabled.newValue;
    }
  });

  // Check when page loads
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", checkForJobApplication);
  } else {
    checkForJobApplication();
  }

  // Also check on navigation (for SPAs)
  let lastUrl = location.href;
  new MutationObserver(() => {
    const url = location.href;
    if (url !== lastUrl) {
      lastUrl = url;
      setTimeout(checkForJobApplication, 1000);
    }
  }).observe(document, { subtree: true, childList: true });

  console.log("[JobLogger] Job detection ready");
})(); 