// ================= GLOBAL CONFIG & AUTH GUARD =================
const isAuthPage = window.location.pathname.includes("login.html") || window.location.pathname.includes("signup.html");
const isDashboardPage = window.location.pathname.includes("dashboard.html");
const token = localStorage.getItem("token");
const role = localStorage.getItem("role");
const email = localStorage.getItem("email");

// Auth Guard checks
if (isDashboardPage && !token) {
  window.location.href = "login.html";
} else if (isAuthPage && token) {
  window.location.href = "dashboard.html";
}

// Global state for in-memory records to allow instant filtering
let allRecords = [];
let ratioChartInstance = null;
let subjectChartInstance = null;

// Page Initialization
document.addEventListener("DOMContentLoaded", () => {
  // Apply saved theme
  const savedTheme = localStorage.getItem("theme") || "light";
  if (savedTheme === "dark") {
    document.body.classList.add("dark-mode");
    const themeBtn = document.querySelector(".theme-toggle-btn");
    if (themeBtn) themeBtn.innerText = "🌙";
  } else {
    const themeBtn = document.querySelector(".theme-toggle-btn");
    if (themeBtn) themeBtn.innerText = "☀️";
  }

  // Auth pages logic
  if (isAuthPage) {
    if (window.location.pathname.includes("signup.html")) {
      localStorage.clear();
    }
    return;
  }

  // Initialize Dashboard Details
  const userInfoEl = document.getElementById("userInfo");
  const avatarInitialEl = document.getElementById("avatarInitial");
  if (userInfoEl && email) {
    userInfoEl.innerHTML = `${email} <span class="badge ${role}">${role}</span>`;
    avatarInitialEl.innerText = email.charAt(0).toUpperCase();
  }

  // Role based panels toggle
  const adminAddPanel = document.getElementById("adminAddPanel");
  const adminRiskPanel = document.getElementById("adminRiskPanel");
  const studentInfoPanel = document.getElementById("studentInfoPanel");
  const adminHeaders = document.querySelectorAll(".admin-only-header");

  if (role === "admin") {
    if (adminAddPanel) adminAddPanel.style.display = "block";
    if (adminRiskPanel) adminRiskPanel.style.display = "block";
    if (studentInfoPanel) studentInfoPanel.style.display = "none";
    adminHeaders.forEach(el => el.style.display = "");
    
    // Set default date to today
    const dateInput = document.getElementById("dateInput");
    if (dateInput) {
      dateInput.value = new Date().toISOString().split("T")[0];
    }
    
    loadRegisteredStudents();
  } else {
    if (adminAddPanel) adminAddPanel.style.display = "none";
    if (adminRiskPanel) adminRiskPanel.style.display = "none";
    if (studentInfoPanel) studentInfoPanel.style.display = "block";
    adminHeaders.forEach(el => el.style.display = "none");
  }

  // Load attendance data
  loadAttendance();
  init3DTilt();
});

// ================= TOAST NOTIFICATION CONTROLLER =================
function showToast(message, type = "success") {
  let container = document.getElementById("toastContainer");
  if (!container) {
    container = document.createElement("div");
    container.id = "toastContainer";
    container.className = "toast-container";
    document.body.appendChild(container);
  }

  const toast = document.createElement("div");
  toast.className = `toast-message ${type}`;
  
  let icon = "🔔";
  if (type === "success") icon = "✅";
  else if (type === "error") icon = "❌";
  else if (type === "info") icon = "ℹ️";

  toast.innerHTML = `
    <span class="toast-icon ${type}">${icon}</span>
    <div class="toast-content">${message}</div>
  `;

  container.appendChild(toast);

  // Trigger animation
  setTimeout(() => toast.classList.add("show"), 10);

  // Auto remove
  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 400);
  }, 4000);
}

// ================= AUTHENTICATION ACTIONS =================

// TOGGLE ADMIN SECRET FIELD IN SIGNUP
function toggleAdminSecretField() {
  const roleInput = document.getElementById("role");
  const secretGroup = document.getElementById("adminSecretGroup");
  if (!roleInput || !secretGroup) return;

  if (roleInput.value === "admin") {
    secretGroup.style.display = "block";
    const secretInput = document.getElementById("adminSecret");
    if (secretInput) secretInput.setAttribute("required", "true");
  } else {
    secretGroup.style.display = "none";
    const secretInput = document.getElementById("adminSecret");
    if (secretInput) {
      secretInput.removeAttribute("required");
      secretInput.value = "";
    }
  }
}

