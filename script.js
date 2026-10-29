// Student Management System: demo records are stored in this browser only.
const STORAGE_KEY = "campusStudentRecords_v1";
const demoStudents = [
  { id: "demo-1", name: "Amandeep Singh", roll: "MCA2026-01", email: "amandeep@example.com", course: "MCA" },
  { id: "demo-2", name: "Simran Kaur", roll: "BCA2026-14", email: "simran@example.com", course: "BCA" },
  { id: "demo-3", name: "Harpreet Sharma", roll: "MCA2026-08", email: "harpreet@example.com", course: "MCA" }
];

const $ = (selector) => document.querySelector(selector);
const form = $("#studentForm");
const modalElement = $("#studentModal");
const modal = bootstrap.Modal.getOrCreateInstance(modalElement);
const toast = bootstrap.Toast.getOrCreateInstance($("#appToast"), { delay: 2600 });
let students = loadStudents();

function loadStudents() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved === null ? [...demoStudents] : JSON.parse(saved);
  } catch (error) {
    console.warn("Could not load saved records.", error);
    return [...demoStudents];
  }
}

function saveStudents() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(students));
  } catch (error) {
    showToast("Could not save data. Your browser storage may be disabled.");
  }
}

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[char]));
}

function showToast(message) {
  $("#toastMessage").textContent = message;
  toast.show();
}

function renderStudents() {
  const query = $("#searchInput").value.trim().toLowerCase();
  const course = $("#courseFilter").value;
  const filtered = students.filter((student) => {
    const matchesQuery = [student.name, student.roll, student.email, student.course]
      .some((value) => value.toLowerCase().includes(query));
    return matchesQuery && (!course || student.course === course);
  });

  $("#studentTableBody").innerHTML = filtered.map((student) => {
    const initials = student.name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
    return `<tr>
      <td><span class="student-avatar">${escapeHTML(initials)}</span><span class="fw-semibold">${escapeHTML(student.name)}</span></td>
      <td>${escapeHTML(student.roll)}</td>
      <td><span class="course-badge">${escapeHTML(student.course)}</span></td>
      <td><a class="text-decoration-none" href="mailto:${escapeHTML(student.email)}">${escapeHTML(student.email)}</a></td>
      <td class="text-nowrap">
        <button class="action-btn action-edit" data-action="edit" data-id="${escapeHTML(student.id)}" aria-label="Edit ${escapeHTML(student.name)}">Edit</button>
        <button class="action-btn action-delete" data-action="delete" data-id="${escapeHTML(student.id)}" aria-label="Delete ${escapeHTML(student.name)}">Delete</button>
      </td>
    </tr>`;
  }).join("");

  $("#emptyState").classList.toggle("show", filtered.length === 0);
  $("#recordSummary").textContent = `Showing ${filtered.length} of ${students.length} record${students.length === 1 ? "" : "s"}`;
  $("#totalCount").textContent = students.length;
  $("#mcaCount").textContent = students.filter(s => s.course === "MCA").length;
  $("#bcaCount").textContent = students.filter(s => s.course === "BCA").length;
  $("#otherCount").textContent = students.filter(s => !["MCA", "BCA"].includes(s.course)).length;
}

function clearForm() {
  form.reset();
  $("#studentId").value = "";
  $("#formError").classList.add("d-none");
  $("#formError").textContent = "";
  $("#studentModalLabel").textContent = "Add student";
}

function openEditForm(id) {
  const student = students.find(item => item.id === id);
  if (!student) return;
  $("#studentId").value = student.id;
  $("#studentName").value = student.name;
  $("#rollNumber").value = student.roll;
  $("#studentEmail").value = student.email;
  $("#studentCourse").value = student.course;
  $("#studentModalLabel").textContent = "Edit student";
  $("#formError").classList.add("d-none");
  modal.show();
}

$("#studentModal").addEventListener("show.bs.modal", (event) => {
  if (event.relatedTarget && event.relatedTarget.dataset.action !== "edit") clearForm();
});
$("#studentModal").addEventListener("hidden.bs.modal", clearForm);

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const id = $("#studentId").value;
  const name = $("#studentName").value.trim();
  const roll = $("#rollNumber").value.trim();
  const email = $("#studentEmail").value.trim();
  const course = $("#studentCourse").value;
  const errorBox = $("#formError");

  const duplicateRoll = students.some(s => s.roll.toLowerCase() === roll.toLowerCase() && s.id !== id);
  const duplicateEmail = students.some(s => s.email.toLowerCase() === email.toLowerCase() && s.id !== id);
  if (duplicateRoll || duplicateEmail) {
    errorBox.textContent = duplicateRoll ? "That roll number is already registered." : "That email address is already registered.";
    errorBox.classList.remove("d-none");
    return;
  }
  if (!name || !roll || !email || !course) {
    errorBox.textContent = "Please complete all required fields.";
    errorBox.classList.remove("d-none");
    return;
  }

  const record = { id: id || (globalThis.crypto?.randomUUID?.() ?? String(Date.now())), name, roll, email, course };
  if (id) {
    students = students.map(s => s.id === id ? record : s);
    showToast("Student record updated.");
  } else {
    students.push(record);
    showToast("Student added successfully.");
  }
  saveStudents();
  renderStudents();
  modal.hide();
});

$("#studentTableBody").addEventListener("click", (event) => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;
  const { action, id } = button.dataset;
  const student = students.find(s => s.id === id);
  if (!student) return;

  if (action === "edit") {
    openEditForm(id);
  } else if (action === "delete") {
    if (window.confirm(`Delete the record for ${student.name}?`)) {
      students = students.filter(s => s.id !== id);
      saveStudents();
      renderStudents();
      showToast("Student record deleted.");
    }
  }
});

$("#searchInput").addEventListener("input", renderStudents);
$("#courseFilter").addEventListener("change", renderStudents);
$("#resetDemoButton").addEventListener("click", () => {
  if (window.confirm("Reset records to the original demo students? This will replace records saved in this browser.")) {
    students = [...demoStudents];
    saveStudents();
    $("#searchInput").value = "";
    $("#courseFilter").value = "";
    renderStudents();
    showToast("Demo records restored.");
  }
});

$("#navAddButton").addEventListener("click", () => showToast("Fill in the form to add a student."));
renderStudents();
