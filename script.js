/* =============================================================
   THE COZIER AUDIT — script.js
   Functions:
     1.  Reading Progress Bar
     2.  Active Nav Link on Scroll
     3.  Nav Scroll Fade Indicators
     4.  Timeline Entry Fade-in on Scroll
     5.  Timeline Entry Count Badge
     6.  Copy Citation to Clipboard
     7.  Keyboard Accessibility — Skip Link
     8.  Accessible Smooth Scroll
     9.  Print Button
     10. Back to Top Button
   ============================================================= */


/* ─────────────────────────────────────────
   1. READING PROGRESS BAR
   Updates a fixed bar at the top of the
   viewport to reflect scroll depth.
───────────────────────────────────────── */
(function initProgressBar() {
  const bar = document.getElementById('progressBar');
  if (!bar) return;

  function updateProgress() {
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const docHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    const progress  = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    bar.style.width = Math.min(progress, 100) + '%';
  }

  window.addEventListener('scroll', updateProgress, { passive: true });
  updateProgress();
}());


/* ─────────────────────────────────────────
   2. ACTIVE NAV LINK ON SCROLL
   Highlights the nav link corresponding
   to the section currently in the viewport.
───────────────────────────────────────── */
(function initNavHighlight() {
  const nav = document.getElementById('caseNav');
  if (!nav) return;

  const navLinks = Array.from(nav.querySelectorAll('.case-nav__link'));

  const sectionIds = navLinks
    .map(link => link.getAttribute('href').replace('#', ''))
    .filter(id => id && id !== 'site-title');

  const sections = sectionIds
    .map(id => document.getElementById(id))
    .filter(Boolean);

  function getActiveSection() {
    const scrollY = window.scrollY + 140;
    let active = null;
    for (const section of sections) {
      if (section.offsetTop <= scrollY) active = section.id;
    }
    return active;
  }

  function updateActiveLink() {
    const activeId = getActiveSection();
    navLinks.forEach(link => {
      const href = link.getAttribute('href').replace('#', '');
      link.classList.toggle('case-nav__link--active', href === activeId);
    });
  }

  window.addEventListener('scroll', updateActiveLink, { passive: true });
  updateActiveLink();
}());


/* ─────────────────────────────────────────
   3. NAV SCROLL FADE INDICATORS
   Manages the left and right gold fade
   overlays on the sticky nav wrapper,
   signalling to the user that the nav
   scrolls horizontally when there are more
   links than fit in the viewport.

   A nudge animation plays on the
   user's first visit (per session) to
   make the scrollable nav discoverable.
   sessionStorage prevents it repeating.
───────────────────────────────────────── */
(function initNavScrollFades() {
  const nav     = document.getElementById('caseNav');
  const wrapper = nav ? nav.closest('.case-nav__wrapper') : null;

  if (!nav || !wrapper) return;

  function updateFades() {
    const scrollLeft = nav.scrollLeft;
    const maxScroll  = nav.scrollWidth - nav.clientWidth;

    wrapper.classList.toggle('is-scrolled-start', scrollLeft > 8);

    wrapper.classList.toggle('is-scrolled-end', scrollLeft >= maxScroll - 8);
  }

  nav.addEventListener('scroll', updateFades, { passive: true });

  updateFades();

  if (!sessionStorage.getItem('navNudged')) {
    setTimeout(function () {
      nav.scrollTo({ left: 80, behavior: 'smooth' });
      setTimeout(function () {
        nav.scrollTo({ left: 0, behavior: 'smooth' });
      }, 600);
    }, 1200);
    sessionStorage.setItem('navNudged', '1');
  }
}());


/* ─────────────────────────────────────────
   4. TIMELINE ENTRY FADE-IN ON SCROLL
   Uses IntersectionObserver to animate
   each timeline entry into view as the
   reader scrolls through Section 04.
   Falls back gracefully for older browsers.
───────────────────────────────────────── */
(function initTimelineAnimation() {
  const entries = document.querySelectorAll('.timeline__entry');
  if (!entries.length) return;

  entries.forEach(entry => {
    entry.style.opacity    = '0';
    entry.style.transform  = 'translateY(16px)';
    entry.style.transition = 'opacity 0.45s ease, transform 0.45s ease';
  });

  if (!('IntersectionObserver' in window)) {
    entries.forEach(entry => {
      entry.style.opacity   = '1';
      entry.style.transform = 'none';
    });
    return;
  }

  const observer = new IntersectionObserver(
    (observed) => {
      observed.forEach(({ target, isIntersecting }) => {
        if (isIntersecting) {
          target.style.opacity   = '1';
          target.style.transform = 'translateY(0)';
          observer.unobserve(target);
        }
      });
    },
    { threshold: 0.12 }
  );

  entries.forEach(entry => observer.observe(entry));
}());