// SIGNUP
async function signup() {
  const emailInput = document.getElementById("email")?.value.trim();
  const passwordInput = document.getElementById("password")?.value.trim();
  const roleInput = document.getElementById("role")?.value;
  const adminSecretInput = document.getElementById("adminSecret")?.value.trim();

  if (!emailInput || !passwordInput || !roleInput) {
    showToast("Please fill in all fields", "error");
    return;
  }

  if (roleInput === "admin" && !adminSecretInput) {
    showToast("Please enter the Admin Authorization Key", "error");
    return;
  }

  try {
    const payload = {
      email: emailInput,
      password: passwordInput,
      role: roleInput
    };
    if (roleInput === "admin") {
      payload.adminSecret = adminSecretInput;
    }

    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await res.json();

    if (!res.ok) {
      showToast(data.message || "Signup failed", "error");
      return;
    }

    showToast("Account created successfully! Redirecting to login...", "success");
    setTimeout(() => {
      window.location.href = "login.html";
    }, 1500);
  } catch (err) {
    showToast("Network error during signup", "error");
  }
}

// LOGIN
async function login() {
  const emailInput = document.getElementById("email")?.value.trim();
  const passwordInput = document.getElementById("password")?.value.trim();

  if (!emailInput || !passwordInput) {
    showToast("Please enter email and password", "error");
    return;
  }

  try {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: emailInput, password: passwordInput })
    });

    const data = await res.json();

    if (!res.ok) {
      showToast(data.message || "Invalid credentials", "error");
      return;
    }

    localStorage.setItem("token", data.token);
    localStorage.setItem("role", data.role);
    localStorage.setItem("email", emailInput);

    showToast("Login successful! Redirecting...", "success");
    setTimeout(() => {
      window.location.href = "dashboard.html";
    }, 1000);
  } catch (err) {
    showToast("Network error during login", "error");
  }
}

// LOGOUT
function logout() {
  localStorage.clear();
  window.location.href = "index.html";
}

// ================= ADMIN: REGISTERED STUDENTS LOAD =================
async function loadRegisteredStudents() {
  const select = document.getElementById("studentEmailSelect");
  if (!select) return;

  try {
    const res = await fetch("/api/auth/students", {
      headers: { "Authorization": `Bearer ${token}` }
    });

    if (!res.ok) throw new Error("Failed to load students");

    const students = await res.json();

    // Reset dropdown options
    select.innerHTML = '<option value="" disabled selected>Select a student...</option>';
    students.forEach(student => {
      const option = document.createElement("option");
      option.value = student.email;
      option.innerText = student.email;
      select.appendChild(option);
    });

    // Smart UX: Auto-fill display name prefix of email when selected
    select.addEventListener("change", () => {
      const selectedEmail = select.value;
      if (selectedEmail) {
        const prefix = selectedEmail.split("@")[0];
        const cleanName = prefix
          .replace(/[._-]/g, " ")
          .replace(/\b\w/g, c => c.toUpperCase());
        
        const nameInput = document.getElementById("studentNameInput");
        if (nameInput) nameInput.value = cleanName;

        // Dynamic update of Heatmap & Charts for the selected student to provide premium feedback
        const studentRecords = allRecords.filter(r => r.studentEmail === selectedEmail);
        renderHeatmapGrid(studentRecords);
      } else {
        renderHeatmapGrid(allRecords);
      }
    });

  } catch (err) {
    showToast("Could not load registered students list", "error");
  }
}

// ================= ATTENDANCE SYSTEM CORE =================

// LOAD RECORD LIST
async function loadAttendance() {
  try {
    const res = await fetch("/api/attendance", {
      headers: { "Authorization": `Bearer ${token}` }
    });

    if (!res.ok) throw new Error("Unauthorized or server error");

    allRecords = await res.json();

    // Update filters dropdown list dynamically
    updateSubjectFilterDropdown();
    
    // Perform render & statistics calculation
    renderAttendanceTable(allRecords);
    calculateStatistics(allRecords);
    renderCharts(allRecords);
    renderHeatmapGrid(allRecords);

  } catch (err) {
    showToast("Error loading attendance records", "error");
  }
}

