// Cloudflare Configuration Management
let cloudflareConfig = {
  id: "",
  domain: "",
};

// Load saved configuration
function loadConfig() {
  const saved = localStorage.getItem("cloudflareConfig");
  if (saved) {
    cloudflareConfig = JSON.parse(saved);
    updateAllQuickLinks();
  }
}

// Save configuration
function saveConfig(formElement) {
  const form = formElement || document.querySelector(".inline-config-form");
  const idInput = form.querySelector('input[name="cloudflareId"]');
  const domainInput = form.querySelector('input[name="domainName"]');

  const id = idInput.value.trim();
  const domain = domainInput.value.trim();

  if (!id || !domain) {
    showInlineStatus(
      "Please fill in both Cloudflare ID and Domain Name",
      "error",
      form
    );
    return;
  }

  // Basic validation
  if (id.length < 20) {
    showInlineStatus(
      "Cloudflare ID seems too short. Please check and try again.",
      "error",
      form
    );
    return;
  }

  if (!domain.includes(".")) {
    showInlineStatus(
      "Please enter a valid domain name (e.g., yourdomain.com)",
      "error",
      form
    );
    return;
  }

  cloudflareConfig.id = id;
  cloudflareConfig.domain = domain;

  localStorage.setItem("cloudflareConfig", JSON.stringify(cloudflareConfig));

  updateAllQuickLinks();
  showInlineStatus(
    "Configuration saved! Quick links are now enabled.",
    "success",
    form
  );

  // Hide all inline config forms and recreate with "Not working?" buttons
  setTimeout(() => {
    // Hide all existing configuration forms
    const allConfigForms = document.querySelectorAll(".inline-config-form");
    allConfigForms.forEach((configForm) => {
      configForm.style.display = "none";
    });

    // Recreate all forms with "Not working?" buttons (they will be hidden initially)
    createInlineConfigForm("profileAuthContainer");
    createInlineConfigForm("domainRegContainer");
    createInlineConfigForm("emailRoutingContainer");
    createInlineConfigForm("pagesContainer");
    createInlineConfigForm("pagesTextContainer");
    createInlineConfigForm("analyticsContainer");
  }, 100);
}

// Show inline status message
function showInlineStatus(message, type, targetForm) {
  // Remove existing status from the target form
  const existingStatus = targetForm
    ? targetForm.querySelector(".inline-status")
    : document.querySelector(".inline-status");
  if (existingStatus) {
    existingStatus.remove();
  }

  const status = document.createElement("div");
  status.className = `inline-status ${type}`;
  status.textContent = message;
  status.style.cssText = `
    margin-top: 10px;
    padding: 8px 12px;
    border-radius: 4px;
    font-size: 14px;
    ${
      type === "success"
        ? "background: #d4edda; color: #155724; border: 1px solid #c3e6cb;"
        : "background: #f8d7da; color: #721c24; border: 1px solid #f5c6cb;"
    }
  `;

  const configForm =
    targetForm || document.querySelector(".inline-config-form");
  if (configForm) {
    configForm.appendChild(status);
  }

  setTimeout(() => {
    if (status.parentNode) {
      status.remove();
    }
  }, 5000);
}

// Create inline configuration form
function createInlineConfigForm(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  // Check if already configured
  if (cloudflareConfig.id && cloudflareConfig.domain) {
    const quickLink = container.querySelector(".quick-link");
    if (quickLink) {
      quickLink.classList.remove("disabled");
      quickLink.onclick = null;

      // Add edit button
      const editBtn = document.createElement("button");
      editBtn.className = "btn btn-secondary btn-small";
      editBtn.innerHTML = '<i class="fa-solid fa-edit"></i> Not working?';
      editBtn.style.cssText =
        "margin-left: 10px; padding: 4px 8px; font-size: 12px;";
      editBtn.onclick = () => showInlineConfigForm(containerId);

      const small = quickLink.nextElementSibling;
      if (small && small.tagName === "SMALL") {
        small.remove();
      }

      quickLink.parentNode.insertBefore(editBtn, quickLink.nextSibling);
    }
    return;
  }

  // Show configuration form
  showInlineConfigForm(containerId);
}

