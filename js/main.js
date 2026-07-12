document.addEventListener('DOMContentLoaded', () => {
    const navbar = document.querySelector('.navbar');
    const navToggle = document.querySelector('.nav-toggle');
    const navLinks = document.querySelector('.nav-links');
    const navLinkItems = document.querySelectorAll('.nav-link');
    const scrollTopBtn = document.querySelector('.scroll-top');
    const sections = document.querySelectorAll('.section, .hero');
    const skillBars = document.querySelectorAll('.skill-bar-fill');
    const fadeElements = document.querySelectorAll('.fade-in');
 
    // Navbar scroll effect
    function handleScroll() {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
 
        // Scroll-to-top button visibility
        if (window.scrollY > 400) {
            scrollTopBtn.classList.add('visible');
        } else {
            scrollTopBtn.classList.remove('visible');
        }
 
        // Active nav link based on scroll position
        let current = '';
        sections.forEach(section => {
            const sectionTop = section.offsetTop - 100;
            if (window.scrollY >= sectionTop) {
                current = section.getAttribute('id');
            }
        });
 
        navLinkItems.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === '#' + current) {
                link.classList.add('active');
            }
        });
    }
 
    window.addEventListener('scroll', handleScroll);
    handleScroll();
 
    // Mobile menu toggle
    if (navToggle) {
        navToggle.addEventListener('click', () => {
            navLinks.classList.toggle('active');
        });
    }
 
    // Close mobile menu on link click
    navLinkItems.forEach(link => {
        link.addEventListener('click', () => {
            navLinks.classList.remove('active');
        });
    });
 
    // Scroll to top
    if (scrollTopBtn) {
        scrollTopBtn.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }
 
    // Skill bar animation on scroll
    const skillObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const bar = entry.target;
                const width = bar.getAttribute('data-width');
                bar.style.width = width + '%';
                skillObserver.unobserve(bar);
            }
        });
    }, { threshold: 0.3 });
 
    skillBars.forEach(bar => skillObserver.observe(bar));
 
    // Fade-in animation on scroll
    const fadeObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                fadeObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });
 
    fadeElements.forEach(el => fadeObserver.observe(el));
 
    // Contact form handling
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = contactForm.querySelector('input[type="text"]').value;
            const email = contactForm.querySelector('input[type="email"]').value;
            const message = contactForm.querySelector('textarea').value;
 
            if (name && email && message) {
                const btn = contactForm.querySelector('button');
                const originalText = btn.innerHTML;
                btn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg> Message Sent!';
                btn.style.background = '#22c55e';
                btn.disabled = true;
 
                setTimeout(() => {
                    btn.innerHTML = originalText;
                    btn.style.background = '';
                    btn.disabled = false;
                    contactForm.reset();
                }, 3000);
            }
        });
    }
 
    // Counter animation for about stats
    const statNumbers = document.querySelectorAll('.about-stat-number');
    const counterObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const el = entry.target;
                const target = parseInt(el.getAttribute('data-count'));
                if (isNaN(target)) return;
                let count = 0;
                const increment = Math.max(1, Math.floor(target / 40));
                const timer = setInterval(() => {
                    count += increment;
                    if (count >= target) {
                        count = target;
                        clearInterval(timer);
                    }
                    el.textContent = count;
                }, 30);
                counterObserver.unobserve(el);
            }
        });
    }, { threshold: 0.5 });
 
    statNumbers.forEach(el => counterObserver.observe(el));
 
    // Analytics helper — sends to GA if configured, always logs locally
    function trackEvent(category, action, label) {
        if (typeof gtag === 'function') {
            gtag('event', action, {
                event_category: category,
                event_label: label
            });
        }
 
        // Local analytics log (persisted in localStorage)
        var log = JSON.parse(localStorage.getItem('portfolio_analytics') || '[]');
        log.push({
            category: category,
            action: action,
            label: label,
            timestamp: new Date().toISOString()
        });
        localStorage.setItem('portfolio_analytics', JSON.stringify(log));
    }
 
    // Track CV button clicks (hero Open CV + navbar Download CV)
    var cvButtons = document.querySelectorAll('a[href*="Mahmoud_Gamal_CV"]');
    cvButtons.forEach(function (btn) {
        btn.addEventListener('click', function () {
            var label = btn.classList.contains('nav-cv-btn') ? 'download_cv_navbar' : 'open_cv_hero';
            trackEvent('CV', 'click', label);
        });
    });
 
    // Force PDF download for the CV download link
    var cvDownloadLink = document.getElementById('download-cv-link');
    if (cvDownloadLink) {
        cvDownloadLink.addEventListener('click', async function (event) {
            var url = cvDownloadLink.href;
            var filename = cvDownloadLink.getAttribute('download') || 'Mahmoud_Gamal_CV.pdf';
            if (!url || !filename.toLowerCase().endsWith('.pdf')) {
                return;
            }
 
            event.preventDefault();
            event.stopPropagation();
            try {
                var response = await fetch(url);
                if (!response.ok) {
                    window.location.href = url;
                    return;
                }
 
                var blob = await response.blob();
                var objectUrl = URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));
                var tempLink = document.createElement('a');
                tempLink.href = objectUrl;
                tempLink.download = filename;
                document.body.appendChild(tempLink);
                tempLink.click();
                document.body.removeChild(tempLink);
                URL.revokeObjectURL(objectUrl);
            } catch (error) {
                console.error('PDF download fallback failed:', error);
                window.location.href = url;
            }
        });
    }
 
    // Track mobile menu nav link clicks
    navLinkItems.forEach(function (link) {
        link.addEventListener('click', function () {
            var isMobile = window.innerWidth <= 768;
            if (isMobile) {
                trackEvent('Navigation', 'click', 'mobile_menu_' + link.textContent.trim());
            }
        });
    });
});