// RENDER RECORDS IN TABLE
function renderAttendanceTable(records) {
  const tbody = document.getElementById("attendanceTableBody");
  const emptyState = document.getElementById("emptyState");
  if (!tbody) return;

  tbody.innerHTML = "";

  if (records.length === 0) {
    emptyState.style.display = "block";
    return;
  }
  emptyState.style.display = "none";

  records.forEach(record => {
    const tr = document.createElement("tr");
    
    // Format Date
    const formattedDate = new Date(record.date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric"
    });

    // Create Badge style class
    const badgeClass = `status-${record.status.toLowerCase()}`;

    // Admin Action Buttons with luxury SVG icons
    const actionsHtml = role === "admin" 
      ? `<div class="action-buttons-cell">
          <button class="action-btn-pill action-btn-edit" title="Edit status" onclick="openEditModal('${record._id}', '${record.studentName}', '${record.subject}', '${record.status}')">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
            <span>Edit</span>
          </button>
          <button class="action-btn-pill action-btn-delete" title="Delete record" onclick="deleteAttendance('${record._id}')">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
          </button>
         </div>`
      : "";

    tr.innerHTML = `
      <td class="cell-date"><span class="date-badge">${formattedDate}</span></td>
      <td>
        <div class="student-cell">
          <span class="student-cell-avatar">${(record.studentName || "S").charAt(0).toUpperCase()}</span>
          <div class="student-cell-info">
            <span class="student-cell-name">${record.studentName}</span>
            <span class="student-cell-email-sub">${record.studentEmail}</span>
          </div>
        </div>
      </td>
      <td class="cell-email"><span class="mono-email">${record.studentEmail}</span></td>
      <td class="cell-subject"><span class="subject-pill">${record.subject}</span></td>
      <td>
        <span class="badge ${badgeClass}">
          <span class="badge-dot"></span>
          ${record.status}
        </span>
      </td>
      ${role === "admin" ? `<td>${actionsHtml}</td>` : ""}
    `;

    tbody.appendChild(tr);
  });
}

