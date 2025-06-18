// CoffeeShare Landing Page - Enhanced JavaScript
// Modern vanilla JavaScript for improved performance and user experience

// --- Initialize AOS (Animate On Scroll) --- //
document.addEventListener("DOMContentLoaded", () => {
  AOS.init({
    duration: 800,
    easing: "ease-in-out",
    once: true,
    offset: 120,
    disable: function () {
      // Disable animations on mobile for better performance
      return window.innerWidth < 768;
    },
  });
});

// --- Enhanced Mobile Navigation --- //
class MobileNavigation {
  constructor() {
    this.toggle = document.querySelector(".mobile-nav-toggle");
    this.navMenu = document.querySelector(".main-nav ul");
    this.navLinks = document.querySelectorAll(".main-nav ul a");
    this.body = document.body;

    this.init();
  }

  init() {
    if (!this.toggle || !this.navMenu) return;

    this.toggle.addEventListener("click", this.toggleMenu.bind(this));

    // Close menu when clicking nav links
    this.navLinks.forEach((link) => {
      link.addEventListener("click", this.closeMenu.bind(this));
    });

    // Close menu when clicking outside
    document.addEventListener("click", (e) => {
      if (!this.toggle.contains(e.target) && !this.navMenu.contains(e.target)) {
        this.closeMenu();
      }
    });

    // Handle window resize
    window.addEventListener("resize", () => {
      if (window.innerWidth > 768) {
        this.closeMenu();
      }
    });
  }

  toggleMenu() {
    const isActive = this.navMenu.classList.contains("active");

    if (isActive) {
      this.closeMenu();
    } else {
      this.openMenu();
    }
  }

  openMenu() {
    this.navMenu.classList.add("active");
    this.toggle.innerHTML = "✕";
    this.toggle.setAttribute("aria-expanded", "true");
    this.body.style.overflow = "hidden"; // Prevent scroll when menu open
  }

  closeMenu() {
    this.navMenu.classList.remove("active");
    this.toggle.innerHTML = "☰";
    this.toggle.setAttribute("aria-expanded", "false");
    this.body.style.overflow = ""; // Restore scroll
  }
}

// --- Smooth Scrolling Enhancement --- //
class SmoothScroll {
  constructor() {
    this.init();
  }

  init() {
    // Enhanced smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
      anchor.addEventListener("click", (e) => {
        e.preventDefault();
        const target = document.querySelector(anchor.getAttribute("href"));

        if (target) {
          const headerHeight =
            document.querySelector(".main-header").offsetHeight;
          const targetPosition = target.offsetTop - headerHeight - 20;

          window.scrollTo({
            top: targetPosition,
            behavior: "smooth",
          });
        }
      });
    });
  }
}

// --- Header Scroll Effects --- //
class HeaderEffects {
  constructor() {
    this.header = document.querySelector(".main-header");
    this.init();
  }

  init() {
    if (!this.header) return;

    let lastScrollY = window.scrollY;
    let ticking = false;

    const updateHeader = () => {
      const currentScrollY = window.scrollY;

      // Add scrolled class for styling
      if (currentScrollY > 100) {
        this.header.classList.add("scrolled");
      } else {
        this.header.classList.remove("scrolled");
      }

      // Hide header on scroll down, show on scroll up
      if (currentScrollY > 200) {
        if (currentScrollY > lastScrollY) {
          this.header.style.transform = "translateY(-100%)";
        } else {
          this.header.style.transform = "translateY(0)";
        }
      } else {
        this.header.style.transform = "translateY(0)";
      }

      lastScrollY = currentScrollY;
      ticking = false;
    };

    const requestTick = () => {
      if (!ticking) {
        requestAnimationFrame(updateHeader);
        ticking = true;
      }
    };

    window.addEventListener("scroll", requestTick, { passive: true });
  }
}

// --- Counter Animation --- //
class CounterAnimation {
  constructor() {
    this.counters = document.querySelectorAll(".stat-number");
    this.init();
  }

  init() {
    const observerOptions = {
      threshold: 0.7,
      rootMargin: "0px 0px -50px 0px",
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          this.animateCounter(entry.target);
          observer.unobserve(entry.target);
        }
      });
    }, observerOptions);

    this.counters.forEach((counter) => observer.observe(counter));
  }

  animateCounter(element) {
    const target = parseInt(element.textContent.replace(/\D/g, ""));
    const duration = 2000;
    const step = target / (duration / 16);
    let current = 0;

    const timer = setInterval(() => {
      current += step;
      if (current >= target) {
        element.textContent = this.formatNumber(target);
        clearInterval(timer);
      } else {
        element.textContent = this.formatNumber(Math.floor(current));
      }
    }, 16);
  }

  formatNumber(num) {
    if (num >= 1000) {
      return (num / 1000).toFixed(0) + "K+";
    }
    return num + "+";
  }
}

