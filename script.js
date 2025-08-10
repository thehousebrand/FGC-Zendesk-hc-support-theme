(function () {
  'use strict';

  // Key map
  const ENTER = 13;
  const ESCAPE = 27;

  function toggleNavigation(toggle, menu) {
    const isExpanded = menu.getAttribute("aria-expanded") === "true";
    menu.setAttribute("aria-expanded", !isExpanded);
    toggle.setAttribute("aria-expanded", !isExpanded);
  }

  function closeNavigation(toggle, menu) {
    menu.setAttribute("aria-expanded", false);
    toggle.setAttribute("aria-expanded", false);
    toggle.focus();
  }

  // Reading time
  function readingTime() {
    const text = document.getElementById("article-body").innerText;
    const wpm = 225;
    const words = text.trim().split(/\s+/).length;
    const time = Math.ceil(words / wpm);
    document.getElementById("time").innerText = time;
  }
  const articlebody = document.getElementById("article-body");
  if (articlebody) {
    readingTime();
  }

  // Table of Contents
  document.addEventListener("DOMContentLoaded", () => {
    const tocContainer = document.querySelector('.toc-container');
    if (!tocContainer) return;

    const headings = document.querySelectorAll(".article-content h2, h3");
    if (headings.length === 0) {
      tocContainer.parentElement.style.display = 'none';
      return;
    }

    const tocList = document.createElement('ul');
    let currentLevel = 2;
    let currentList = tocList;

    tocContainer.setAttribute('role', 'navigation');
    tocContainer.setAttribute('aria-label', 'Table of Contents');

    headings.forEach((heading, index) => {
      if (!heading.id) {
        heading.id = heading.textContent.trim()
          .toLowerCase()
          .replace(/\W+/g, '-') + '-' + index;
      }

      const level = parseInt(heading.tagName[1]);
      const listItem = document.createElement('li');
      const link = document.createElement('a');

      // FIX: add template string backticks
      link.href = `#${heading.id}`;
      link.textContent = heading.textContent;
      link.classList.add('toc-link');

      const nextHeading = headings[index + 1];
      if (nextHeading && parseInt(nextHeading.tagName[1]) > level) {
        link.classList.add('has-children');
      }

      listItem.appendChild(link);

      if (level > currentLevel) {
        const nestedList = document.createElement('ul');
        nestedList.classList.add('nested');
        currentList.lastElementChild.appendChild(nestedList);
        currentList = nestedList;
      } else if (level < currentLevel) {
        while (currentLevel > level) {
          currentList = currentList.parentElement.parentElement;
          currentLevel--;
        }
      }

      currentList.appendChild(listItem);
      currentLevel = level;
    });

    tocContainer.appendChild(tocList);

    tocContainer.addEventListener('click', (e) => {
      if (e.target.classList.contains('has-children')) {
        e.preventDefault();
        e.stopPropagation();
        e.target.classList.toggle('expanded');
        const nestedList = e.target.parentElement.querySelector('.nested');
        if (nestedList) {
          nestedList.classList.toggle('show');
        }
      }
    });
  });

  // Navigation
  window.addEventListener("DOMContentLoaded", () => {
    const menuButton = document.querySelector(".header .menu-button-mobile");
    const menuList = document.querySelector("#user-nav-mobile");

    if (menuButton && menuList) {
      menuButton.addEventListener("click", (event) => {
        event.stopPropagation();
        toggleNavigation(menuButton, menuList);
      });

      menuList.addEventListener("keyup", (event) => {
        if (event.keyCode === ESCAPE) {
          event.stopPropagation();
          closeNavigation(menuButton, menuList);
        }
      });
    }

    // Toggles expanded aria to collapsible elements
    const collapsible = document.querySelectorAll(".collapsible-nav, .collapsible-sidebar");
    collapsible.forEach((element) => {
      const toggle = element.querySelector(".collapsible-nav-toggle, .collapsible-sidebar-toggle");
      element.addEventListener("click", () => toggleNavigation(toggle, element));
      element.addEventListener("keyup", (event) => {
        if (event.keyCode === ESCAPE) closeNavigation(toggle, element);
      });
    });

    // If multibrand search has more than 5 help centers or categories collapse the list
    const multibrandFilterLists = document.querySelectorAll(".multibrand-filter-list");
    multibrandFilterLists.forEach((filter) => {
      if (filter.children.length > 6) {
        const trigger = filter.querySelector(".see-all-filters");
        trigger.setAttribute("aria-hidden", false);
        trigger.addEventListener("click", (event) => {
          event.stopPropagation();
          trigger.parentNode.removeChild(trigger);
          filter.classList.remove("multibrand-filter-list--collapsed");
        });
      }
    });
  });

  const isPrintableChar = (str) => str.length === 1 && str.match(/^\S$/);

  // Dropdown
  function Dropdown(toggle, menu) {
    this.toggle = toggle;
    this.menu = menu;

    this.menuPlacement = {
      top: menu.classList.contains("dropdown-menu-top"),
      end: menu.classList.contains("dropdown-menu-end"),
    };

    this.toggle.addEventListener("click", this.clickHandler.bind(this));
    this.toggle.addEventListener("keydown", this.toggleKeyHandler.bind(this));
    this.menu.addEventListener("keydown", this.menuKeyHandler.bind(this));
    document.body.addEventListener("click", this.outsideClickHandler.bind(this));

    const toggleId = this.toggle.getAttribute("id") || (window.crypto && crypto.randomUUID ? crypto.randomUUID() : ('toggle-' + Math.random().toString(36).slice(2)));
    const menuId = this.menu.getAttribute("id") || (window.crypto && crypto.randomUUID ? crypto.randomUUID() : ('menu-' + Math.random().toString(36).slice(2)));

    this.toggle.setAttribute("id", toggleId);
    this.menu.setAttribute("id", menuId);

    this.toggle.setAttribute("aria-controls", menuId);
    this.menu.setAttribute("aria-labelledby", toggleId);

    this.menu.setAttribute("tabindex", -1);
    this.menuItems.forEach((menuItem) => { menuItem.tabIndex = -1; });

    this.focusedIndex = -1;
  }

  Dropdown.prototype = {
    get isExpanded() { return this.toggle.getAttribute("aria-expanded") === "true"; },

    get menuItems() {
      return Array.prototype.slice.call(
        this.menu.querySelectorAll("[role='menuitem'], [role='menuitemradio']")
      );
    },

    dismiss: function () {
      if (!this.isExpanded) return;
      this.toggle.removeAttribute("aria-expanded");
      this.menu.classList.remove("dropdown-menu-end", "dropdown-menu-top");
      this.focusedIndex = -1;
    },

    open: function () {
      if (this.isExpanded) return;
      this.toggle.setAttribute("aria-expanded", true);
      this.handleOverflow();
    },

    handleOverflow: function () {
      var rect = this.menu.getBoundingClientRect();
      var overflow = {
        right: rect.left < 0 || rect.left + rect.width > window.innerWidth,
        bottom: rect.top < 0 || rect.top + rect.height > window.innerHeight,
      };
      if (overflow.right || this.menuPlacement.end) this.menu.classList.add("dropdown-menu-end");
      if (overflow.bottom || this.menuPlacement.top) this.menu.classList.add("dropdown-menu-top");
      if (this.menu.getBoundingClientRect().top < 0) this.menu.classList.remove("dropdown-menu-top");
    },

    focusByIndex: function (index) {
      if (!this.menuItems.length) return;
      this.menuItems.forEach((item, itemIndex) => {
        if (itemIndex === index) { item.tabIndex = 0; item.focus(); }
        else { item.tabIndex = -1; }
      });
      this.focusedIndex = index;
    },

    focusFirstMenuItem: function () { this.focusByIndex(0); },
    focusLastMenuItem: function () { this.focusByIndex(this.menuItems.length - 1); },

    focusNextMenuItem: function (currentItem) {
      if (!this.menuItems.length) return;
      const currentIndex = this.menuItems.indexOf(currentItem);
      const nextIndex = (currentIndex + 1) % this.menuItems.length;
      this.focusByIndex(nextIndex);
    },

    focusPreviousMenuItem: function (currentItem) {
      if (!this.menuItems.length) return;
      const currentIndex = this.menuItems.indexOf(currentItem);
      const previousIndex = currentIndex <= 0 ? this.menuItems.length - 1 : currentIndex - 1;
      this.focusByIndex(previousIndex);
    },

    focusByChar: function (currentItem, char) {
      char = char.toLowerCase();
      const itemChars = this.menuItems.map((menuItem) =>
        menuItem.textContent.trim()[0].toLowerCase()
      );
      const startIndex = (this.menuItems.indexOf(currentItem) + 1) % this.menuItems.length;
      let index = itemChars.indexOf(char, startIndex);
      if (index === -1) index = itemChars.indexOf(char, 0);
      if (index > -1) this.focusByIndex(index);
    },

    outsideClickHandler: function (e) {
      if (this.isExpanded && !this.toggle.contains(e.target) && !e.composedPath().includes(this.menu)) {
        this.dismiss();
        this.toggle.focus();
      }
    },

    clickHandler: function (event) {
      event.stopPropagation();
      event.preventDefault();
      if (this.isExpanded) { this.dismiss(); this.toggle.focus(); }
      else { this.open(); this.focusFirstMenuItem(); }
    },

    toggleKeyHandler: function (e) {
      const key = e.key;
      switch (key) {
        case "Enter":
        case " ":
        case "ArrowDown":
        case "Down":
          e.stopPropagation(); e.preventDefault(); this.open(); this.focusFirstMenuItem(); break;
        case "ArrowUp":
        case "Up":
          e.stopPropagation(); e.preventDefault(); this.open(); this.focusLastMenuItem(); break;
        case "Esc":
        case "Escape":
          e.stopPropagation(); e.preventDefault(); this.dismiss(); this.toggle.focus(); break;
      }
    },

    menuKeyHandler: function (e) {
      const key = e.key;
      const currentElement = this.menuItems[this.focusedIndex];
      if (e.ctrlKey || e.altKey || e.metaKey) return;

      switch (key) {
        case "Esc":
        case "Escape":
          e.stopPropagation(); e.preventDefault(); this.dismiss(); this.toggle.focus(); break;
        case "ArrowDown":
        case "Down":
          e.stopPropagation(); e.preventDefault(); this.focusNextMenuItem(currentElement); break;
        case "ArrowUp":
        case "Up":
          e.stopPropagation(); e.preventDefault(); this.focusPreviousMenuItem(currentElement); break;
        case "Home":
        case "PageUp":
          e.stopPropagation(); e.preventDefault(); this.focusFirstMenuItem(); break;
        case "End":
        case "PageDown":
          e.stopPropagation(); e.preventDefault(); this.focusLastMenuItem(); break;
        case "Tab":
          if (e.shiftKey) { e.stopPropagation(); e.preventDefault(); this.dismiss(); this.toggle.focus(); }
          else { this.dismiss(); }
          break;
        default:
          if (isPrintableChar(key)) { e.stopPropagation(); e.preventDefault(); this.focusByChar(currentElement, key); }
      }
    },
  };

  // Dropdowns init
  window.addEventListener("DOMContentLoaded", () => {
    const dropdownToggles = document.querySelectorAll(".dropdown-toggle");
    dropdownToggles.forEach((toggle) => {
      const menu = toggle.nextElementSibling;
      if (menu && menu.classList.contains("dropdown-menu")) {
        new Dropdown(toggle, menu);
      }
    });
  });

  // Share
  window.addEventListener("DOMContentLoaded", () => {
    const links = document.querySelectorAll(".share a");
    links.forEach((anchor) => {
      anchor.addEventListener("click", (event) => {
        event.preventDefault();
        window.open(anchor.href, "", "height=500,width=500");
      });
    });
  });

  // Debounce
  function debounce(callback, wait) {
    let timeoutId = null;
    return (...args) => {
      window.clearTimeout(timeoutId);
      timeoutId = window.setTimeout(() => { callback.apply(null, args); }, wait);
    };
  }

  // Search clear button
  let searchFormFilledClassName = "search-has-value";
  let searchFormSelector = "form[role='search']";

  function clearSearchInput(event) {
    event.target.closest(searchFormSelector).classList.remove(searchFormFilledClassName);
    let input;
    if (event.target.tagName === "INPUT") input = event.target;
    else if (event.target.tagName === "BUTTON") input = event.target.previousElementSibling;
    else input = event.target.closest("button").previousElementSibling;
    input.value = "";
    input.focus();
  }

  function clearSearchInputOnKeypress(event) {
    const searchInputDeleteKeys = ["Delete", "Escape"];
    if (searchInputDeleteKeys.includes(event.key)) clearSearchInput(event);
  }

  function buildClearSearchButton(inputId) {
    const button = document.createElement("button");
    button.setAttribute("type", "button");
    button.setAttribute("aria-controls", inputId);
    button.classList.add("clear-button");
    const buttonLabel = window.searchClearButtonLabelLocalized || "Clear";
    const icon = `<svg xmlns='http://www.w3.org/2000/svg' width='12' height='12' focusable='false' role='img' viewBox='0 0 12 12' aria-label='${buttonLabel}'><path stroke='currentColor' stroke-linecap='round' stroke-width='2' d='M3 9l6-6m0 6L3 3'/></svg>`;
    button.innerHTML = icon;
    button.addEventListener("click", clearSearchInput);
    button.addEventListener("keyup", clearSearchInputOnKeypress);
    return button;
  }

  function appendClearSearchButton(input, form) {
    const searchClearButton = buildClearSearchButton(input.id);
    form.append(searchClearButton);
    if (input.value.length > 0) form.classList.add(searchFormFilledClassName);
  }

  const toggleClearSearchButtonAvailability = debounce((event) => {
    const form = event.target.closest(searchFormSelector);
    form.classList.toggle(searchFormFilledClassName, event.target.value.length > 0);
  }, 200);

  // Search init
  window.addEventListener("DOMContentLoaded", () => {
    const searchForms = [...document.querySelectorAll(searchFormSelector)];
    const searchInputs = searchForms.map((form) => form.querySelector("input[type='search']"));
    searchInputs.forEach((input) => {
      appendClearSearchButton(input, input.closest(searchFormSelector));
      input.addEventListener("keyup", clearSearchInputOnKeypress);
      input.addEventListener("keyup", toggleClearSearchButtonAvailability);
    });
  });

  const key = "returnFocusTo";
  function saveFocus() {
    const activeElementId = document.activeElement.getAttribute("id");
    sessionStorage.setItem(key, "#" + activeElementId);
  }
  function returnFocus() {
    const returnFocusTo = sessionStorage.getItem(key);
    if (returnFocusTo) {
      sessionStorage.removeItem("returnFocusTo");
      const returnFocusToEl = document.querySelector(returnFocusTo);
      returnFocusToEl && returnFocusToEl.focus && returnFocusToEl.focus();
    }
  }

  // Forms
  window.addEventListener("DOMContentLoaded", () => {
    returnFocus();

    const commentContainerTextarea = document.querySelector(".comment-container textarea");
    const commentContainerFormControls = document.querySelector(".comment-form-controls, .comment-ccs");

    if (commentContainerTextarea) {
      commentContainerTextarea.addEventListener("focus", function focusCommentContainerTextarea() {
        if (commentContainerFormControls) commentContainerFormControls.style.display = "block";
        commentContainerTextarea.removeEventListener("focus", focusCommentContainerTextarea);
      });

      if (commentContainerTextarea.value !== "" && commentContainerFormControls) {
        commentContainerFormControls.style.display = "block";
      }
    }

    const showRequestCommentContainerTrigger = document.querySelector(".request-container .comment-container .comment-show-container");
    const requestCommentFields = document.querySelectorAll(".request-container .comment-container .comment-fields");
    const requestCommentSubmit = document.querySelector(".request-container .comment-container .request-submit-comment");

    if (showRequestCommentContainerTrigger) {
      showRequestCommentContainerTrigger.addEventListener("click", () => {
        showRequestCommentContainerTrigger.style.display = "none";
        Array.prototype.forEach.call(requestCommentFields, (element) => { element.style.display = "block"; });
        if (requestCommentSubmit) requestCommentSubmit.style.display = "inline-block";
        if (commentContainerTextarea) commentContainerTextarea.focus();
      });
    }

    const requestMarkAsSolvedButton = document.querySelector(".request-container .mark-as-solved:not([data-disabled])");
    const requestMarkAsSolvedCheckbox = document.querySelector(".request-container .comment-container input[type=checkbox]");
    const requestCommentSubmitButton = document.querySelector(".request-container .comment-container input[type=submit]");

    if (requestMarkAsSolvedButton) {
      requestMarkAsSolvedButton.addEventListener("click", () => {
        if (requestMarkAsSolvedCheckbox) requestMarkAsSolvedCheckbox.setAttribute("checked", true);
        if (requestCommentSubmitButton) requestCommentSubmitButton.disabled = true;
        requestMarkAsSolvedButton.setAttribute("data-disabled", true);
        requestMarkAsSolvedButton.form.submit();
      });
    }

    const requestCommentTextarea = document.querySelector(".request-container .comment-container textarea");
    const usesWysiwyg = requestCommentTextarea && requestCommentTextarea.dataset.helper === "wysiwyg";

    function isEmptyPlaintext(s) { return s.trim() === ""; }
    function isEmptyHtml(xml) {
      const doc = new DOMParser().parseFromString(`<_>${xml}</_>`, "text/xml");
      const img = doc.querySelector("img");
      return img === null && isEmptyPlaintext(doc.children[0].textContent);
    }
    const isEmpty = usesWysiwyg ? isEmptyHtml : isEmptyPlaintext;

    if (requestCommentTextarea) {
      requestCommentTextarea.addEventListener("input", () => {
        if (isEmpty(requestCommentTextarea.value)) {
          if (requestMarkAsSolvedButton) {
            requestMarkAsSolvedButton.innerText = requestMarkAsSolvedButton.getAttribute("data-solve-translation");
          }
        } else {
          if (requestMarkAsSolvedButton) {
            requestMarkAsSolvedButton.innerText = requestMarkAsSolvedButton.getAttribute("data-solve-and-submit-translation");
          }
        }
      });
    }

    const selects = document.querySelectorAll("#request-status-select, #request-organization-select");
    selects.forEach((element) => {
      element.addEventListener("change", (event) => {
        event.stopPropagation();
        saveFocus();
        element.form.submit();
      });
    });

    const quickSearch = document.querySelector("#quick-search");
    if (quickSearch) {
      quickSearch.addEventListener("keyup", (event) => {
        if (event.keyCode === ENTER) {
          event.stopPropagation();
          saveFocus();
          quickSearch.form.submit();
        }
      });
    }

    const requestOrganisationSelect = document.querySelector("#request-organization select");
    if (requestOrganisationSelect) {
      requestOrganisationSelect.addEventListener("change", () => requestOrganisationSelect.form.submit());
      requestOrganisationSelect.addEventListener("click", (e) => { e.stopPropagation(); });
    }

    const notificationElm = document.querySelector(".notification-error");
    if (notificationElm && notificationElm.previousElementSibling && typeof notificationElm.previousElementSibling.focus === "function") {
      notificationElm.previousElementSibling.focus();
    }
  });

  // ===========================
  // CSRF helpers (one version)
  // ===========================
  async function fetchCSRFToken() {
    try {
      const response = await fetch("/api/v2/users/me.json");
      if (!response.ok) throw new Error(`Failed to fetch CSRF token: ${response.status}`);
      const data = await response.json();
      return data.user.authenticity_token;
    } catch (error) {
      console.error("Error fetching CSRF token:", error);
      return null;
    }
  }

  function cacheCSRFToken(token) {
    localStorage.setItem('zd_csrf_token', token);
    localStorage.setItem('zd_csrf_token_timestamp', Date.now());
  }

  function getCachedCSRFToken() {
    const token = localStorage.getItem('zd_csrf_token');
    const timestamp = localStorage.getItem('zd_csrf_token_timestamp');
    if (token && timestamp && (Date.now() - timestamp < 120000)) return token;
    return null;
  }

  async function getCSRFTokenWithCache() {
    const cachedToken = getCachedCSRFToken();
    if (cachedToken) return cachedToken;
    const token = await fetchCSRFToken();
    if (token) cacheCSRFToken(token);
    return token;
  }

  // ===========================
  // Recent articles
  // ===========================
  async function fetchRecentlyUpdatedArticles(limit = 5) {
    try {
      const csrfToken = await getCSRFTokenWithCache();
      if (!csrfToken) throw new Error("Could not retrieve CSRF token. User may not be logged in.");

      const apiUrl = `/api/v2/help_center/articles.json?sort_by=created_at&sort_order=desc&per_page=${limit}`;
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken }
      });
      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
      const data = await response.json();
      return data.articles;
    } catch (error) {
      console.error('Error fetching recent articles:', error);
      return [];
    }
  }

  function displayRecentArticles(containerId, articles) {
    const container = document.getElementById(containerId);
    if (!container) {
      console.error(`Container with ID "${containerId}" not found.`);
      return;
    }
    container.innerHTML = '';

    articles.forEach(article => {
      let snippet = '';
      if (article.body) {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = article.body;
        const textContent = tempDiv.textContent || tempDiv.innerText || '';
        snippet = textContent.substring(0, 117) + (textContent.length > 117 ? '...' : '');
      }

      const articleHTML = `
        <article class="article-item">
          <div class="article-inner">
            <h3 class="article-title"><a href="${article.html_url}">${article.title}</a></h3>
            <p class="article-description">${snippet}</p>
          </div>
        </article>
      `;
      container.innerHTML += articleHTML;
    });
  }

  // ===========================
  // Content Tags (fixed)
  // ===========================

  function getCurrentLocale() {
    const htmlLang = (document.documentElement.getAttribute('lang') || '').toLowerCase().replace('_', '-');
    if (htmlLang) return htmlLang;
    const m = location.pathname.match(/\/hc\/([a-z]{2}(?:-[a-z]{2})?)\//i);
    return (m && m[1].toLowerCase()) || 'en-us';
  }

  function buildNextCursorUrl(currentUrl, data) {
    if (data.links && data.links.next) return data.links.next;
    if (data.next_page) return data.next_page;
    if (data.meta && data.meta.has_more && data.meta.after_cursor) {
      const u = new URL(currentUrl, window.location.origin);
      u.searchParams.set('page[after]', data.meta.after_cursor);
      return u.pathname + u.search;
    }
    return null;
  }

  // Fetch ALL content tags (no CSRF needed)
  async function fetchAllContentTags() {
    try {
      const tags = [];
      let url = `/api/v2/guide/content_tags?page[size]=100&sort=name`;
      while (url) {
        const res = await fetch(url, { headers: { 'Content-Type': 'application/json' } });
        if (!res.ok) throw new Error(`Tags HTTP ${res.status}`);
        const data = await res.json();
        const pageRecords = data.records || [];
        tags.push(...pageRecords);
        url = buildNextCursorUrl(url, data);
      }
      return tags;
    } catch (error) {
      console.error('Error fetching content tags:', error);
      return [];
    }
  }

  // Fetch articles and paginate (no CSRF needed for GET)
  async function fetchArticlesForTagCount(maxPages = 10) {
    try {
      const locale = getCurrentLocale();
      let url = `/api/v2/help_center/${locale}/articles?page[size]=100&sort_by=updated_at&sort_order=desc`;
      const articles = [];
      let pages = 0;

      while (url && pages < maxPages) {
        const res = await fetch(url, { headers: { 'Content-Type': 'application/json' } });
        if (!res.ok) throw new Error(`Articles HTTP ${res.status}`);
        const data = await res.json();
        if (Array.isArray(data.articles)) articles.push(...data.articles);
        url = buildNextCursorUrl(url, data);
        pages++;
      }
      return articles;
    } catch (error) {
      console.error('Error fetching articles for tag count:', error);
      return [];
    }
  }

  // Compute top content tags
  async function fetchTopContentTags(limit = 3) {
    try {
      const allTags = await fetchAllContentTags();
      if (!allTags.length) return [];

      const tagMap = {};
      allTags.forEach(t => { tagMap[t.id] = t; });

      const articles = await fetchArticlesForTagCount(10); // ~1000 articles
      if (!articles.length) return [];

      const counts = {};
      for (const a of articles) {
        const ids = Array.isArray(a.content_tag_ids) ? a.content_tag_ids : [];
        for (const id of ids) counts[id] = (counts[id] || 0) + 1;
      }

      const tagArray = Object.keys(counts).map(id => ({
        id,
        name: tagMap[id]?.name || 'Unknown tag',
        count: counts[id]
      }));

      tagArray.sort((a, b) => b.count - a.count);
      return tagArray.slice(0, limit);
    } catch (error) {
      console.error('Error fetching top content tags:', error);
      return [];
    }
  }

  // Render tag links (use content_tag_id and current locale)
  function displayTopTagLinks(containerId, tags) {
    const container = document.getElementById(containerId);
    if (!container) {
      console.error(`Container with ID "${containerId}" not found.`);
      return;
    }
    const locale = getCurrentLocale();
    container.innerHTML = '';

    tags.forEach(tag => {
      const link = document.createElement('a');
      link.href = `/hc/${locale}/search?content_tag_id=${encodeURIComponent(tag.id)}`;
      link.textContent = tag.name;
      link.className = 'popular-tag-link';
      container.appendChild(link);
      container.appendChild(document.createTextNode(' '));
    });
  }

  // ===========================
  // Boot: fetch + render blocks
  // ===========================
  document.addEventListener('DOMContentLoaded', async () => {
    try {
      // Recent articles
      const articles = await fetchRecentlyUpdatedArticles(5);
      if (articles && articles.length > 0) {
        displayRecentArticles('recent-articles', articles);
      } else {
        const container = document.getElementById('recent-articles');
        if (container) container.innerHTML = '<p>No recently updated articles found.</p>';
      }

      // Top tags
      const topTags = await fetchTopContentTags(3);
      if (topTags && topTags.length > 0) {
        displayTopTagLinks('top-tags', topTags);
      } else {
        const tagsContainer = document.getElementById('top-tags');
        if (tagsContainer) tagsContainer.innerHTML = '<p>No popular topics found yet.</p>';
      }

    } catch (error) {
      console.error('Failed to load content:', error);

      const articlesContainer = document.getElementById('recent-articles');
      if (articlesContainer) {
        articlesContainer.innerHTML = '<p>Unable to load recent articles. Please try again later.</p>';
      }

      const tagsContainer = document.getElementById('top-tags');
      if (tagsContainer) {
        tagsContainer.innerHTML = '<p>Unable to load popular topics. Please try again later.</p>';
      }
    }
  });

})();