// DYNAMIC STATS GENERATION
function calculateStatistics(records) {
  const total = records.length;
  const present = records.filter(r => r.status === "Present").length;
  const late = records.filter(r => r.status === "Late").length;
  
  const percentage = total ? (((present + late) / total) * 100).toFixed(1) : "0.0";

  document.getElementById("statTotal").innerText = total;
  document.getElementById("statPresent").innerText = present;
  document.getElementById("statLate").innerText = late;
  document.getElementById("statPercent").innerText = `${percentage}%`;

  // Student specific exam target display
  const targetIndicator = document.getElementById("targetIndicator");
  if (targetIndicator) {
    const rate = parseFloat(percentage);
    if (rate >= 75) {
      targetIndicator.style.background = "var(--status-present-bg)";
      targetIndicator.style.color = "var(--status-present)";
      targetIndicator.innerText = `Eligible (Rate: ${percentage}%)`;
    } else {
      targetIndicator.style.background = "var(--status-absent-bg)";
      targetIndicator.style.color = "var(--status-absent)";
      targetIndicator.innerText = `Below Threshold (Rate: ${percentage}%)`;
    }
  }

  // Generate Subject Breakdown
  const subjectListEl = document.getElementById("subjectBreakdownList");
  if (subjectListEl) {
    if (total === 0) {
      subjectListEl.innerHTML = '<p style="font-size: 14px; color: var(--text-secondary);">No records logged yet.</p>';
    } else {
      // Get unique subjects
      const subjects = [...new Set(records.map(r => r.subject))].sort();
      
      let listHtml = '';
      subjects.forEach(sub => {
        const subRecords = records.filter(r => r.subject === sub);
        const subTotal = subRecords.length;
        const subPresent = subRecords.filter(r => r.status === "Present").length;
        const subLate = subRecords.filter(r => r.status === "Late").length;
        
        const subRate = subTotal ? (((subPresent + subLate) / subTotal) * 100).toFixed(0) : "0";
        const isPassing = parseFloat(subRate) >= 75;
        const barClass = isPassing ? 'pass' : 'fail';
        
        listHtml += `
          <div class="subject-progress-container">
            <div class="subject-progress-header">
              <span class="subject-name" title="${sub}">${sub}</span>
              <span class="subject-percent">${subRate}% <span style="font-size: 11px; font-weight: normal; color: var(--text-secondary);">(${subPresent + subLate}/${subTotal})</span></span>
            </div>
            <div class="subject-progress-bg">
              <div class="subject-progress-bar ${barClass}" style="width: ${subRate}%;"></div>
            </div>
          </div>
        `;
      });
      subjectListEl.innerHTML = listHtml;
    }
  }

  // Generate At-Risk Students List (Admin Only)
  const riskStudentsListEl = document.getElementById("riskStudentsList");
  if (riskStudentsListEl && role === "admin") {
    if (total === 0) {
      riskStudentsListEl.innerHTML = '<p style="font-size: 14px; color: var(--text-secondary);">No records logged yet.</p>';
    } else {
      // Calculate overall rate per student email
      const studentEmails = [...new Set(records.map(r => r.studentEmail))];
      const atRisk = [];

      studentEmails.forEach(email => {
        const studentRecords = records.filter(r => r.studentEmail === email);
        const sTotal = studentRecords.length;
        const sPresent = studentRecords.filter(r => r.status === "Present").length;
        const sLate = studentRecords.filter(r => r.status === "Late").length;
        const sRate = sTotal ? ((sPresent + sLate) / sTotal) * 100 : 0;
        
        if (sRate < 75) {
          const name = studentRecords[0].studentName;
          atRisk.push({ name, email, rate: sRate.toFixed(1) });
        }
      });

      if (atRisk.length === 0) {
        riskStudentsListEl.innerHTML = `
          <div class="risk-clear-card">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
            <div>
              <div style="font-weight: 600;">Optimal Academic Attendance</div>
              <div style="font-size: 11px; opacity: 0.85; margin-top: 2px;">All registered students meet the 75% target</div>
            </div>
          </div>
        `;
      } else {
        let riskHtml = '';
        atRisk.sort((a, b) => parseFloat(a.rate) - parseFloat(b.rate)).forEach(item => {
          riskHtml += `
            <div class="risk-student-card">
              <div class="risk-student-avatar">${(item.name || "S").charAt(0).toUpperCase()}</div>
              <div class="risk-student-info">
                <span class="risk-student-name">${item.name}</span>
                <span class="risk-student-email">${item.email}</span>
              </div>
              <div class="risk-rate-pill">
                <span class="risk-rate-value">${item.rate}%</span>
                <span class="risk-rate-label">Rate</span>
              </div>
            </div>
          `;
        });
        riskStudentsListEl.innerHTML = riskHtml;
      }
    }
  }
}