/* ─────────────────────────────────────────
   5. TIMELINE ENTRY COUNT BADGE
   Injects a small badge into the Section 04
   header showing the total number of
   correspondence entries in the timeline.
───────────────────────────────────────── */
(function initTimelineBadge() {
  const timeline      = document.querySelector('.timeline');
  const sectionHeader = document.querySelector('#chronological-record .section-header');
  if (!timeline || !sectionHeader) return;

  const count = timeline.querySelectorAll('.timeline__entry').length;
  if (count === 0) return;

  const badge       = document.createElement('span');
  badge.className   = 'timeline-badge';
  badge.textContent = count + ' entries';
  sectionHeader.appendChild(badge);
}());


/* ─────────────────────────────────────────
   6. COPY CITATION TO CLIPBOARD
   Adds a "Copy citation" button to each
   pull-quote. Clicking it copies the quote
   text and attribution as plain text.
───────────────────────────────────────── */
(function initCopyCitation() {
  const quotes = document.querySelectorAll('.pull-quote');
  if (!quotes.length || !navigator.clipboard) return;

  quotes.forEach(quote => {
    const textEl  = quote.querySelector('.pull-quote__text');
    const citeEl  = quote.querySelector('.pull-quote__attribution');
    if (!textEl) return;

    const btn = document.createElement('button');
    btn.className = 'pull-quote__copy-btn';
    btn.textContent = 'Copy citation';
    btn.setAttribute('aria-label', 'Copy this citation to clipboard');
    btn.setAttribute('type', 'button');

    btn.addEventListener('click', () => {
      const text        = textEl.textContent.trim();
      const attribution = citeEl ? ' — ' + citeEl.textContent.trim() : '';

      navigator.clipboard.writeText(text + attribution).then(() => {
        btn.textContent = 'Copied';
        btn.classList.add('pull-quote__copy-btn--copied');
        setTimeout(() => {
          btn.textContent = 'Copy citation';
          btn.classList.remove('pull-quote__copy-btn--copied');
        }, 2500);
      }).catch(() => {
        btn.textContent = 'Copy failed';
        setTimeout(() => { btn.textContent = 'Copy citation'; }, 2000);
      });
    });

    quote.appendChild(btn);
  });
}());


/* ─────────────────────────────────────────
   7. KEYBOARD ACCESSIBILITY — SKIP LINK
   Injects a visually-hidden "Skip to main
   content" anchor as the first focusable
   element on the page. It becomes visible
   on keyboard focus, allowing screen-reader
   and keyboard users to bypass the nav.
───────────────────────────────────────── */
(function initSkipLink() {
  const main = document.querySelector('main');
  if (!main) return;

  if (!main.id) main.id = 'main-content';

  const skip       = document.createElement('a');
  skip.href        = '#main-content';
  skip.className   = 'skip-link';
  skip.textContent = 'Skip to main content';

  document.body.insertBefore(skip, document.body.firstChild);
}());


/* ─────────────────────────────────────────
   8. ACCESSIBLE SMOOTH SCROLL
   Intercepts anchor links to provide a
   smooth scroll experience, accounting for
   the sticky nav height and ensuring focus
   is correctly moved for accessibility.
───────────────────────────────────────── */
(function initSmoothScroll() {
  document.addEventListener('click', (event) => {
    const trigger = event.target.closest('a[href^="#"]');

    if (!trigger) return;

    const targetId = trigger.getAttribute('href');
    if (targetId === '#') return;

    const targetElement = document.querySelector(targetId);
    if (!targetElement) return;

    event.preventDefault();

    const headerOffset   = 80;
    const elementPosition = targetElement.getBoundingClientRect().top;
    const offsetPosition  = elementPosition + window.scrollY - headerOffset;

    window.scrollTo({
      top: offsetPosition,
      behavior: 'smooth'
    });

    targetElement.setAttribute('tabindex', '-1');
    targetElement.focus({ preventScroll: true });

    if (history.pushState) {
      history.pushState(null, null, targetId);
    }
  });
}());


/* ─────────────────────────────────────────
   9. PRINT BUTTON
───────────────────────────────────────── */
(function initPrint() {
  const printBtn = document.getElementById('printButton');
  if (printBtn) {
    printBtn.addEventListener('click', () => window.print());
  }
}());


/* ─────────────────────────────────────────
   10. BACK TO TOP BUTTON
   Shows a sticky "Top" button only after
   the user scrolls past the masthead.
───────────────────────────────────────── */
(function initBackToTop() {
  const btn      = document.getElementById('backToTopBtn');
  const masthead = document.querySelector('.site-masthead');

  if (!btn || !masthead) return;

  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) {
        btn.classList.add('back-to-top-btn--visible');
      } else {
        btn.classList.remove('back-to-top-btn--visible');
      }
    });
  }, { threshold: 0 });

  observer.observe(masthead);
}());