console.log("[JobLogger] Content script loaded");

(function () {
  let isEnabled = true;
  let isShowingPopup = false;
  let lastJobUrl = null;
  let lastJobInfo = null;

  // Check if auto-detection is enabled
  function checkEnabled() {
    chrome.storage.local.get(["autoDetectionEnabled"], (data) => {
      isEnabled = data.autoDetectionEnabled !== false; // Default to true
    });
  }

  // Check if we're on a job application page (more specific)
  function isJobApplicationPage() {
    const pathname = window.location.pathname.toLowerCase();
    const hostname = window.location.hostname.toLowerCase();
    const title = document.title.toLowerCase();
    
    // More specific job application keywords
    const applicationKeywords = [
      "apply", "application", "submit application", "job application",
      "careers/apply", "jobs/apply", "apply-now", "applynow"
    ];
    
    // Check for application-specific URLs
    const hasApplicationKeywords = applicationKeywords.some(keyword =>
      pathname.includes(keyword) || 
      title.includes(keyword)
    );
    
    // Check for common external application systems
    const externalSystems = [
      "greenhouse.io", "workday.com", "lever.co", 
      "bamboohr.com", "smartrecruiters.com", "icims.com",
      "taleo.net", "brassring.com", "ultipro.com"
    ];
    
    const isExternalSystem = externalSystems.some(site => hostname.includes(site));
    
    return hasApplicationKeywords || isExternalSystem;
  }

  // Check if this is a job listing page (but not application page)
  function isJobListingPage() {
    const pathname = window.location.pathname.toLowerCase();
    const hostname = window.location.hostname.toLowerCase();
    const title = document.title.toLowerCase();
    
    // Job-related keywords for listings
    const jobKeywords = [
      "job", "jobs", "career", "careers", "position", "opening", 
      "opportunity", "employment", "vacancy"
    ];
    
    // Check for common job site domains
    const jobSites = [
      "indeed.com", "linkedin.com", "glassdoor.com", "monster.com",
      "careerbuilder.com", "ziprecruiter.com", "simplyhired.com",
      "dice.com", "angel.co", "stackoverflow.com", "github.com"
    ];
    
    const hasJobKeywords = jobKeywords.some(keyword =>
      pathname.includes(keyword) || 
      hostname.includes(keyword) || 
      title.includes(keyword)
    );
    
    const isJobSite = jobSites.some(site => hostname.includes(site));
    
    return (hasJobKeywords || isJobSite) && !isJobApplicationPage();
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

  // Check if this is a confirmation/success page
  function isConfirmationPage() {
    const pathname = window.location.pathname.toLowerCase();
    const title = document.title.toLowerCase();
    const bodyText = document.body.innerText.toLowerCase();
    
    const confirmationKeywords = [
      "thank you", "application received", "application submitted",
      "success", "confirmation", "submitted", "received",
      "thank you for applying", "application complete", "application successful"
    ];
    
    return confirmationKeywords.some(keyword =>
      pathname.includes(keyword) ||
      title.includes(keyword) ||
      bodyText.includes(keyword)
    );
  }

  // Save job info to session storage when starting application
  function savePendingJob(jobInfo) {
    const pendingJob = {
      ...jobInfo,
      timestamp: Date.now(),
      source: window.location.hostname
    };
    sessionStorage.setItem("jobLogger_pending", JSON.stringify(pendingJob));
    console.log("[JobLogger] Saved pending job:", pendingJob);
  }

  // Get pending job from session storage
  function getPendingJob() {
    const pending = sessionStorage.getItem("jobLogger_pending");
    if (pending) {
      try {
        return JSON.parse(pending);
      } catch (e) {
        console.error("[JobLogger] Error parsing pending job:", e);
      }
    }
    return null;
  }

  // Clear pending job from session storage
  function clearPendingJob() {
    sessionStorage.removeItem("jobLogger_pending");
    console.log("[JobLogger] Cleared pending job");
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

  // Detect when user starts applying
  function setupApplicationDetection() {
    // Listen for form submissions
    document.addEventListener("submit", function(e) {
      if (!isEnabled) return;
      
      console.log("[JobLogger] Form submitted detected");
      
      if (isJobListingPage() || isJobApplicationPage()) {
        const jobInfo = extractJobInfo();
        savePendingJob(jobInfo);
      }
    }, true);

    // Listen for "Apply" button clicks
    document.addEventListener("click", function(e) {
      if (!isEnabled) return;
      
      const target = e.target;
      const text = target.textContent.toLowerCase();
      const isApplyButton = text.includes("apply") || 
                           text.includes("submit") || 
                           text.includes("send") ||
                           target.type === "submit";
      
      if (isApplyButton && (isJobListingPage() || isJobApplicationPage())) {
        console.log("[JobLogger] Apply button clicked");
        
        const jobInfo = extractJobInfo();
        savePendingJob(jobInfo);
      }
    }, true);
  }

  // Check for confirmation pages and pending jobs
  function checkForCompletions() {
    if (!isEnabled) return;
    
    // If this is a confirmation page and we have a pending job, log it automatically
    if (isConfirmationPage()) {
      const pendingJob = getPendingJob();
      if (pendingJob) {
        console.log("[JobLogger] Confirmation page detected, logging pending job");
        logJob(pendingJob);
        clearPendingJob();
        return;
      }
    }
    
    // If we're back on a job site and have a pending job, ask for confirmation
    if (isJobListingPage()) {
      const pendingJob = getPendingJob();
      if (pendingJob) {
        // Check if the pending job is older than 5 minutes
        const timeDiff = Date.now() - pendingJob.timestamp;
        if (timeDiff > 5 * 60 * 1000) { // 5 minutes
          console.log("[JobLogger] Returning to job site, asking about pending job");
          logJob(pendingJob);
          clearPendingJob();
        }
      }
    }
  }

  // Initialize
  checkEnabled();
  setupApplicationDetection();
  
  // Listen for storage changes (when user toggles auto-detection)
  chrome.storage.onChanged.addListener((changes) => {
    if (changes.autoDetectionEnabled) {
      isEnabled = changes.autoDetectionEnabled.newValue;
    }
  });

  // Check when page loads
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", checkForCompletions);
  } else {
    checkForCompletions();
  }

  // Also check on navigation (for SPAs)
  let lastUrl = location.href;
  new MutationObserver(() => {
    const url = location.href;
    if (url !== lastUrl) {
      lastUrl = url;
      lastJobUrl = null; // Reset for new page
      setTimeout(checkForCompletions, 1000);
    }
  }).observe(document, { subtree: true, childList: true });

  console.log("[JobLogger] Smart job detection ready");
})(); 