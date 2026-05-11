// ================= GLOBAL =================

// FORCE LOGIN PROTECTION
if (window.location.pathname.includes("index.html")) {
  const token = localStorage.getItem("token")
  if (!token) {
    window.location.href = "login.html"
  }
}
const token = localStorage.getItem("token")
const role = localStorage.getItem("role")
const email = localStorage.getItem("email")

// ================= AUTH =================

// SIGNUP
async function signup() {
  const emailInput = document.getElementById("email")?.value.trim()
  const passwordInput = document.getElementById("password")?.value.trim()
  const roleInput = document.getElementById("role")?.value

  if (!emailInput || !passwordInput || !roleInput) {
    alert("⚠️ Fill all fields")
    return
  }

  try {
    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: emailInput,
        password: passwordInput,
        role: roleInput
      })
    })

    const data = await res.json()

    if (data.message === "User already exists") {
      alert("⚠️ User already exists")
      return
    }

    alert("✅ Signup successful")
    window.location.href = "login.html"
  } catch {
    alert("❌ Signup failed")
  }
}

// LOGIN
async function login() {
  const emailInput = document.getElementById("email")?.value.trim()
  const passwordInput = document.getElementById("password")?.value.trim()

  if (!emailInput || !passwordInput) {
    alert("⚠️ Enter email & password")
    return
  }

  try {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: emailInput,
        password: passwordInput
      })
    })

    const data = await res.json()

    if (!data.token) {
      alert("❌ Invalid credentials")
      return
    }

    // SAVE
    localStorage.setItem("token", data.token)
    localStorage.setItem("role", data.role)
    localStorage.setItem("email", emailInput)

    window.location.href = "index.html"
  } catch {
    alert("❌ Login error")
  }
}

// ================= INIT =================

const userInfoEl = document.getElementById("userInfo")

if (userInfoEl) {
  if (!token) {
    window.location.href = "login.html"
  }

  // FIX undefined issue
  userInfoEl.innerHTML = `
    ${email || "User"} 
    <span class="badge ${role}">${role}</span>
  `

  // hide admin panel
  if (role === "student") {
    document.getElementById("adminPanel")?.remove()
  }

  loadAttendance()
}

// ================= ATTENDANCE =================

// LOAD
async function loadAttendance() {
  const list = document.getElementById("list")
  if (!list) return

  list.innerHTML = "<p>Loading...</p>"

  try {
    const res = await fetch("/api/attendance", {
      headers: { Authorization: token }
    })

    const data = await res.json()

    list.innerHTML = ""

    let total = data.length
    let present = 0

    data.forEach(i => {
      if (i.status === "Present") present++

      const li = document.createElement("li")

      li.innerHTML = `
        <span>${i.name} - ${i.subject} - ${i.status}</span>
        ${
          role === "admin"
            ? `<button onclick="deleteAttendance('${i._id}')">✖</button>`
            : ""
        }
      `

      list.appendChild(li)
    })

    // stats
    document.getElementById("total").innerText = total
    document.getElementById("present").innerText = present
    document.getElementById("percent").innerText =
      total ? ((present / total) * 100).toFixed(1) + "%" : "0%"

  } catch {
    list.innerHTML = "<p>Error loading data</p>"
  }
}

// ADD
async function addAttendance() {
  const name = document.getElementById("name")?.value.trim()
  const subject = document.getElementById("subject")?.value.trim()
  const status = document.getElementById("status")?.value

  if (!name || !subject) {
    alert("⚠️ Fill all fields")
    return
  }

  await fetch("/api/attendance", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: token
    },
    body: JSON.stringify({ name, subject, status })
  })

  loadAttendance()
}

// DELETE
async function deleteAttendance(id) {
  if (!confirm("Delete this record?")) return

  await fetch(`/api/attendance/${id}`, {
    method: "DELETE",
    headers: { Authorization: token }
  })

  loadAttendance()
}

// ================= SEARCH =================

function searchAttendance() {
  const query = document.getElementById("search")?.value.toLowerCase()

  document.querySelectorAll("#list li").forEach(li => {
    li.style.display = li.innerText.toLowerCase().includes(query)
      ? "flex"
      : "none"
  })
}

// ================= FILTER =================

function filterAttendance() {
  const status = document.getElementById("filterStatus")?.value

  document.querySelectorAll("#list li").forEach(li => {
    li.style.display =
      status === "" || li.innerText.includes(status)
        ? "flex"
        : "none"
  })
}

// ================= UI =================

function logout() {
  localStorage.clear()
  window.location.href = "login.html"
}

function toggleTheme() {
  document.body.classList.toggle("dark")
}