// --- Enhanced Form Handler --- //
class FormHandler {
  constructor() {
    this.form = document.getElementById("partner-form");
    this.statusElement = document.getElementById("form-status");
    this.submitButton = this.form?.querySelector('button[type="submit"]');
    this.init();
  }

  init() {
    if (!this.form) return;

    this.form.addEventListener("submit", this.handleSubmit.bind(this));
    this.addFormValidation();
  }

  addFormValidation() {
    const inputs = this.form.querySelectorAll(
      "input[required], select[required], textarea[required]"
    );

    inputs.forEach((input) => {
      input.addEventListener("blur", () => this.validateField(input));
      input.addEventListener("input", () => this.clearFieldError(input));
    });
  }

  validateField(field) {
    const value = field.value.trim();
    let isValid = true;
    let errorMessage = "";

    // Check if required field is empty
    if (field.hasAttribute("required") && !value) {
      isValid = false;
      errorMessage = "This field is required";
    }

    // Email validation
    if (field.type === "email" && value) {
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailPattern.test(value)) {
        isValid = false;
        errorMessage = "Please enter a valid email address";
      }
    }

    // Phone validation
    if (field.type === "tel" && value) {
      const phonePattern = /^[\+]?[0-9\s\-\(\)]{10,}$/;
      if (!phonePattern.test(value)) {
        isValid = false;
        errorMessage = "Please enter a valid phone number";
      }
    }

    this.setFieldError(field, isValid ? "" : errorMessage);
    return isValid;
  }

  setFieldError(field, message) {
    const existingError = field.parentNode.querySelector(".field-error");

    if (message) {
      field.style.borderColor = "var(--error-color)";
      if (!existingError) {
        const errorDiv = document.createElement("div");
        errorDiv.className = "field-error";
        errorDiv.style.color = "var(--error-color)";
        errorDiv.style.fontSize = "0.85rem";
        errorDiv.style.marginTop = "0.25rem";
        errorDiv.textContent = message;
        field.parentNode.appendChild(errorDiv);
      } else {
        existingError.textContent = message;
      }
    } else {
      field.style.borderColor = "";
      if (existingError) {
        existingError.remove();
      }
    }
  }

  clearFieldError(field) {
    field.style.borderColor = "";
    const existingError = field.parentNode.querySelector(".field-error");
    if (existingError) {
      existingError.remove();
    }
  }

  async handleSubmit(event) {
    event.preventDefault();

    // Validate all fields
    const inputs = this.form.querySelectorAll(
      "input[required], select[required], textarea[required]"
    );
    let isFormValid = true;

    inputs.forEach((input) => {
      if (!this.validateField(input)) {
        isFormValid = false;
      }
    });

    if (!isFormValid) {
      this.showStatus("Please correct the errors above.", "error");
      return;
    }

    this.setSubmitState(true);

    const formData = {
      businessName: this.form.elements["business-name"].value.trim(),
      contactName: this.form.elements["contact-name"].value.trim(),
      email: this.form.elements["email"].value.trim(),
      phone: this.form.elements["phone"].value.trim(),
      location: this.form.elements["location"].value.trim(),
      businessType: this.form.elements["business-type"].value,
      message: this.form.elements["message"].value.trim(),
      status: "pending",
      source: "landing_page",
      submittedAt: new Date().toISOString(),
      userAgent: navigator.userAgent,
      referrer: document.referrer,
    };

    try {
      // Simulate API call (replace with actual endpoint)
      await this.simulateApiCall(formData);

      this.showStatus(
        "Thank you! Your partnership request has been submitted successfully. We'll be in touch within 24 hours.",
        "success"
      );
      this.form.reset();
      this.setSubmitState(false, "Submitted!");

      // Track successful submission
      this.trackEvent("form_submit", "partnership_request");
    } catch (error) {
      console.error("Form submission error:", error);
      this.showStatus(
        "We're experiencing technical difficulties. Please try again or contact us directly at hello@coffeeshare.ro",
        "error"
      );
      this.setSubmitState(false);
    }
  }

  async simulateApiCall(data) {
    // Simulate network delay
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // Simulate random success/failure for demo
        if (Math.random() > 0.1) {
          // 90% success rate
          resolve(data);
        } else {
          reject(new Error("Network error"));
        }
      }, 1500);
    });
  }

  setSubmitState(isSubmitting, customText = null) {
    if (isSubmitting) {
      this.submitButton.disabled = true;
      this.submitButton.innerHTML = `
        <span>Submitting...</span>
        <span class="spinner" style="
          display: inline-block;
          width: 16px;
          height: 16px;
          border: 2px solid transparent;
          border-top: 2px solid currentColor;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-left: 0.5rem;
        "></span>
      `;
    } else {
      this.submitButton.disabled = false;
      this.submitButton.innerHTML = `
        <span>${customText || "Send Partnership Request"}</span>
        <span class="button-icon">→</span>
      `;
    }
  }

  showStatus(message, type) {
    this.statusElement.textContent = message;
    this.statusElement.className = type;
    this.statusElement.style.display = "block";

    // Auto-hide after 10 seconds for success messages
    if (type === "success") {
      setTimeout(() => {
        this.statusElement.style.display = "none";
      }, 10000);
    }
  }

  trackEvent(action, category) {
    // Analytics tracking (implement with your preferred analytics service)
    if (typeof gtag !== "undefined") {
      gtag("event", action, {
        event_category: category,
        event_label: "CoffeeShare Landing Page",
      });
    }
  }
}

