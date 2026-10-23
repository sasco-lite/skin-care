// Nikhar Skincare - Admin Dashboard Front-End JavaScript
// KPI count-up, Chart.js 4 visualizers, Bookings Table with Search/Filters/Pagination
// Zero emojis anywhere

(function () {
  "use strict";

  // State
  let currentPage = 1;
  const pageLimit = 15;
  let chartInstances = {};
  let deleteTargetId = null;

  // Count-Up Animation Helper
  function animateValue(element, start, end, duration = 800, isPercent = false) {
    if (!element) return;
    const numEnd = parseInt(end, 10) || 0;
    if (isNaN(numEnd)) {
      element.textContent = end;
      return;
    }
    const range = numEnd - start;
    let current = start;
    const stepTime = Math.abs(Math.floor(duration / (range || 1)));
    const startTime = performance.now();

    function update(time) {
      const elapsed = time - startTime;
      const progress = Math.min(elapsed / duration, 1);
      current = Math.floor(start + range * progress);
      element.textContent = isPercent ? `${current}%` : current.toLocaleString();
      if (progress < 1) {
        requestAnimationFrame(update);
      } else {
        element.textContent = isPercent ? `${numEnd}%` : numEnd.toLocaleString();
      }
    }
    requestAnimationFrame(update);
  }

  // Load KPI Stats & Charts Data
  async function loadStats() {
    try {
      const res = await fetch("/admin/api/stats");
      const data = await res.json();

      const warningEl = document.getElementById("adminDbWarning");
      const dbStatusBadge = document.getElementById("dbStatusBadge");

      if (data.db === "offline") {
        if (warningEl) warningEl.style.display = "flex";
        if (dbStatusBadge) {
          dbStatusBadge.className = "db-status-pill offline";
          dbStatusBadge.querySelector(".status-label").textContent = "Database: offline";
        }
      } else {
        if (warningEl) warningEl.style.display = "none";
        if (dbStatusBadge) {
          dbStatusBadge.className = "db-status-pill online";
          dbStatusBadge.querySelector(".status-label").textContent = "Database: online";
        }
      }

      const kpis = data.kpis || {};
      animateValue(document.getElementById("kpiTotal"), 0, kpis.total || 0);
      animateValue(document.getElementById("kpiToday"), 0, kpis.today || 0);
      animateValue(document.getElementById("kpiPending"), 0, kpis.pending || 0);
      animateValue(document.getElementById("kpiConfirmed"), 0, kpis.confirmed || 0);

      const completionEl = document.getElementById("kpiCompletion");
      if (completionEl) {
        const rateVal = parseInt(kpis.completionRate, 10) || 0;
        animateValue(completionEl, 0, rateVal, 800, true);
      }

      animateValue(document.getElementById("kpiClicks"), 0, kpis.totalClicks || 0);

      // Render Charts if Chart.js is available
      if (typeof Chart !== "undefined" && data.charts) {
        renderCharts(data.charts);
      }
    } catch (err) {
      console.warn("Failed to load dashboard stats:", err);
    }
  }

  // Render Charts with Chart.js 4
  function renderCharts(c) {
    const defaultFont = { family: "'Poppins', sans-serif", size: 12 };

    // 1. 30-Day Trend (Area Line)
    const ctxTrend = document.getElementById("chartTrend");
    if (ctxTrend && c.trend) {
      if (chartInstances.trend) chartInstances.trend.destroy();
      chartInstances.trend = new Chart(ctxTrend, {
        type: "line",
        data: {
          labels: c.trend.labels || [],
          datasets: [
            {
              label: "Bookings",
              data: c.trend.data || [],
              borderColor: "#2D5A43",
              backgroundColor: "rgba(45, 90, 67, 0.12)",
              fill: true,
              tension: 0.35,
              borderWidth: 2,
              pointBackgroundColor: "#2D5A43",
              pointRadius: 3
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: { cornerRadius: 8, padding: 10 }
          },
          scales: {
            y: { beginAtZero: true, ticks: { precision: 0, font: defaultFont }, grid: { color: "rgba(0,0,0,0.04)" } },
            x: { ticks: { font: defaultFont }, grid: { display: false } }
          }
        }
      });
    }

    // 2. Status Split (Doughnut)
    const ctxStatus = document.getElementById("chartStatus");
    if (ctxStatus && c.status) {
      if (chartInstances.status) chartInstances.status.destroy();
      chartInstances.status = new Chart(ctxStatus, {
        type: "doughnut",
        data: {
          labels: ["Pending", "Confirmed", "Completed", "Cancelled"],
          datasets: [
            {
              data: [
                c.status.pending || 0,
                c.status.confirmed || 0,
                c.status.completed || 0,
                c.status.cancelled || 0
              ],
              backgroundColor: ["#D97706", "#2D5A43", "#6B46C1", "#E53E3E"],
              borderWidth: 2,
              borderColor: "#FFFFFF"
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: "bottom", labels: { font: defaultFont, boxWidth: 12 } }
          },
          cutout: "68%"
        }
      });
    }

    // 3. Bookings by Service (Horizontal Bar)
    const ctxServices = document.getElementById("chartServices");
    if (ctxServices && c.services) {
      if (chartInstances.services) chartInstances.services.destroy();
      const sLabels = Object.keys(c.services);
      const sData = Object.values(c.services);
      chartInstances.services = new Chart(ctxServices, {
        type: "bar",
        data: {
          labels: sLabels.length ? sLabels : ["No data"],
          datasets: [
            {
              data: sData.length ? sData : [0],
              backgroundColor: "#2D5A43",
              borderRadius: 6
            }
          ]
        },
        options: {
          indexAxis: "y",
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: { beginAtZero: true, ticks: { precision: 0, font: defaultFont }, grid: { color: "rgba(0,0,0,0.04)" } },
            y: { ticks: { font: { ...defaultFont, size: 10 } }, grid: { display: false } }
          }
        }
      });
    }

    // 4. Popular Time Slots (Vertical Bar)
    const ctxSlots = document.getElementById("chartSlots");
    if (ctxSlots && c.slots) {
      if (chartInstances.slots) chartInstances.slots.destroy();
      const slotLabels = Object.keys(c.slots);
      const slotData = Object.values(c.slots);
      chartInstances.slots = new Chart(ctxSlots, {
        type: "bar",
        data: {
          labels: slotLabels.length ? slotLabels : ["No data"],
          datasets: [
            {
              data: slotData.length ? slotData : [0],
              backgroundColor: "#DDA133",
              borderRadius: 6
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            y: { beginAtZero: true, ticks: { precision: 0, font: defaultFont }, grid: { color: "rgba(0,0,0,0.04)" } },
            x: { ticks: { font: { ...defaultFont, size: 10 } }, grid: { display: false } }
          }
        }
      });
    }

    // 5. Language Split (Pie)
    const ctxLang = document.getElementById("chartLanguage");
    if (ctxLang && c.language) {
      if (chartInstances.language) chartInstances.language.destroy();
      chartInstances.language = new Chart(ctxLang, {
        type: "pie",
        data: {
          labels: ["English (EN)", "Hindi (HI)"],
          datasets: [
            {
              data: [c.language.en || 0, c.language.hi || 0],
              backgroundColor: ["#2D5A43", "#DDA133"],
              borderWidth: 2,
              borderColor: "#FFFFFF"
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: "bottom", labels: { font: defaultFont, boxWidth: 12 } }
          }
        }
      });
    }

    // 6. Contact Clicks by Type (Bar)
    const ctxClicks = document.getElementById("chartClicks");
    if (ctxClicks && c.clicks) {
      if (chartInstances.clicks) chartInstances.clicks.destroy();
      const clickLabels = Object.keys(c.clicks);
      const clickData = Object.values(c.clicks);
      chartInstances.clicks = new Chart(ctxClicks, {
        type: "bar",
        data: {
          labels: clickLabels.length ? clickLabels : ["No inquiries"],
          datasets: [
            {
              data: clickData.length ? clickData : [0],
              backgroundColor: "#6B46C1",
              borderRadius: 6
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            y: { beginAtZero: true, ticks: { precision: 0, font: defaultFont }, grid: { color: "rgba(0,0,0,0.04)" } },
            x: { ticks: { font: defaultFont }, grid: { display: false } }
          }
        }
      });
    }
  }

  // Load Bookings Table Data
  async function loadBookings() {
    const tbody = document.getElementById("bookingsTableBody");
    if (!tbody) return;

    const search = (document.getElementById("tableSearch")?.value || "").trim();
    const status = (document.getElementById("filterStatus")?.value || "").trim();
    const date = (document.getElementById("filterDate")?.value || "").trim();

    const params = new URLSearchParams({
      page: currentPage,
      limit: pageLimit
    });
    if (search) params.append("search", search);
    if (status) params.append("status", status);
    if (date) params.append("date", date);

    try {
      tbody.innerHTML = `<tr><td colspan="8" class="text-center py-6 text-muted">Loading appointments...</td></tr>`;

      const res = await fetch(`/admin/api/bookings?${params.toString()}`);
      const data = await res.json();

      if (!data.ok || !Array.isArray(data.bookings) || data.bookings.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" class="text-center py-8 text-muted">No appointments found.</td></tr>`;
        updatePagination(0, 0, 1, 1);
        return;
      }

      tbody.innerHTML = data.bookings.map((b) => renderBookingRow(b)).join("");
      updatePagination(data.bookings.length, data.total, data.page, data.totalPages);
      attachRowEventListeners();
    } catch {
      tbody.innerHTML = `<tr><td colspan="8" class="text-center py-8 text-danger">Unable to load appointments. Please check connection.</td></tr>`;
    }
  }

  // Render Single Table Row
  function renderBookingRow(b) {
    const safeRef = escapeHtml(b.ref);
    const safeName = escapeHtml(b.fullName);
    const safePhone = escapeHtml(b.phone);
    const safeEmail = escapeHtml(b.email || "-");
    const safeService = escapeHtml(b.service);
    const safeDate = escapeHtml(b.date);
    const safeSlot = escapeHtml(b.slot);
    const safeLang = (b.lang || "en").toUpperCase();
    const status = b.status || "pending";

    const waLink = `https://wa.me/91${safePhone}?text=${encodeURIComponent(`Hello ${safeName}, regarding your Nikhar Skincare appointment (${safeRef}) on ${safeDate} at ${safeSlot}: `)}`;

    return `
      <tr data-id="${b._id}">
        <td><span class="ref-pill">${safeRef}</span></td>
        <td>
          <strong>${safeName}</strong>
          ${safeEmail !== "-" ? `<br><small class="text-muted">${safeEmail}</small>` : ""}
        </td>
        <td>
          <div class="table-row-actions">
            <span>+91 ${safePhone}</span>
            <a href="${waLink}" target="_blank" rel="noopener noreferrer" class="action-btn-icon" title="Chat on WhatsApp">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#25D366" stroke-width="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
            </a>
            <a href="tel:+91${safePhone}" class="action-btn-icon" title="Call Customer">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2D5A43" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
            </a>
          </div>
        </td>
        <td><small>${safeService}</small></td>
        <td>
          <strong>${safeDate}</strong><br>
          <small class="text-muted">${safeSlot}</small>
        </td>
        <td><span class="text-xs font-semibold">${safeLang}</span></td>
        <td>
          <select class="status-select-inline" data-id="${b._id}">
            <option value="pending" ${status === "pending" ? "selected" : ""}>Pending</option>
            <option value="confirmed" ${status === "confirmed" ? "selected" : ""}>Confirmed</option>
            <option value="completed" ${status === "completed" ? "selected" : ""}>Completed</option>
            <option value="cancelled" ${status === "cancelled" ? "selected" : ""}>Cancelled</option>
          </select>
        </td>
        <td>
          <button class="action-btn-icon delete btn-delete-row" data-id="${b._id}" data-ref="${safeRef}" title="Delete Booking">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
          </button>
        </td>
      </tr>
    `;
  }

  // Attach Listeners to Table Rows (Status dropdown and Delete button)
  function attachRowEventListeners() {
    // Status Change
    document.querySelectorAll(".status-select-inline").forEach((select) => {
      select.addEventListener("change", async (e) => {
        const id = e.target.getAttribute("data-id");
        const newStatus = e.target.value;
        try {
          const res = await fetch(`/admin/api/bookings/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: newStatus })
          });
          const data = await res.json();
          if (data.ok) {
            loadStats(); // Update KPI counts
          } else {
            alert(data.error || "Failed to update status");
            loadBookings();
          }
        } catch {
          alert("Connection error while updating status");
          loadBookings();
        }
      });
    });

    // Delete Button
    document.querySelectorAll(".btn-delete-row").forEach((btn) => {
      btn.addEventListener("click", () => {
        deleteTargetId = btn.getAttribute("data-id");
        const ref = btn.getAttribute("data-ref");
        const modal = document.getElementById("deleteModal");
        const refEl = document.getElementById("deleteTargetRef");
        if (refEl) refEl.textContent = ref;
        if (modal) modal.style.display = "flex";
      });
    });
  }

  // Update Pagination Controls
  function updatePagination(currentCount, total, page, totalPages) {
    const infoEl = document.getElementById("paginationInfo");
    const prevBtn = document.getElementById("prevPageBtn");
    const nextBtn = document.getElementById("nextPageBtn");
    const pageIndicator = document.getElementById("currentPageIndicator");

    if (infoEl) {
      infoEl.textContent = `Showing ${currentCount} of ${total} appointments`;
    }

    if (pageIndicator) {
      pageIndicator.textContent = `Page ${page} of ${totalPages}`;
    }

    if (prevBtn) prevBtn.disabled = page <= 1;
    if (nextBtn) nextBtn.disabled = page >= totalPages;
  }

  // Helper Escape HTML to prevent XSS
  function escapeHtml(str) {
    if (!str) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  // Initialization
  document.addEventListener("DOMContentLoaded", () => {
    // Initial Load
    loadStats();
    loadBookings();

    // Refresh Button
    const refreshBtn = document.getElementById("refreshDataBtn");
    if (refreshBtn) {
      refreshBtn.addEventListener("click", () => {
        loadStats();
        loadBookings();
      });
    }

    // Check DB Button
    const retryDbBtn = document.getElementById("retryDbBtn");
    if (retryDbBtn) {
      retryDbBtn.addEventListener("click", () => {
        loadStats();
        loadBookings();
      });
    }

    // Logout Button
    const logoutBtn = document.getElementById("adminLogoutBtn");
    if (logoutBtn) {
      logoutBtn.addEventListener("click", async () => {
        try {
          await fetch("/admin/api/logout", { method: "POST" });
          window.location.href = "/admin/login";
        } catch {
          window.location.href = "/admin/login";
        }
      });
    }

    // Filter Listeners
    let debounceTimer;
    const searchInput = document.getElementById("tableSearch");
    if (searchInput) {
      searchInput.addEventListener("input", () => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          currentPage = 1;
          loadBookings();
        }, 300);
      });
    }

    const filterStatus = document.getElementById("filterStatus");
    if (filterStatus) {
      filterStatus.addEventListener("change", () => {
        currentPage = 1;
        loadBookings();
      });
    }

    const filterDate = document.getElementById("filterDate");
    if (filterDate) {
      filterDate.addEventListener("change", () => {
        currentPage = 1;
        loadBookings();
      });
    }

    const clearFiltersBtn = document.getElementById("clearFiltersBtn");
    if (clearFiltersBtn) {
      clearFiltersBtn.addEventListener("click", () => {
        if (searchInput) searchInput.value = "";
        if (filterStatus) filterStatus.value = "";
        if (filterDate) filterDate.value = "";
        currentPage = 1;
        loadBookings();
      });
    }

    // Pagination Listeners
    const prevBtn = document.getElementById("prevPageBtn");
    if (prevBtn) {
      prevBtn.addEventListener("click", () => {
        if (currentPage > 1) {
          currentPage -= 1;
          loadBookings();
        }
      });
    }

    const nextBtn = document.getElementById("nextPageBtn");
    if (nextBtn) {
      nextBtn.addEventListener("click", () => {
        currentPage += 1;
        loadBookings();
      });
    }

    // Modal Listeners
    const modal = document.getElementById("deleteModal");
    const cancelDeleteBtn = document.getElementById("cancelDeleteBtn");
    const confirmDeleteBtn = document.getElementById("confirmDeleteBtn");

    if (cancelDeleteBtn && modal) {
      cancelDeleteBtn.addEventListener("click", () => {
        modal.style.display = "none";
        deleteTargetId = null;
      });
    }

    if (confirmDeleteBtn && modal) {
      confirmDeleteBtn.addEventListener("click", async () => {
        if (!deleteTargetId) return;
        confirmDeleteBtn.disabled = true;
        try {
          const res = await fetch(`/admin/api/bookings/${deleteTargetId}`, {
            method: "DELETE"
          });
          const data = await res.json();
          if (data.ok) {
            modal.style.display = "none";
            deleteTargetId = null;
            loadStats();
            loadBookings();
          } else {
            alert(data.error || "Failed to delete booking");
          }
        } catch {
          alert("Connection error while deleting");
        } finally {
          confirmDeleteBtn.disabled = false;
        }
      });
    }
  });
})();
