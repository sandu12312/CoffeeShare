// TODO: Add Firebase configuration and SDK imports

// --- Initialize AOS (Animate On Scroll) --- //
document.addEventListener("DOMContentLoaded", () => {
  AOS.init({
    duration: 800, // Animation duration
    easing: "ease-in-out", // Animation timing function
    once: true, // Whether animation should happen only once - while scrolling down
    offset: 100, // Offset (in px) from the original trigger point
  });
});

// --- Mobile Navigation Toggle --- //
const mobileNavToggle = document.querySelector(".mobile-nav-toggle");
const mainNavUl = document.querySelector(".main-nav ul");

if (mobileNavToggle && mainNavUl) {
  mobileNavToggle.addEventListener("click", () => {
    mainNavUl.classList.toggle("active");
    // Optional: Change toggle icon (e.g., to 'X')
    mobileNavToggle.textContent = mainNavUl.classList.contains("active")
      ? "✕"
      : "☰";
  });

  // Close mobile nav when a link is clicked
  mainNavUl.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      if (mainNavUl.classList.contains("active")) {
        mainNavUl.classList.remove("active");
        mobileNavToggle.textContent = "☰";
      }
    });
  });
}

// --- Optional: Header Background Change on Scroll --- //
const header = document.querySelector(".main-header");
if (header) {
  window.addEventListener("scroll", () => {
    if (window.scrollY > 50) {
      // Adjust scroll threshold as needed
      header.classList.add("scrolled");
    } else {
      header.classList.remove("scrolled");
    }
  });
}

// --- Partner Form Submission --- //
document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("partner-form");
  const statusElement = document.getElementById("form-status");
  const submitButton = document.getElementById("submit-button");

  // Check if form exists on the page
  if (!form || !statusElement || !submitButton) {
    console.warn("Partner form elements not found.");
    return;
  }

  // Ensure Firebase 'db' is initialized (from index.html)
  if (typeof db === "undefined") {
    console.error(
      "Firebase Firestore (db) is not initialized. Check index.html."
    );
    statusElement.textContent = "Error: App configuration missing.";
    statusElement.className = "error";
    submitButton.disabled = true;
    return;
  }

  form.addEventListener("submit", async function (event) {
    event.preventDefault();

    submitButton.disabled = true;
    submitButton.textContent = "Submitting..."; // Change button text
    statusElement.textContent = "";
    statusElement.className = "";

    const formData = {
      businessName: form.elements["businessName"].value.trim(),
      contactName: form.elements["contactName"].value.trim(),
      email: form.elements["email"].value.trim(),
      phone: form.elements["phone"].value.trim(),
      address: form.elements["address"].value.trim(),
      message: form.elements["message"].value.trim(),
      submittedAt: firebase.firestore.FieldValue.serverTimestamp(), // Use server timestamp
    };

    if (!formData.businessName || !formData.contactName || !formData.email) {
      statusElement.textContent = "Please fill in all required fields (*).";
      statusElement.className = "error";
      submitButton.disabled = false;
      submitButton.textContent = "Submit Partnership Request";
      return;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(formData.email)) {
      statusElement.textContent = "Please enter a valid email address.";
      statusElement.className = "error";
      submitButton.disabled = false;
      submitButton.textContent = "Submit Partnership Request";
      return;
    }

    try {
      // --- Firebase Firestore Integration --- //
      // Use the 'db' instance initialized in index.html
      await db.collection("partnerRequests").add(formData);
      // --- End Firebase Integration --- //

      statusElement.textContent =
        "Thank you! Your request has been submitted successfully.";
      statusElement.className = "success";
      form.reset();
      submitButton.textContent = "Submitted!"; // Keep disabled after success
    } catch (error) {
      console.error("Error submitting form to Firestore:", error);
      statusElement.textContent =
        "An error occurred submitting your request. Please try again later.";
      statusElement.className = "error";
      submitButton.disabled = false; // Re-enable button on error
      submitButton.textContent = "Submit Partnership Request";
    }
  });
});