// --- Interactive Elements --- //
class InteractiveElements {
  constructor() {
    this.init();
  }

  init() {
    this.addHoverEffects();
    this.addClickAnimations();
    this.addParallaxEffect();
  }

  addHoverEffects() {
    // Enhanced hover effects for cards
    const cards = document.querySelectorAll(
      ".step, .plan-card, .feature-image img"
    );

    cards.forEach((card) => {
      card.addEventListener("mouseenter", () => {
        card.style.transition = "transform 0.3s ease, box-shadow 0.3s ease";
      });
    });
  }

  addClickAnimations() {
    // Add ripple effect to buttons
    const buttons = document.querySelectorAll(
      ".cta-button, .plan-button, .nav-button"
    );

    buttons.forEach((button) => {
      button.addEventListener("click", (e) => {
        const ripple = document.createElement("span");
        const rect = button.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = e.clientX - rect.left - size / 2;
        const y = e.clientY - rect.top - size / 2;

        ripple.style.cssText = `
          position: absolute;
          width: ${size}px;
          height: ${size}px;
          left: ${x}px;
          top: ${y}px;
          background: rgba(255, 255, 255, 0.3);
          border-radius: 50%;
          transform: scale(0);
          animation: ripple 0.6s linear;
          pointer-events: none;
        `;

        button.style.position = "relative";
        button.style.overflow = "hidden";
        button.appendChild(ripple);

        setTimeout(() => ripple.remove(), 600);
      });
    });
  }

  addParallaxEffect() {
    // Subtle parallax effect for hero section
    const hero = document.querySelector(".hero-background img");
    if (!hero) return;

    window.addEventListener(
      "scroll",
      () => {
        const scrolled = window.pageYOffset;
        const rate = scrolled * -0.5;
        hero.style.transform = `translateY(${rate}px)`;
      },
      { passive: true }
    );
  }
}

// --- Performance Optimization --- //
class PerformanceOptimizer {
  constructor() {
    this.init();
  }

  init() {
    this.lazyLoadImages();
    this.preloadCriticalResources();
  }

  lazyLoadImages() {
    const images = document.querySelectorAll("img[data-src]");

    const imageObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = img.dataset.src;
          img.classList.remove("lazy");
          imageObserver.unobserve(img);
        }
      });
    });

    images.forEach((img) => imageObserver.observe(img));
  }

  preloadCriticalResources() {
    // Preload important images
    const criticalImages = [
      "https://images.pexels.com/photos/2074130/pexels-photo-2074130.jpeg",
      "./assets/images/patrick-tomasso-GXXYkSwndP4-unsplash.jpg",
    ];

    criticalImages.forEach((src) => {
      const link = document.createElement("link");
      link.rel = "preload";
      link.as = "image";
      link.href = src;
      document.head.appendChild(link);
    });
  }
}

// --- Initialize All Components --- //
document.addEventListener("DOMContentLoaded", () => {
  new MobileNavigation();
  new SmoothScroll();
  new HeaderEffects();
  new CounterAnimation();
  new FormHandler();
  new InteractiveElements();
  new PerformanceOptimizer();
});

// --- Add CSS animations via JavaScript --- //
const style = document.createElement("style");
style.textContent = `
  @keyframes ripple {
    to {
      transform: scale(4);
      opacity: 0;
    }
  }
  
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
  
  .lazy {
    opacity: 0;
    transition: opacity 0.3s;
  }
  
  .field-error {
    animation: fadeIn 0.3s ease;
  }
  
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(-10px); }
    to { opacity: 1; transform: translateY(0); }
  }
`;
document.head.appendChild(style);