// EXPORT FILTERED ATTENDANCE TO CSV
function exportToCSV() {
  if (allRecords.length === 0) {
    showToast("No records available to export", "error");
    return;
  }

  // Get currently filtered list
  const searchQuery = document.getElementById("searchInput")?.value.toLowerCase() || "";
  const statusQuery = document.getElementById("statusFilter")?.value || "";
  const subjectQuery = document.getElementById("subjectFilter")?.value || "";

  const filteredRecords = allRecords.filter(record => {
    const matchesSearch = record.studentName.toLowerCase().includes(searchQuery) || 
                          record.studentEmail.toLowerCase().includes(searchQuery) ||
                          record.subject.toLowerCase().includes(searchQuery);
    const matchesStatus = statusQuery === "" || record.status === statusQuery;
    const matchesSubject = subjectQuery === "" || record.subject === subjectQuery;
    return matchesSearch && matchesStatus && matchesSubject;
  });

  if (filteredRecords.length === 0) {
    showToast("No filtered records match constraints to export", "error");
    return;
  }

  // Build CSV
  let csvContent = "data:text/csv;charset=utf-8,";
  csvContent += "Date,Student Name,Email,Subject,Status\n";

  filteredRecords.forEach(r => {
    const formattedDate = new Date(r.date).toISOString().split('T')[0];
    const cleanName = r.studentName.replace(/,/g, "");
    const cleanSubject = r.subject.replace(/,/g, "");
    csvContent += `${formattedDate},${cleanName},${r.studentEmail},${cleanSubject},${r.status}\n`;
  });

  // Download trigger
  const encodedUri = encodeURI(csvContent);
  const downloadLink = document.createElement("a");
  downloadLink.setAttribute("href", encodedUri);
  downloadLink.setAttribute("download", `attendance_report_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(downloadLink);
  downloadLink.click();
  document.body.removeChild(downloadLink);
  
  showToast("CSV export completed successfully!");
}

// POPULATE SUBJECT OPTIONS IN SEARCH HEADER
function updateSubjectFilterDropdown() {
  const filter = document.getElementById("subjectFilter");
  if (!filter) return;

  const currentVal = filter.value;
  const subjects = [...new Set(allRecords.map(r => r.subject))];

  filter.innerHTML = '<option value="">All Subjects</option>';
  subjects.sort().forEach(sub => {
    const option = document.createElement("option");
    option.value = sub;
    option.innerText = sub;
    filter.appendChild(option);
  });

  filter.value = currentVal;
}

// INSTANT SEARCH AND FILTER MECHANICS
function applyFiltersAndSearch() {
  const searchQuery = document.getElementById("searchInput")?.value.toLowerCase() || "";
  const statusQuery = document.getElementById("statusFilter")?.value || "";
  const subjectQuery = document.getElementById("subjectFilter")?.value || "";

  const filtered = allRecords.filter(record => {
    const matchesSearch = record.studentName.toLowerCase().includes(searchQuery) || 
                          record.studentEmail.toLowerCase().includes(searchQuery) ||
                          record.subject.toLowerCase().includes(searchQuery);
    const matchesStatus = statusQuery === "" || record.status === statusQuery;
    const matchesSubject = subjectQuery === "" || record.subject === subjectQuery;

    return matchesSearch && matchesStatus && matchesSubject;
  });

  renderAttendanceTable(filtered);
}

// ADD ATTENDANCE HANDLER
async function addAttendance() {
  const studentEmail = document.getElementById("studentEmailSelect")?.value;
  const studentName = document.getElementById("studentNameInput")?.value.trim();
  const subject = document.getElementById("subjectInput")?.value.trim();
  const date = document.getElementById("dateInput")?.value;
  const status = document.getElementById("statusSelect")?.value;

  if (!studentEmail || !studentName || !subject || !date || !status) {
    showToast("Please fill in all input fields", "error");
    return;
  }

  try {
    const res = await fetch("/api/attendance", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ studentEmail, studentName, subject, date, status })
    });

    const data = await res.json();

    if (!res.ok) {
      showToast(data.message || "Failed to log attendance", "error");
      return;
    }

    showToast("Attendance recorded successfully!");
    
    // Clear inputs except select & date
    document.getElementById("studentNameInput").value = "";
    document.getElementById("subjectInput").value = "";
    
    loadAttendance();
  } catch (err) {
    showToast("Network connection error", "error");
  }
}

// DELETE ATTENDANCE HANDLER
async function deleteAttendance(id) {
  if (!confirm("Are you sure you want to permanently delete this attendance record?")) return;

  try {
    const res = await fetch(`/api/attendance/${id}`, {
      method: "DELETE",
      headers: { "Authorization": `Bearer ${token}` }
    });

    const data = await res.json();

    if (!res.ok) {
      showToast(data.message || "Failed to delete record", "error");
      return;
    }

    showToast("Record deleted successfully.");
    loadAttendance();
  } catch (err) {
    showToast("Network error deleting record", "error");
  }
}

// ================= MODAL CONTROLLERS (EDIT ATTENDANCE) =================
function openEditModal(id, studentName, subject, currentStatus) {
  const modal = document.getElementById("editModal");
  if (!modal) return;

  document.getElementById("editRecordId").value = id;
  document.getElementById("editStudentLabel").innerText = studentName;
  document.getElementById("editSubjectLabel").innerText = subject;
  document.getElementById("editStatusSelect").value = currentStatus;

  modal.classList.add("active");
}

function closeEditModal() {
  const modal = document.getElementById("editModal");
  if (modal) modal.classList.remove("active");
}

async function saveEditAttendance() {
  const id = document.getElementById("editRecordId").value;
  const status = document.getElementById("editStatusSelect").value;

  try {
    const res = await fetch(`/api/attendance/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ status })
    });

    const data = await res.json();

    if (!res.ok) {
      showToast(data.message || "Failed to update attendance status", "error");
      return;
    }

    showToast("Attendance status updated successfully!");
    closeEditModal();
    loadAttendance();
  } catch (err) {
    showToast("Network error saving attendance update", "error");
  }
}