// Show inline configuration form
function showInlineConfigForm(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  // Remove existing form
  const existingForm = container.querySelector(".inline-config-form");
  if (existingForm) {
    existingForm.remove();
  }

  const form = document.createElement("div");
  form.className = "inline-config-form";
  form.style.cssText = `
    background: #f8f9fa;
    border: 1px solid #e9ecef;
    border-radius: 6px;
    padding: 15px;
    margin: 10px 0;
  `;

  form.innerHTML = `
    <h4 style="margin-top: 0; color: #2c5530; font-size: 16px;">
      <i class="fa-solid fa-cog"></i> Configure Quick Link
    </h4>
    <p style="margin: 5px 0 15px 0; font-size: 14px; color: #666;">
      Enter your Cloudflare details to enable easier navigation with quick links:
    </p>
    <div style="display: flex; gap: 10px; align-items: end; flex-wrap: wrap;">
      <div style="flex: 1; min-width: 150px;">
        <label style="display: block; margin-bottom: 5px; font-weight: 500; font-size: 13px;">Cloudflare ID</label>
        <input type="text" name="cloudflareId" placeholder="c7a24af26d6a51229aaf6a383e1dfb0e" 
               style="width: 100%; padding: 6px 10px; border: 1px solid #ccc; border-radius: 4px; font-size: 13px;"
               value="${cloudflareConfig.id || ""}">
      </div>
      <div style="flex: 1; min-width: 150px;">
        <label style="display: block; margin-bottom: 5px; font-weight: 500; font-size: 13px;">Domain</label>
        <input type="text" name="domainName" placeholder="yourdomain.com" 
               style="width: 100%; padding: 6px 10px; border: 1px solid #ccc; border-radius: 4px; font-size: 13px;"
               value="${cloudflareConfig.domain || ""}">
      </div>
      <div style="display: flex; gap: 8px;">
        <button onclick="saveConfig(this.closest('.inline-config-form'))" 
                style="padding: 6px 12px; background: #2c5530; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 13px;">
          Save
        </button>
        <button onclick="this.closest('.inline-config-form').remove()" 
                style="padding: 6px 12px; background: #6c757d; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 13px;">
          Cancel
        </button>
      </div>
    </div>
    <small style="display: block; margin-top: 8px; color: #666; font-size: 12px;">
      Find your Cloudflare ID in your dashboard URL: dash.cloudflare.com/[YOUR_ID]/
    </small>
  `;

  container.appendChild(form);
}

// Update all quick links
function updateAllQuickLinks() {
  if (!cloudflareConfig.id || !cloudflareConfig.domain) {
    return;
  }

  const baseUrl = `https://dash.cloudflare.com/${cloudflareConfig.id}/${cloudflareConfig.domain}`;

  // Update all quick links
  const links = {
    profileAuthLink: "https://dash.cloudflare.com/profile/authentication",
    domainRegLink: "https://dash.cloudflare.com/registrar",
    emailRoutingLink: `${baseUrl}/email/routing/routes`,
    pagesLink: "https://dash.cloudflare.com/pages",
    pagesTextLink: "https://dash.cloudflare.com/pages",
    analyticsLink: `${baseUrl}/analytics`,
  };

  Object.keys(links).forEach((id) => {
    const link = document.getElementById(id);
    if (link) {
      link.href = links[id];
      link.classList.remove("disabled");
      link.onclick = null;

      // Remove the small text and edit button
      const small = link.nextElementSibling;
      if (small && small.tagName === "SMALL") {
        small.remove();
      }
      const editBtn = link.parentNode.querySelector("button");
      if (editBtn) {
        editBtn.remove();
      }
    }
  });
}

// Reset configuration function
function resetCloudflareConfig() {
  if (
    confirm(
      "Are you sure you want to reset your Cloudflare configuration? This will clear your saved ID and domain."
    )
  ) {
    localStorage.removeItem("cloudflareConfig");
    cloudflareConfig = { id: "", domain: "" };

    // Reset all quick links to disabled state
    const links = [
      "profileAuthLink",
      "domainRegLink",
      "emailRoutingLink",
      "pagesLink",
      "pagesTextLink",
      "analyticsLink",
    ];

    links.forEach((id) => {
      const link = document.getElementById(id);
      if (link) {
        link.href = "#";
        link.classList.add("disabled");
        link.onclick = () => false;

        // Remove edit buttons
        const editBtn = link.parentNode.querySelector("button");
        if (editBtn) {
          editBtn.remove();
        }

        // Add back the small text
        const small = document.createElement("small");
        small.textContent =
          "(Configure your account details below to enable easier navigation)";
        link.parentNode.appendChild(small);
      }
    });

    // Show success message
    alert(
      "Cloudflare configuration has been reset. You can now configure new details in any section."
    );

    // Reinitialize inline configs
    setTimeout(() => {
      createInlineConfigForm("profileAuthContainer");
      createInlineConfigForm("domainRegContainer");
      createInlineConfigForm("emailRoutingContainer");
      createInlineConfigForm("pagesContainer");
      createInlineConfigForm("pagesTextContainer");
      createInlineConfigForm("analyticsContainer");
    }, 100);
  }
}

// Initialize on page load
document.addEventListener("DOMContentLoaded", function () {
  loadConfig();

  // Initialize inline configs for each section
  setTimeout(() => {
    createInlineConfigForm("profileAuthContainer");
    createInlineConfigForm("domainRegContainer");
    createInlineConfigForm("emailRoutingContainer");
    createInlineConfigForm("pagesContainer");
    createInlineConfigForm("pagesTextContainer");
    createInlineConfigForm("analyticsContainer");
  }, 100);
});