// ================= THEME CONTROLLER =================
function toggleTheme() {
  const body = document.body;
  body.classList.toggle("dark-mode");

  const btn = document.querySelector(".theme-toggle-btn");
  if (body.classList.contains("dark-mode")) {
    btn.innerText = "🌙";
    localStorage.setItem("theme", "dark");
  } else {
    btn.innerText = "☀️";
    localStorage.setItem("theme", "light");
  }
  
  // Re-draw charts to fit theme styles if charts are running
  if (allRecords.length > 0) {
    renderCharts(allRecords);
  }
}

// ================= ANALYTICS CHARTS (CHART.JS) =================
function renderCharts(records) {
  const isDark = document.body.classList.contains("dark-mode");
  const textColor = isDark ? "#949DA8" : "#56615B";
  const gridColor = isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(20, 26, 23, 0.06)";
  
  const presentColor = isDark ? "#34D399" : "#0D9488";
  const absentColor = isDark ? "#FB7185" : "#E11D48";
  const lateColor = isDark ? "#FBBF24" : "#D97706";
  const elementBg = isDark ? "#121417" : "#FFFFFF";
  
  const accentColor = isDark ? "#B59461" : "#1B4D3E";
  const accentGlow = isDark ? "rgba(181, 148, 97, 0.75)" : "rgba(27, 77, 62, 0.75)";

  // --- Chart 1: Ratio Doughnut Chart ---
  const presentCount = records.filter(r => r.status === "Present").length;
  const absentCount = records.filter(r => r.status === "Absent").length;
  const lateCount = records.filter(r => r.status === "Late").length;

  const ratioCtx = document.getElementById("ratioChart")?.getContext("2d");
  if (ratioCtx) {
    if (ratioChartInstance) ratioChartInstance.destroy();
    
    ratioChartInstance = new Chart(ratioCtx, {
      type: "doughnut",
      data: {
        labels: ["Present", "Absent", "Late"],
        datasets: [{
          data: [presentCount, absentCount, lateCount],
          backgroundColor: [presentColor, absentColor, lateColor],
          borderColor: elementBg,
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "bottom",
            labels: { color: textColor, font: { family: "'Plus Jakarta Sans', sans-serif", size: 12, weight: 500 } }
          }
        }
      }
    });
  }

  // --- Chart 2: Subject Performance Bar Chart ---
  // Get subject stats
  const subjectList = [...new Set(records.map(r => r.subject))];
  const subjectPresentRates = subjectList.map(sub => {
    const subRecords = records.filter(r => r.subject === sub);
    const subTotal = subRecords.length;
    const subPresent = subRecords.filter(r => r.status === "Present" || r.status === "Late").length;
    return subTotal ? Math.round((subPresent / subTotal) * 100) : 0;
  });

  const subjectCtx = document.getElementById("subjectChart")?.getContext("2d");
  if (subjectCtx) {
    if (subjectChartInstance) subjectChartInstance.destroy();

    subjectChartInstance = new Chart(subjectCtx, {
      type: "bar",
      data: {
        labels: subjectList,
        datasets: [{
          label: "Attendance %",
          data: subjectPresentRates,
          backgroundColor: accentGlow,
          borderColor: accentColor,
          borderWidth: 1.5,
          borderRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: textColor, font: { family: "'Plus Jakarta Sans', sans-serif", size: 12 } }
          },
          y: {
            min: 0,
            max: 100,
            grid: { color: gridColor },
            ticks: { 
              color: textColor, 
              font: { family: "'JetBrains Mono', monospace", size: 11 },
              callback: value => `${value}%`
            }
          }
        }
      }
    });
  }
}

// RENDER HEATMAP GRID (LAST 30 DAYS)
function renderHeatmapGrid(records) {
  const wrapper = document.getElementById("heatmapGridWrapper");
  if (!wrapper) return;

  wrapper.innerHTML = "";

  // Get past 30 days starting from today backwards
  const dates = [];
  const today = new Date();
  
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    dates.push(d);
  }

  dates.forEach(date => {
    const formattedDateStr = date.toISOString().split("T")[0];
    const localDateStr = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    
    const matches = records.filter(r => {
      const rDateStr = new Date(r.date).toISOString().split("T")[0];
      return rDateStr === formattedDateStr;
    });

    const box = document.createElement("div");
    box.className = "attendance-grid-box";

    if (matches.length > 0) {
      const statuses = matches.map(r => r.status);
      if (statuses.includes("Present")) {
        box.classList.add("present");
        box.innerText = "P";
      } else if (statuses.includes("Late")) {
        box.classList.add("late");
        box.innerText = "L";
      } else {
        box.classList.add("absent");
        box.innerText = "A";
      }
      box.title = `${localDateStr}: ${statuses.join(", ")}`;
    } else {
      box.title = `${localDateStr}: No Records`;
    }

    wrapper.appendChild(box);
  });
}

// SEED MOCK DEMO DATA
async function seedDemoData() {
  showToast("Seeding comprehensive dataset... Please wait", "info");

  try {
    const res = await fetch("/api/attendance/seed", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      }
    });

    if (res.ok) {
      const data = await res.json();
      showToast(data.message || "Successfully seeded demo dataset!", "success");
      await loadStudentsDropdown();
      await loadAttendance();
      return;
    }
  } catch (err) {
    console.warn("Backend seed route error, trying client fallback:", err);
  }

  // Client-side fallback if backend endpoint wasn't reached
  const select = document.getElementById("studentEmailSelect");
  const studentEmail = select?.value || "student@demo.edu";
  const studentName = document.getElementById("studentNameInput")?.value || "Demo Student";

  const subjects = ["Data Structures", "Machine Learning", "Linear Algebra", "Computer Networks"];
  const statuses = ["Present", "Present", "Present", "Late", "Absent"];
  
  const promises = [];
  const today = new Date();

  for (let daysAgo = 1; daysAgo <= 20; daysAgo++) {
    const d = new Date(today);
    d.setDate(today.getDate() - daysAgo);
    
    if (d.getDay() !== 0 && d.getDay() !== 6) {
      const subject = subjects[daysAgo % subjects.length];
      const status = statuses[daysAgo % statuses.length];
      
      promises.push(
        fetch("/api/attendance", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({
            studentEmail,
            studentName,
            subject,
            status,
            date: d
          })
        })
      );
    }
  }

  try {
    await Promise.all(promises);
    showToast("Successfully seeded realistic records!");
    loadAttendance();
  } catch (err) {
    showToast("Error seeding demo records", "error");
  }
}

// QUICK DEMO LOGIN (Instant access for testing)
async function quickDemoLogin(targetRole) {
  showToast(`Authenticating demo ${targetRole}...`, "info");

  try {
    const res = await fetch("/api/auth/demo-login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: targetRole })
    });

    const data = await res.json();
    if (res.ok && data.token) {
      localStorage.setItem("token", data.token);
      localStorage.setItem("role", data.role);
      localStorage.setItem("email", data.email);

      // Auto seed if admin so charts and cards immediately illuminate
      if (data.role === 'admin') {
        try {
          await fetch("/api/attendance/seed", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${data.token}`
            }
          });
        } catch (e) {
          // ignore background seed
        }
      }

      showToast(`Welcome! Logged in as Demo ${targetRole}`, "success");
      setTimeout(() => {
        window.location.href = "dashboard.html";
      }, 400);
      return;
    }
  } catch (err) {
    console.error("Demo login error:", err);
  }

  // Fallback: fill form and submit
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");
  if (emailInput && passwordInput) {
    emailInput.value = targetRole === "admin" ? "admin@demo.edu" : "student@demo.edu";
    passwordInput.value = "demopassword123";
    login();
  }
}

// INITIALIZE 3D HOVER TILT EFFECTS ON DASHBOARD CARDS
function init3DTilt() {
  const cards = document.querySelectorAll(".panel-card.glass-panel, .stat-card.glass-panel, .chart-card.glass-panel");
  
  cards.forEach(card => {
    card.addEventListener("mousemove", (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      
      // Compute subtle rotation angles (max 6deg)
      const rotateX = ((centerY - y) / centerY) * 6;
      const rotateY = ((x - centerX) / centerX) * 6;
      
      card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.015, 1.015, 1.015)`;
    });
    
    card.addEventListener("mouseleave", () => {
      card.style.transform = "perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)";
    });
  });
}