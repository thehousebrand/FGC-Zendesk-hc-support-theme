(function () {
  "use strict";

  // Key map
  const ENTER = 13;
  const ESCAPE = 27;

  // Small DOM helpers
  const qs = (sel, root = document) => root.querySelector(sel);
  const qsa = (sel, root = document) =>
    Array.prototype.slice.call(root.querySelectorAll(sel));

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

  function readingTime() {
    const bodyEl = qs("#article-body");
    const timeEl = qs("#time");
    if (!bodyEl || !timeEl) return;
    const text = bodyEl.textContent || "";
    const wpm = 225;
    const words = text.trim().split(/\s+/).length;
    const time = Math.ceil(words / wpm);
    timeEl.textContent = time;
  }

  const isPrintableChar = (str) => str.length === 1 && /\S/.test(str);

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
    document.body.addEventListener(
      "click",
      this.outsideClickHandler.bind(this)
    );

    const toggleId = this.toggle.getAttribute("id") || crypto.randomUUID();
    const menuId = this.menu.getAttribute("id") || crypto.randomUUID();

    this.toggle.setAttribute("id", toggleId);
    this.menu.setAttribute("id", menuId);

    this.toggle.setAttribute("aria-controls", menuId);
    this.menu.setAttribute("aria-labelledby", toggleId);

    this.menu.setAttribute("tabindex", -1);
    this.menuItems.forEach((menuItem) => {
      menuItem.tabIndex = -1;
    });

    this.focusedIndex = -1;
  }

  Dropdown.prototype = {
    get isExpanded() {
      return this.toggle.getAttribute("aria-expanded") === "true";
    },

    get menuItems() {
      return qsa("[role='menuitem'], [role='menuitemradio']", this.menu);
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
      const rect = this.menu.getBoundingClientRect();
      const overflow = {
        right: rect.left < 0 || rect.left + rect.width > window.innerWidth,
        bottom: rect.top < 0 || rect.top + rect.height > window.innerHeight,
      };

      if (overflow.right || this.menuPlacement.end) {
        this.menu.classList.add("dropdown-menu-end");
      }
      if (overflow.bottom || this.menuPlacement.top) {
        this.menu.classList.add("dropdown-menu-top");
      }
      if (this.menu.getBoundingClientRect().top < 0) {
        this.menu.classList.remove("dropdown-menu-top");
      }
    },

    focusByIndex: function (index) {
      if (!this.menuItems.length) return;

      this.menuItems.forEach((item, itemIndex) => {
        if (itemIndex === index) {
          item.tabIndex = 0;
          item.focus();
        } else {
          item.tabIndex = -1;
        }
      });

      this.focusedIndex = index;
    },

    focusFirstMenuItem: function () {
      this.focusByIndex(0);
    },

    focusLastMenuItem: function () {
      this.focusByIndex(this.menuItems.length - 1);
    },

    focusNextMenuItem: function (currentItem) {
      if (!this.menuItems.length) return;
      const currentIndex = this.menuItems.indexOf(currentItem);
      const nextIndex = (currentIndex + 1) % this.menuItems.length;
      this.focusByIndex(nextIndex);
    },

    focusPreviousMenuItem: function (currentItem) {
      if (!this.menuItems.length) return;
      const currentIndex = this.menuItems.indexOf(currentItem);
      const previousIndex =
        currentIndex <= 0 ? this.menuItems.length - 1 : currentIndex - 1;
      this.focusByIndex(previousIndex);
    },

    focusByChar: function (currentItem, char) {
      char = char.toLowerCase();
      const itemChars = this.menuItems.map((menuItem) =>
        (menuItem.textContent || "").trim()[0]?.toLowerCase()
      );

      const startIndex =
        (this.menuItems.indexOf(currentItem) + 1) % this.menuItems.length;

      let index = itemChars.indexOf(char, startIndex);
      if (index === -1) index = itemChars.indexOf(char, 0);
      if (index > -1) this.focusByIndex(index);
    },

    outsideClickHandler: function (e) {
      if (
        this.isExpanded &&
        !this.toggle.contains(e.target) &&
        !e.composedPath().includes(this.menu)
      ) {
        this.dismiss();
        this.toggle.focus();
      }
    },

    clickHandler: function (event) {
      event.stopPropagation();
      event.preventDefault();
      if (this.isExpanded) {
        this.dismiss();
        this.toggle.focus();
      } else {
        this.open();
        this.focusFirstMenuItem();
      }
    },

    toggleKeyHandler: function (e) {
      const key = e.key;
      switch (key) {
        case "Enter":
        case " ":
        case "ArrowDown":
        case "Down":
          e.stopPropagation();
          e.preventDefault();
          this.open();
          this.focusFirstMenuItem();
          break;
        case "ArrowUp":
        case "Up":
          e.stopPropagation();
          e.preventDefault();
          this.open();
          this.focusLastMenuItem();
          break;
        case "Esc":
        case "Escape":
          e.stopPropagation();
          e.preventDefault();
          this.dismiss();
          this.toggle.focus();
          break;
      }
    },

    menuKeyHandler: function (e) {
      const key = e.key;
      const currentElement = this.menuItems[this.focusedIndex];

      if (e.ctrlKey || e.altKey || e.metaKey) return;

      switch (key) {
        case "Esc":
        case "Escape":
          e.stopPropagation();
          e.preventDefault();
          this.dismiss();
          this.toggle.focus();
          break;
        case "ArrowDown":
        case "Down":
          e.stopPropagation();
          e.preventDefault();
          this.focusNextMenuItem(currentElement);
          break;
        case "ArrowUp":
        case "Up":
          e.stopPropagation();
          e.preventDefault();
          this.focusPreviousMenuItem(currentElement);
          break;
        case "Home":
        case "PageUp":
          e.stopPropagation();
          e.preventDefault();
          this.focusFirstMenuItem();
          break;
        case "End":
        case "PageDown":
          e.stopPropagation();
          e.preventDefault();
          this.focusLastMenuItem();
          break;
        case "Tab":
          if (e.shiftKey) {
            e.stopPropagation();
            e.preventDefault();
            this.dismiss();
            this.toggle.focus();
          } else {
            this.dismiss();
          }
          break;
        default:
          if (isPrintableChar(key)) {
            e.stopPropagation();
            e.preventDefault();
            this.focusByChar(currentElement, key);
          }
      }
    },
  };

  // Debounce
  function debounce(callback, wait) {
    let timeoutId = null;
    return (...args) => {
      window.clearTimeout(timeoutId);
      timeoutId = window.setTimeout(() => {
        callback.apply(null, args);
      }, wait);
    };
  }

  // Brand detection helper
  // 1. UPDATE THE BRAND DETECTION FUNCTION
  function detectBrand() {
    // Check the current domain/subdomain
    const hostname = window.location.hostname;
    
    if (hostname.includes('team.thefeelgoodclinic.com')) {
      console.log("🏢 Detected: Team brand");
      return 'team';
    } else if (hostname.includes('support.thefeelgoodclinic.com')) {
      console.log("🏥 Detected: Support brand");
      return 'support';
    } else {
      // Default fallback - check for URL patterns
      const isTeam = window.location.href.includes('/community/');
      console.log(isTeam ? "🏢 Detected: Team brand (by URL)" : "🏥 Detected: Support brand (default)");
      return isTeam ? 'team' : 'support';
    }
  }

  // CSRF helpers (deduped)
  async function fetchCSRFToken() {
    try {
      const response = await fetch("/api/v2/users/me.json");
      if (!response.ok) {
        throw new Error(`Failed to fetch CSRF token: ${response.status}`);
      }
      const data = await response.json();
      return data.user.authenticity_token;
    } catch (error) {
      console.error("Error fetching CSRF token:", error);
      return null;
    }
  }

  function cacheCSRFToken(token) {
    localStorage.setItem("zd_csrf_token", token);
    localStorage.setItem("zd_csrf_token_timestamp", Date.now());
  }

  function getCachedCSRFToken() {
    const token = localStorage.getItem("zd_csrf_token");
    const timestamp = localStorage.getItem("zd_csrf_token_timestamp");
    if (token && timestamp && Date.now() - timestamp < 120000) return token;
    return null;
  }

  async function getCSRFTokenWithCache() {
    const cached = getCachedCSRFToken();
    if (cached) return cached;
    const token = await fetchCSRFToken();
    if (token) cacheCSRFToken(token);
    return token;
  }

  // Data fetchers - Articles (for team brand)
  async function fetchRecentlyUpdatedArticles(limit = 5) {
    try {
      const csrfToken = await getCSRFTokenWithCache();
      if (!csrfToken) {
        throw new Error(
          "Could not retrieve CSRF token. User may not be logged in."
        );
      }
      
      // Fetch more articles than needed since we'll filter out drafts
      const fetchLimit = Math.max(limit * 2, 20); // Fetch 2x or minimum 20 to account for drafts
      const apiUrl = `/api/v2/help_center/articles.json?sort_by=created_at&sort_order=desc&per_page=${fetchLimit}`;
      
      const response = await fetch(apiUrl, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": csrfToken,
        },
      });
      
      if (!response.ok)
        throw new Error(`HTTP error! Status: ${response.status}`);
      
      const data = await response.json();
      
      // Filter out draft articles (draft: false means published)
      const publishedArticles = data.articles.filter(article => article.draft === false);
      
      // Return only the requested number of published articles
      return publishedArticles.slice(0, limit);
      
    } catch (error) {
      console.error("Error fetching recent articles:", error);
      return [];
    }
  }

  // Data fetchers - Content Tags (for team brand)
  async function fetchAllContentTags() {
    try {
      const csrfToken = await getCSRFTokenWithCache();
      if (!csrfToken) {
        throw new Error(
          "Could not retrieve CSRF token. User may not be logged in."
        );
      }

      const allTags = [];
      let nextUrl = `/api/v2/guide/content_tags?page[size]=30`;

      while (nextUrl) {
        const response = await fetch(nextUrl, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "X-CSRF-Token": csrfToken,
          },
        });
        if (!response.ok)
          throw new Error(`HTTP error! Status: ${response.status}`);
        const data = await response.json();
        allTags.push(...(data.records || []));

        // Check if there are more items to fetch
        if (data.meta?.has_more) {
          // Use the next link if provided by the API
          if (data.links?.next) {
            nextUrl = data.links.next;
          } else {
            // Fallback: generate the next URL manually
            // Parse the current URL to extract page information
            const url = new URL(nextUrl, window.location.origin);
            const searchParams = new URLSearchParams(url.search);
            const pageSize = searchParams.get("page[size]") || 30;
            const baseUrl = nextUrl.split("?")[0];
            nextUrl = `${baseUrl}?page[size]=${pageSize}&page[after]=${data.meta.after_cursor}`;
          }
        } else {
          nextUrl = null;
        }
      }

      return allTags;
    } catch (error) {
      console.error("Error fetching content tags:", error);
      return [];
    }
  }

  async function fetchArticlesForTagCount(perPage = 100) {
    try {
      const csrfToken = await getCSRFTokenWithCache();
      if (!csrfToken) {
        throw new Error(
          "Could not retrieve CSRF token. User may not be logged in."
        );
      }
      const apiUrl = `/api/v2/help_center/articles.json?per_page=${perPage}`;
      const response = await fetch(apiUrl, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": csrfToken,
        },
      });
      if (!response.ok)
        throw new Error(`HTTP error! Status: ${response.status}`);
      const data = await response.json();
      return data.articles;
    } catch (error) {
      console.error("Error fetching articles for tag count:", error);
      return [];
    }
  }

  async function fetchTopContentTags(limit = 3) {
    try {
      const allTags = await fetchAllContentTags();
      if (!allTags || allTags.length === 0) return [];

      const tagMap = {};
      allTags.forEach((tag) => {
        tagMap[tag.id] = tag;
      });

      const articles = await fetchArticlesForTagCount(100);
      if (!articles || articles.length === 0) return [];

      const tagCounts = {};
      articles.forEach((article) => {
        if (article.content_tag_ids && article.content_tag_ids.length > 0) {
          article.content_tag_ids.forEach((tagId) => {
            tagCounts[tagId] = (tagCounts[tagId] || 0) + 1;
          });
        }
      });

      const tagArray = Object.keys(tagCounts).map((tagId) => ({
        id: tagId,
        name: tagMap[tagId] ? tagMap[tagId].name : "Unknown Tag",
        count: tagCounts[tagId],
      }));

      tagArray.sort((a, b) => b.count - a.count);
      return tagArray.slice(0, limit);
    } catch (error) {
      console.error("Error fetching top content tags:", error);
      return [];
    }
  }

  // Data fetchers - FAQ Sections (for support brand)
  async function fetchAllSections() {
    try {
      const apiUrl = `/api/v2/help_center/en-au/sections.json`;
      const response = await fetch(apiUrl, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const data = await response.json();
      return data.sections || [];
      
    } catch (error) {
      console.error("❌ Error fetching sections:", error);
      return [];
    }
  }

  async function fetchFAQSectionsByID(categoryId) {
    try {
      console.log("🚀 Fetching FAQ sections directly by category ID:", categoryId);
      
      // Fetch all sections and filter by category ID
      const allSections = await fetchAllSections();
      const faqSections = allSections.filter(section => 
        section.category_id === parseInt(categoryId)
      );
      
      console.log("✅ Found FAQ sections:", faqSections.length);
      return faqSections;
      
    } catch (error) {
      console.error("❌ Error fetching FAQ sections by ID:", error);
      return [];
    }
  }
  
  async function fetchFAQSectionsDirectly(categoryId) {
    try {
      console.log("⚡ Fetching FAQ sections directly from category endpoint:", categoryId);
      
      // This endpoint gets sections directly from a specific category
      const apiUrl = `/api/v2/help_center/en-au/categories/${categoryId}/sections.json`;
      
      const response = await fetch(apiUrl, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const data = await response.json();
      const sections = data.sections || [];
      
      console.log("✅ Found FAQ sections (direct):", sections.length);
      return sections;
      
    } catch (error) {
      console.error("❌ Error fetching sections directly:", error);
      // Fallback to the previous method
      return await fetchFAQSectionsByID(categoryId);
    }
  }

  // Renderers - Articles (for team brand)
  function displayRecentArticles(containerId, articles) {
    const container = qs(`#${containerId}`);
    if (!container) {
      console.error(`Container with ID "${containerId}" not found.`);
      return;
    }
    container.innerHTML = "";
    if (!articles || !articles.length) return;

    const frag = document.createDocumentFragment();
    articles.forEach((article) => {
      let snippet = "";
      if (article.body) {
        const tempDiv = document.createElement("div");
        tempDiv.innerHTML = article.body;
        const textContent = tempDiv.textContent || tempDiv.innerText || "";
        snippet =
          textContent.substring(0, 117) +
          (textContent.length > 117 ? "..." : "");
      }

      const wrapper = document.createElement("div");
      wrapper.innerHTML = `
        <article class="article-item">
          <div class="article-inner">
            <h3 class="article-title"><a href="${article.html_url}">${article.title}</a></h3>
            <p class="article-description">${snippet}</p>
          </div>
        </article>
      `.trim();
      frag.appendChild(wrapper.firstElementChild);
    });
    container.appendChild(frag);
  }

  // FAQ Section Icon Mapping
  const FAQ_SECTION_ICONS = {
    // Replace these with your actual section IDs
    13484939008143: `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="24px" height="24px" viewBox="0 0 24 24" version="1.1">
<g id="surface1">
<path style=" stroke:none;fill-rule:nonzero;fill:rgb(0%,0%,0%);fill-opacity:1;" d="M 22.5 19.5 L 21.75 19.5 L 21.75 6.75 C 21.75 6.550781 21.671875 6.359375 21.53125 6.21875 C 21.390625 6.078125 21.199219 6 21 6 L 17.25 6 L 17.25 3.75 C 17.25 3.550781 17.171875 3.359375 17.03125 3.21875 C 16.890625 3.078125 16.699219 3 16.5 3 L 7.5 3 C 7.300781 3 7.109375 3.078125 6.96875 3.21875 C 6.828125 3.359375 6.75 3.550781 6.75 3.75 L 6.75 9 L 3 9 C 2.800781 9 2.609375 9.078125 2.46875 9.21875 C 2.328125 9.359375 2.25 9.550781 2.25 9.75 L 2.25 19.5 L 1.5 19.5 C 1.300781 19.5 1.109375 19.578125 0.96875 19.71875 C 0.828125 19.859375 0.75 20.050781 0.75 20.25 C 0.75 20.449219 0.828125 20.640625 0.96875 20.78125 C 1.109375 20.921875 1.300781 21 1.5 21 L 22.5 21 C 22.699219 21 22.890625 20.921875 23.03125 20.78125 C 23.171875 20.640625 23.25 20.449219 23.25 20.25 C 23.25 20.050781 23.171875 19.859375 23.03125 19.71875 C 22.890625 19.578125 22.699219 19.5 22.5 19.5 Z M 3.75 10.5 L 7.5 10.5 C 7.699219 10.5 7.890625 10.421875 8.03125 10.28125 C 8.171875 10.140625 8.25 9.949219 8.25 9.75 L 8.25 4.5 L 15.75 4.5 L 15.75 6.75 C 15.75 6.949219 15.828125 7.140625 15.96875 7.28125 C 16.109375 7.421875 16.300781 7.5 16.5 7.5 L 20.25 7.5 L 20.25 19.5 L 14.25 19.5 L 14.25 15.75 C 14.25 15.550781 14.171875 15.359375 14.03125 15.21875 C 13.890625 15.078125 13.699219 15 13.5 15 L 10.5 15 C 10.300781 15 10.109375 15.078125 9.96875 15.21875 C 9.828125 15.359375 9.75 15.550781 9.75 15.75 L 9.75 19.5 L 3.75 19.5 Z M 12.75 19.5 L 11.25 19.5 L 11.25 16.5 L 12.75 16.5 Z M 10.5 6.75 C 10.5 6.550781 10.578125 6.359375 10.71875 6.21875 C 10.859375 6.078125 11.050781 6 11.25 6 L 12.75 6 C 12.949219 6 13.140625 6.078125 13.28125 6.21875 C 13.421875 6.359375 13.5 6.550781 13.5 6.75 C 13.5 6.949219 13.421875 7.140625 13.28125 7.28125 C 13.140625 7.421875 12.949219 7.5 12.75 7.5 L 11.25 7.5 C 11.050781 7.5 10.859375 7.421875 10.71875 7.28125 C 10.578125 7.140625 10.5 6.949219 10.5 6.75 Z M 10.5 9.75 C 10.5 9.550781 10.578125 9.359375 10.71875 9.21875 C 10.859375 9.078125 11.050781 9 11.25 9 L 12.75 9 C 12.949219 9 13.140625 9.078125 13.28125 9.21875 C 13.421875 9.359375 13.5 9.550781 13.5 9.75 C 13.5 9.949219 13.421875 10.140625 13.28125 10.28125 C 13.140625 10.421875 12.949219 10.5 12.75 10.5 L 11.25 10.5 C 11.050781 10.5 10.859375 10.421875 10.71875 10.28125 C 10.578125 10.140625 10.5 9.949219 10.5 9.75 Z M 15.75 9.75 C 15.75 9.550781 15.828125 9.359375 15.96875 9.21875 C 16.109375 9.078125 16.300781 9 16.5 9 L 18 9 C 18.199219 9 18.390625 9.078125 18.53125 9.21875 C 18.671875 9.359375 18.75 9.550781 18.75 9.75 C 18.75 9.949219 18.671875 10.140625 18.53125 10.28125 C 18.390625 10.421875 18.199219 10.5 18 10.5 L 16.5 10.5 C 16.300781 10.5 16.109375 10.421875 15.96875 10.28125 C 15.828125 10.140625 15.75 9.949219 15.75 9.75 Z M 8.25 12.75 C 8.25 12.949219 8.171875 13.140625 8.03125 13.28125 C 7.890625 13.421875 7.699219 13.5 7.5 13.5 L 6 13.5 C 5.800781 13.5 5.609375 13.421875 5.46875 13.28125 C 5.328125 13.140625 5.25 12.949219 5.25 12.75 C 5.25 12.550781 5.328125 12.359375 5.46875 12.21875 C 5.609375 12.078125 5.800781 12 6 12 L 7.5 12 C 7.699219 12 7.890625 12.078125 8.03125 12.21875 C 8.171875 12.359375 8.25 12.550781 8.25 12.75 Z M 8.25 15.75 C 8.25 15.949219 8.171875 16.140625 8.03125 16.28125 C 7.890625 16.421875 7.699219 16.5 7.5 16.5 L 6 16.5 C 5.800781 16.5 5.609375 16.421875 5.46875 16.28125 C 5.328125 16.140625 5.25 15.949219 5.25 15.75 C 5.25 15.550781 5.328125 15.359375 5.46875 15.21875 C 5.609375 15.078125 5.800781 15 6 15 L 7.5 15 C 7.699219 15 7.890625 15.078125 8.03125 15.21875 C 8.171875 15.359375 8.25 15.550781 8.25 15.75 Z M 10.5 12.75 C 10.5 12.550781 10.578125 12.359375 10.71875 12.21875 C 10.859375 12.078125 11.050781 12 11.25 12 L 12.75 12 C 12.949219 12 13.140625 12.078125 13.28125 12.21875 C 13.421875 12.359375 13.5 12.550781 13.5 12.75 C 13.5 12.949219 13.421875 13.140625 13.28125 13.28125 C 13.140625 13.421875 12.949219 13.5 12.75 13.5 L 11.25 13.5 C 11.050781 13.5 10.859375 13.421875 10.71875 13.28125 C 10.578125 13.140625 10.5 12.949219 10.5 12.75 Z M 15.75 12.75 C 15.75 12.550781 15.828125 12.359375 15.96875 12.21875 C 16.109375 12.078125 16.300781 12 16.5 12 L 18 12 C 18.199219 12 18.390625 12.078125 18.53125 12.21875 C 18.671875 12.359375 18.75 12.550781 18.75 12.75 C 18.75 12.949219 18.671875 13.140625 18.53125 13.28125 C 18.390625 13.421875 18.199219 13.5 18 13.5 L 16.5 13.5 C 16.300781 13.5 16.109375 13.421875 15.96875 13.28125 C 15.828125 13.140625 15.75 12.949219 15.75 12.75 Z M 15.75 15.75 C 15.75 15.550781 15.828125 15.359375 15.96875 15.21875 C 16.109375 15.078125 16.300781 15 16.5 15 L 18 15 C 18.199219 15 18.390625 15.078125 18.53125 15.21875 C 18.671875 15.359375 18.75 15.550781 18.75 15.75 C 18.75 15.949219 18.671875 16.140625 18.53125 16.28125 C 18.390625 16.421875 18.199219 16.5 18 16.5 L 16.5 16.5 C 16.300781 16.5 16.109375 16.421875 15.96875 16.28125 C 15.828125 16.140625 15.75 15.949219 15.75 15.75 Z M 15.75 15.75 "/>
</g>
</svg>`, // The Clinic
    13488463351055: `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="24px" height="24px" viewBox="0 0 24 24" version="1.1">
<g id="surface1">
<path style=" stroke:none;fill-rule:nonzero;fill:rgb(0%,0%,0%);fill-opacity:1;" d="M 21.75 18.625 L 21.75 22.5 C 21.75 22.699219 21.671875 22.890625 21.53125 23.03125 C 21.390625 23.171875 21.199219 23.25 21 23.25 C 20.800781 23.25 20.609375 23.171875 20.46875 23.03125 C 20.328125 22.890625 20.25 22.699219 20.25 22.5 L 20.25 18.625 C 20.246094 17.660156 20.046875 16.710938 19.65625 15.828125 C 19.269531 14.945312 18.707031 14.152344 18 13.5 L 18 18.96875 C 18 19.132812 17.949219 19.289062 17.851562 19.417969 C 17.753906 19.546875 17.617188 19.640625 17.464844 19.6875 C 17.308594 19.734375 17.144531 19.730469 16.992188 19.675781 C 16.839844 19.617188 16.710938 19.515625 16.621094 19.382812 L 15.621094 17.851562 C 15.613281 17.839844 15.605469 17.828125 15.601562 17.816406 C 15.453125 17.554688 15.207031 17.367188 14.921875 17.285156 C 14.632812 17.207031 14.324219 17.246094 14.066406 17.390625 C 13.804688 17.539062 13.617188 17.78125 13.535156 18.070312 C 13.457031 18.359375 13.496094 18.664062 13.640625 18.925781 L 15.714844 22.09375 C 15.824219 22.257812 15.863281 22.460938 15.824219 22.65625 C 15.78125 22.851562 15.664062 23.023438 15.5 23.132812 C 15.332031 23.242188 15.128906 23.277344 14.933594 23.238281 C 14.742188 23.195312 14.570312 23.082031 14.460938 22.914062 L 12.375 19.726562 L 12.351562 19.691406 C 12.027344 19.136719 11.917969 18.484375 12.042969 17.855469 C 12.167969 17.226562 12.519531 16.667969 13.03125 16.277344 C 13.539062 15.890625 14.175781 15.703125 14.8125 15.75 C 15.453125 15.796875 16.054688 16.078125 16.5 16.539062 L 16.5 6 L 15 6 C 14.800781 6 14.609375 5.921875 14.46875 5.78125 C 14.328125 5.640625 14.25 5.449219 14.25 5.25 C 14.25 5.050781 14.328125 4.859375 14.46875 4.71875 C 14.609375 4.578125 14.800781 4.5 15 4.5 L 16.5 4.5 C 16.898438 4.5 17.28125 4.65625 17.5625 4.9375 C 17.84375 5.21875 18 5.601562 18 6 L 18 11.589844 C 19.152344 12.367188 20.09375 13.414062 20.75 14.640625 C 21.402344 15.867188 21.746094 17.234375 21.75 18.625 Z M 8.25 5.25 C 8.25 5.050781 8.171875 4.859375 8.03125 4.71875 C 7.890625 4.578125 7.699219 4.5 7.5 4.5 L 6 4.5 C 5.601562 4.5 5.21875 4.65625 4.9375 4.9375 C 4.65625 5.21875 4.5 5.601562 4.5 6 L 4.5 18.75 C 4.5 18.949219 4.578125 19.140625 4.71875 19.28125 C 4.859375 19.421875 5.050781 19.5 5.25 19.5 C 5.449219 19.5 5.640625 19.421875 5.78125 19.28125 C 5.921875 19.140625 6 18.949219 6 18.75 L 6 6 L 7.5 6 C 7.699219 6 7.890625 5.921875 8.03125 5.78125 C 8.171875 5.640625 8.25 5.449219 8.25 5.25 Z M 14.78125 9.21875 C 14.710938 9.148438 14.628906 9.09375 14.539062 9.054688 C 14.445312 9.019531 14.347656 9 14.25 9 C 14.152344 9 14.054688 9.019531 13.960938 9.054688 C 13.871094 9.09375 13.789062 9.148438 13.71875 9.21875 L 12 10.941406 L 12 1.5 C 12 1.300781 11.921875 1.109375 11.78125 0.96875 C 11.640625 0.828125 11.449219 0.75 11.25 0.75 C 11.050781 0.75 10.859375 0.828125 10.71875 0.96875 C 10.578125 1.109375 10.5 1.300781 10.5 1.5 L 10.5 10.941406 L 8.78125 9.21875 C 8.640625 9.078125 8.449219 9 8.25 9 C 8.050781 9 7.859375 9.078125 7.71875 9.21875 C 7.578125 9.359375 7.5 9.550781 7.5 9.75 C 7.5 9.949219 7.578125 10.140625 7.71875 10.28125 L 10.71875 13.28125 C 10.789062 13.351562 10.871094 13.40625 10.960938 13.445312 C 11.054688 13.480469 11.152344 13.5 11.25 13.5 C 11.347656 13.5 11.445312 13.480469 11.539062 13.445312 C 11.628906 13.40625 11.710938 13.351562 11.78125 13.28125 L 14.78125 10.28125 C 14.851562 10.210938 14.90625 10.128906 14.945312 10.039062 C 14.980469 9.945312 15 9.847656 15 9.75 C 15 9.652344 14.980469 9.554688 14.945312 9.460938 C 14.90625 9.371094 14.851562 9.289062 14.78125 9.21875 Z M 14.78125 9.21875 "/>
</g>
</svg>`, // Referrals and Rebates
    13488434662159: `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="24px" height="24px" viewBox="0 0 24 24" version="1.1">
<g id="surface1">
<path style=" stroke:none;fill-rule:nonzero;fill:rgb(0%,0%,0%);fill-opacity:1;" d="M 19.5 3.359375 L 17.25 3.359375 L 17.25 2.640625 C 17.25 2.449219 17.171875 2.265625 17.03125 2.132812 C 16.890625 1.996094 16.699219 1.921875 16.5 1.921875 C 16.300781 1.921875 16.109375 1.996094 15.96875 2.132812 C 15.828125 2.265625 15.75 2.449219 15.75 2.640625 L 15.75 3.359375 L 8.25 3.359375 L 8.25 2.640625 C 8.25 2.449219 8.171875 2.265625 8.03125 2.132812 C 7.890625 1.996094 7.699219 1.921875 7.5 1.921875 C 7.300781 1.921875 7.109375 1.996094 6.96875 2.132812 C 6.828125 2.265625 6.75 2.449219 6.75 2.640625 L 6.75 3.359375 L 4.5 3.359375 C 4.101562 3.359375 3.71875 3.511719 3.4375 3.78125 C 3.15625 4.050781 3 4.417969 3 4.800781 L 3 19.199219 C 3 19.582031 3.15625 19.949219 3.4375 20.21875 C 3.71875 20.488281 4.101562 20.640625 4.5 20.640625 L 19.5 20.640625 C 19.898438 20.640625 20.28125 20.488281 20.5625 20.21875 C 20.84375 19.949219 21 19.582031 21 19.199219 L 21 4.800781 C 21 4.417969 20.84375 4.050781 20.5625 3.78125 C 20.28125 3.511719 19.898438 3.359375 19.5 3.359375 Z M 6.75 4.800781 L 6.75 5.519531 C 6.75 5.710938 6.828125 5.894531 6.96875 6.027344 C 7.109375 6.164062 7.300781 6.238281 7.5 6.238281 C 7.699219 6.238281 7.890625 6.164062 8.03125 6.027344 C 8.171875 5.894531 8.25 5.710938 8.25 5.519531 L 8.25 4.800781 L 15.75 4.800781 L 15.75 5.519531 C 15.75 5.710938 15.828125 5.894531 15.96875 6.027344 C 16.109375 6.164062 16.300781 6.238281 16.5 6.238281 C 16.699219 6.238281 16.890625 6.164062 17.03125 6.027344 C 17.171875 5.894531 17.25 5.710938 17.25 5.519531 L 17.25 4.800781 L 19.5 4.800781 L 19.5 7.679688 L 4.5 7.679688 L 4.5 4.800781 Z M 19.5 19.199219 L 4.5 19.199219 L 4.5 9.121094 L 19.5 9.121094 Z M 15.90625 11.492188 C 15.976562 11.558594 16.03125 11.636719 16.070312 11.722656 C 16.105469 11.8125 16.125 11.90625 16.125 12 C 16.125 12.09375 16.105469 12.1875 16.070312 12.277344 C 16.03125 12.363281 15.976562 12.441406 15.90625 12.507812 L 11.40625 16.828125 C 11.335938 16.894531 11.253906 16.949219 11.164062 16.984375 C 11.070312 17.023438 10.972656 17.039062 10.875 17.039062 C 10.777344 17.039062 10.679688 17.023438 10.585938 16.984375 C 10.496094 16.949219 10.414062 16.894531 10.34375 16.828125 L 8.09375 14.667969 C 7.953125 14.535156 7.875 14.351562 7.875 14.160156 C 7.875 13.96875 7.953125 13.785156 8.09375 13.652344 C 8.234375 13.515625 8.425781 13.441406 8.625 13.441406 C 8.824219 13.441406 9.015625 13.515625 9.15625 13.652344 L 10.875 15.300781 L 14.84375 11.492188 C 14.914062 11.421875 14.996094 11.371094 15.085938 11.335938 C 15.179688 11.296875 15.277344 11.28125 15.375 11.28125 C 15.472656 11.28125 15.570312 11.296875 15.664062 11.335938 C 15.753906 11.371094 15.835938 11.421875 15.90625 11.492188 Z M 15.90625 11.492188 "/>
</g>
</svg>`, // Appointments
    13488399682319: `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="24px" height="24px" viewBox="0 0 24 24" version="1.1">
<g id="surface1">
<path style=" stroke:none;fill-rule:nonzero;fill:rgb(0%,0%,0%);fill-opacity:1;" d="M 19.5 4.5 L 4.5 4.5 C 3.902344 4.5 3.332031 4.738281 2.910156 5.160156 C 2.488281 5.582031 2.25 6.152344 2.25 6.75 L 2.25 17.25 C 2.25 17.847656 2.488281 18.417969 2.910156 18.839844 C 3.332031 19.261719 3.902344 19.5 4.5 19.5 L 19.5 19.5 C 20.097656 19.5 20.667969 19.261719 21.089844 18.839844 C 21.511719 18.417969 21.75 17.847656 21.75 17.25 L 21.75 6.75 C 21.75 6.152344 21.511719 5.582031 21.089844 5.160156 C 20.667969 4.738281 20.097656 4.5 19.5 4.5 Z M 3.75 9 L 20.25 9 L 20.25 10.5 L 15 10.5 C 14.800781 10.5 14.609375 10.578125 14.46875 10.71875 C 14.328125 10.859375 14.25 11.050781 14.25 11.25 C 14.25 11.847656 14.011719 12.417969 13.589844 12.839844 C 13.167969 13.261719 12.597656 13.5 12 13.5 C 11.402344 13.5 10.832031 13.261719 10.410156 12.839844 C 9.988281 12.417969 9.75 11.847656 9.75 11.25 C 9.75 11.050781 9.671875 10.859375 9.53125 10.71875 C 9.390625 10.578125 9.199219 10.5 9 10.5 L 3.75 10.5 Z M 4.5 6 L 19.5 6 C 19.699219 6 19.890625 6.078125 20.03125 6.21875 C 20.171875 6.359375 20.25 6.550781 20.25 6.75 L 20.25 7.5 L 3.75 7.5 L 3.75 6.75 C 3.75 6.550781 3.828125 6.359375 3.96875 6.21875 C 4.109375 6.078125 4.300781 6 4.5 6 Z M 19.5 18 L 4.5 18 C 4.300781 18 4.109375 17.921875 3.96875 17.78125 C 3.828125 17.640625 3.75 17.449219 3.75 17.25 L 3.75 12 L 8.324219 12 C 8.496094 12.847656 8.957031 13.609375 9.625 14.15625 C 10.296875 14.703125 11.136719 15.003906 12 15.003906 C 12.863281 15.003906 13.703125 14.703125 14.375 14.15625 C 15.042969 13.609375 15.503906 12.847656 15.675781 12 L 20.25 12 L 20.25 17.25 C 20.25 17.449219 20.171875 17.640625 20.03125 17.78125 C 19.890625 17.921875 19.699219 18 19.5 18 Z M 19.5 18 "/>
</g>
</svg>`, // Fees and payments
    12279761651215: `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="24px" height="24px" viewBox="0 0 24 24" version="1.1">
<g id="surface1">
<path style=" stroke:none;fill-rule:nonzero;fill:rgb(0%,0%,0%);fill-opacity:1;" d="M 12.75 6.960938 L 12.75 10.835938 L 16.164062 9.195312 C 16.34375 9.109375 16.546875 9.097656 16.738281 9.15625 C 16.925781 9.214844 17.082031 9.347656 17.171875 9.515625 C 17.261719 9.6875 17.273438 9.886719 17.210938 10.066406 C 17.148438 10.25 17.011719 10.398438 16.835938 10.484375 L 12.335938 12.644531 C 12.222656 12.699219 12.09375 12.722656 11.964844 12.71875 C 11.839844 12.714844 11.714844 12.675781 11.605469 12.613281 C 11.496094 12.546875 11.40625 12.457031 11.34375 12.351562 C 11.28125 12.242188 11.25 12.121094 11.25 12 L 11.25 6.960938 C 11.25 6.769531 11.328125 6.585938 11.46875 6.449219 C 11.609375 6.316406 11.800781 6.238281 12 6.238281 C 12.199219 6.238281 12.390625 6.316406 12.53125 6.449219 C 12.671875 6.585938 12.75 6.769531 12.75 6.960938 Z M 12 19.921875 C 10.367188 19.921875 8.773438 19.457031 7.417969 18.585938 C 6.058594 17.714844 5.003906 16.476562 4.378906 15.03125 C 3.753906 13.582031 3.589844 11.992188 3.910156 10.453125 C 4.226562 8.917969 5.011719 7.507812 6.167969 6.398438 C 7.320312 5.292969 8.789062 4.539062 10.390625 4.230469 C 11.992188 3.925781 13.648438 4.082031 15.15625 4.683594 C 16.664062 5.28125 17.953125 6.296875 18.859375 7.601562 C 19.765625 8.902344 20.25 10.433594 20.25 12 C 20.25 12.191406 20.328125 12.375 20.46875 12.507812 C 20.609375 12.644531 20.800781 12.71875 21 12.71875 C 21.199219 12.71875 21.390625 12.644531 21.53125 12.507812 C 21.671875 12.375 21.75 12.191406 21.75 12 C 21.75 10.148438 21.179688 8.339844 20.105469 6.800781 C 19.035156 5.261719 17.511719 4.0625 15.730469 3.351562 C 13.949219 2.644531 11.988281 2.457031 10.097656 2.820312 C 8.207031 3.179688 6.46875 4.074219 5.105469 5.382812 C 3.742188 6.691406 2.8125 8.359375 2.4375 10.175781 C 2.0625 11.988281 2.253906 13.871094 2.992188 15.582031 C 3.730469 17.292969 4.980469 18.753906 6.582031 19.78125 C 8.1875 20.8125 10.070312 21.359375 12 21.359375 C 12.199219 21.359375 12.390625 21.285156 12.53125 21.148438 C 12.671875 21.015625 12.75 20.832031 12.75 20.640625 C 12.75 20.449219 12.671875 20.265625 12.53125 20.132812 C 12.390625 19.996094 12.199219 19.921875 12 19.921875 Z M 21.726562 20.453125 C 21.753906 20.546875 21.761719 20.644531 21.75 20.738281 C 21.738281 20.832031 21.707031 20.925781 21.65625 21.007812 C 21.605469 21.089844 21.539062 21.164062 21.460938 21.222656 C 21.382812 21.28125 21.292969 21.324219 21.195312 21.347656 C 21.101562 21.375 21 21.378906 20.902344 21.367188 C 20.800781 21.351562 20.707031 21.320312 20.621094 21.273438 C 20.535156 21.222656 20.460938 21.160156 20.402344 21.082031 C 20.34375 21.003906 20.300781 20.917969 20.273438 20.824219 C 20.011719 19.867188 19.074219 19.199219 18 19.199219 C 16.925781 19.199219 15.988281 19.867188 15.726562 20.824219 C 15.683594 20.976562 15.589844 21.113281 15.457031 21.210938 C 15.324219 21.308594 15.164062 21.359375 15 21.359375 C 14.933594 21.359375 14.871094 21.351562 14.808594 21.335938 C 14.613281 21.285156 14.449219 21.167969 14.351562 21 C 14.25 20.835938 14.222656 20.640625 14.273438 20.453125 C 14.519531 19.585938 15.089844 18.839844 15.878906 18.355469 C 15.460938 17.953125 15.171875 17.441406 15.058594 16.882812 C 14.941406 16.324219 15 15.742188 15.226562 15.21875 C 15.453125 14.691406 15.839844 14.242188 16.332031 13.925781 C 16.824219 13.605469 17.40625 13.4375 18 13.4375 C 18.59375 13.4375 19.171875 13.605469 19.667969 13.925781 C 20.160156 14.242188 20.542969 14.691406 20.773438 15.21875 C 21 15.742188 21.058594 16.324219 20.941406 16.882812 C 20.824219 17.441406 20.539062 17.953125 20.121094 18.355469 C 20.910156 18.839844 21.480469 19.585938 21.726562 20.453125 Z M 16.5 16.320312 C 16.5 16.605469 16.589844 16.882812 16.753906 17.121094 C 16.917969 17.355469 17.152344 17.542969 17.425781 17.648438 C 17.699219 17.757812 18 17.789062 18.292969 17.730469 C 18.582031 17.675781 18.851562 17.539062 19.0625 17.339844 C 19.269531 17.136719 19.414062 16.878906 19.472656 16.601562 C 19.527344 16.320312 19.5 16.03125 19.386719 15.769531 C 19.273438 15.503906 19.078125 15.28125 18.832031 15.121094 C 18.585938 14.964844 18.296875 14.878906 18 14.878906 C 17.601562 14.878906 17.21875 15.03125 16.9375 15.300781 C 16.65625 15.570312 16.5 15.9375 16.5 16.320312 Z M 16.5 16.320312 "/>
</g>
</svg>`, // Sessions
    13488480062351: `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="24px" height="24px" viewBox="0 0 24 24" version="1.1">
<g id="surface1">
<path style=" stroke:none;fill-rule:nonzero;fill:rgb(0%,0%,0%);fill-opacity:1;" d="M 15.75 14.160156 C 15.75 14.351562 15.671875 14.535156 15.53125 14.667969 C 15.390625 14.804688 15.199219 14.878906 15 14.878906 L 9 14.878906 C 8.800781 14.878906 8.609375 14.804688 8.46875 14.667969 C 8.328125 14.535156 8.25 14.351562 8.25 14.160156 C 8.25 13.96875 8.328125 13.785156 8.46875 13.652344 C 8.609375 13.515625 8.800781 13.441406 9 13.441406 L 15 13.441406 C 15.199219 13.441406 15.390625 13.515625 15.53125 13.652344 C 15.671875 13.785156 15.75 13.96875 15.75 14.160156 Z M 15 10.558594 L 9 10.558594 C 8.800781 10.558594 8.609375 10.636719 8.46875 10.769531 C 8.328125 10.90625 8.25 11.089844 8.25 11.28125 C 8.25 11.472656 8.328125 11.652344 8.46875 11.789062 C 8.609375 11.925781 8.800781 12 9 12 L 15 12 C 15.199219 12 15.390625 11.925781 15.53125 11.789062 C 15.671875 11.652344 15.75 11.472656 15.75 11.28125 C 15.75 11.089844 15.671875 10.90625 15.53125 10.769531 C 15.390625 10.636719 15.199219 10.558594 15 10.558594 Z M 20.25 4.800781 L 20.25 19.921875 C 20.25 20.300781 20.09375 20.667969 19.8125 20.9375 C 19.53125 21.207031 19.148438 21.359375 18.75 21.359375 L 5.25 21.359375 C 4.851562 21.359375 4.46875 21.207031 4.1875 20.9375 C 3.90625 20.667969 3.75 20.300781 3.75 19.921875 L 3.75 4.800781 C 3.75 4.417969 3.90625 4.050781 4.1875 3.78125 C 4.46875 3.511719 4.851562 3.359375 5.25 3.359375 L 8.648438 3.359375 C 9.070312 2.90625 9.585938 2.542969 10.164062 2.296875 C 10.742188 2.046875 11.367188 1.921875 12 1.921875 C 12.632812 1.921875 13.257812 2.046875 13.835938 2.296875 C 14.414062 2.542969 14.929688 2.90625 15.351562 3.359375 L 18.75 3.359375 C 19.148438 3.359375 19.53125 3.511719 19.8125 3.78125 C 20.09375 4.050781 20.25 4.417969 20.25 4.800781 Z M 9 6.238281 L 15 6.238281 C 15 5.476562 14.683594 4.742188 14.121094 4.203125 C 13.558594 3.664062 12.796875 3.359375 12 3.359375 C 11.203125 3.359375 10.441406 3.664062 9.878906 4.203125 C 9.316406 4.742188 9 5.476562 9 6.238281 Z M 18.75 4.800781 L 16.242188 4.800781 C 16.414062 5.261719 16.5 5.75 16.5 6.238281 L 16.5 6.960938 C 16.5 7.152344 16.421875 7.335938 16.28125 7.46875 C 16.140625 7.605469 15.949219 7.679688 15.75 7.679688 L 8.25 7.679688 C 8.050781 7.679688 7.859375 7.605469 7.71875 7.46875 C 7.578125 7.335938 7.5 7.152344 7.5 6.960938 L 7.5 6.238281 C 7.5 5.75 7.585938 5.261719 7.757812 4.800781 L 5.25 4.800781 L 5.25 19.921875 L 18.75 19.921875 Z M 18.75 4.800781 "/>
</g>
</svg>`, // Assessments
    // Add more mappings as needed
  };

  // Default icon for sections without specific mapping
  const DEFAULT_FAQ_ICON = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="24px" height="24px" viewBox="0 0 24 24" version="1.1">
<g id="surface1">
<path style=" stroke:none;fill-rule:nonzero;fill:rgb(0%,0%,0%);fill-opacity:1;" d="M 13.5 17.761719 C 13.5 17.949219 13.421875 18.132812 13.28125 18.269531 C 13.140625 18.402344 12.949219 18.480469 12.75 18.480469 L 11.25 18.480469 C 11.050781 18.480469 10.859375 18.402344 10.71875 18.269531 C 10.578125 18.132812 10.5 17.949219 10.5 17.761719 C 10.5 17.570312 10.578125 17.386719 10.71875 17.25 C 10.859375 17.117188 11.050781 17.039062 11.25 17.039062 L 12.75 17.039062 C 12.949219 17.039062 13.140625 17.117188 13.28125 17.25 C 13.421875 17.386719 13.5 17.570312 13.5 17.761719 Z M 11.25 6.960938 L 12.75 6.960938 C 12.949219 6.960938 13.140625 6.882812 13.28125 6.75 C 13.421875 6.613281 13.5 6.429688 13.5 6.238281 C 13.5 6.050781 13.421875 5.867188 13.28125 5.730469 C 13.140625 5.597656 12.949219 5.519531 12.75 5.519531 L 11.25 5.519531 C 11.050781 5.519531 10.859375 5.597656 10.71875 5.730469 C 10.578125 5.867188 10.5 6.050781 10.5 6.238281 C 10.5 6.429688 10.578125 6.613281 10.71875 6.75 C 10.859375 6.882812 11.050781 6.960938 11.25 6.960938 Z M 12.75 11.28125 L 11.25 11.28125 C 11.050781 11.28125 10.859375 11.355469 10.71875 11.492188 C 10.578125 11.625 10.5 11.808594 10.5 12 C 10.5 12.191406 10.578125 12.375 10.71875 12.507812 C 10.859375 12.644531 11.050781 12.71875 11.25 12.71875 L 12.75 12.71875 C 12.949219 12.71875 13.140625 12.644531 13.28125 12.507812 C 13.421875 12.375 13.5 12.191406 13.5 12 C 13.5 11.808594 13.421875 11.625 13.28125 11.492188 C 13.140625 11.355469 12.949219 11.28125 12.75 11.28125 Z M 20.25 4.078125 L 20.25 19.921875 C 20.25 20.300781 20.09375 20.667969 19.8125 20.9375 C 19.53125 21.207031 19.148438 21.359375 18.75 21.359375 L 5.25 21.359375 C 4.851562 21.359375 4.46875 21.207031 4.1875 20.9375 C 3.90625 20.667969 3.75 20.300781 3.75 19.921875 L 3.75 4.078125 C 3.75 3.699219 3.90625 3.332031 4.1875 3.0625 C 4.46875 2.792969 4.851562 2.640625 5.25 2.640625 L 18.75 2.640625 C 19.148438 2.640625 19.53125 2.792969 19.8125 3.0625 C 20.09375 3.332031 20.25 3.699219 20.25 4.078125 Z M 5.25 14.160156 L 18.75 14.160156 L 18.75 9.839844 L 5.25 9.839844 Z M 5.25 4.078125 L 5.25 8.398438 L 18.75 8.398438 L 18.75 4.078125 Z M 18.75 19.921875 L 18.75 15.601562 L 5.25 15.601562 L 5.25 19.921875 Z M 18.75 19.921875 "/>
</g>
</svg>`;

// ============================================
// COMMUNITY TOPIC ICON MAPPINGS
// ============================================
const COMMUNITY_TOPIC_ICONS = {
  '13442511768975': `<svg xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 -960 960 960" width="20px" fill="currentColor"><path d="M480-120q-75 0-140.5-28T225-225q-49-49-77-114.5T120-480q0-75 28-140.5T225-735q49-49 114.5-77T480-840q75 0 140.5 28T735-735q49 49 77 114.5T840-480q0 75-28 140.5T735-225q-49 49-114.5 77T480-120Zm0-72q120 0 204-84t84-204q0-120-84-204t-204-84q-120 0-204 84t-84 204q0 120 84 204t204 84Zm-54-62l260-260-52-52-208 208-102-102-52 52 154 154Z"/></svg>`, // Feature Requests
  '14344790141839': `<svg xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 -960 960 960" width="20px" fill="currentColor"><path d="M240-400h360v-72H240v72Zm0-120h480v-72H240v72Zm0-120h480v-72H240v72ZM96-96v-696q0-29.7 21.15-50.85Q138.3-864 168-864h624q29.7 0 50.85 21.15Q864-821.7 864-792v480q0 29.7-21.15 50.85Q821.7-240 792-240H240L96-96Z"/></svg>`, // Feedback
  '13442511765647': `<svg xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 -960 960 960" width="20px" fill="currentColor"><path d="M384-336v-72h336v72H384Zm0-144v-72h336v72H384ZM240-624v-72h480v72H240ZM720-96H168q-29.7 0-50.85-21.15Q96-138.3 96-168v-624q0-29.7 21.15-50.85Q138.3-864 168-864h624q29.7 0 50.85 21.15Q864-821.7 864-792v480L720-96Z"/></svg>`, // General Discussion
  '14344791722383': `<svg xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 -960 960 960" width="20px" fill="currentColor"><path d="M240-192v-384h-48v-192h264v-96h48v96h264v192h-48v384h-72v-384H552v384h-72v-384h-96v384h-144Zm0-456h480v-48H240v48Z"/></svg>`, // Noticeboard
  '14393248928655': `<svg xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 -960 960 960" width="20px" fill="currentColor"><path d="M576-96v-72h168v-264H216v168h-72v-432q0-29.7 21.15-50.85Q186.3-768 216-768h72v-96h72v96h240v-96h72v96h72q29.7 0 50.85 21.15Q816-725.7 816-696v528q0 29.7-21.15 50.85Q773.7-96 744-96H576ZM216-408h528v-288H216v288Zm0 0v-288 288ZM96-96v-192h192v192H96Z"/></svg>` // Upcoming events
};

// Default fallback icon
const DEFAULT_COMMUNITY_TOPIC_ICON = `<svg xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 -960 960 960" width="20px" fill="currentColor"><circle cx="480" cy="-480" r="400"/></svg>`;

// ============================================
// SET COMMUNITY TOPIC ICONS
// ============================================
function setCommunityTopicIcons() {
  const topicItems = document.querySelectorAll('.topics-item[data-topic-id]');
  
  topicItems.forEach(item => {
    const topicId = item.getAttribute('data-topic-id');
    const iconWrapper = item.querySelector('.topic-icon-wrapper');
    
    if (iconWrapper) {
      const icon = COMMUNITY_TOPIC_ICONS[topicId] || DEFAULT_COMMUNITY_TOPIC_ICON;
      iconWrapper.innerHTML = icon;
    }
  });
}

  // Renderers - FAQ Sections (for support brand)
  function displayFAQSections(containerId, sections) {
    const container = qs(`#${containerId}`);
    if (!container) {
      console.error(`Container with ID "${containerId}" not found.`);
      return;
    }
    
    container.innerHTML = "";
    
    if (!sections || !sections.length) {
      container.innerHTML = "<p>No FAQ sections found.</p>";
      return;
    }

    const frag = document.createDocumentFragment();
    
    sections.forEach((section) => {
      // Get icon for this section, fallback to default
      const icon = FAQ_SECTION_ICONS[section.id] || DEFAULT_FAQ_ICON;
      
      const wrapper = document.createElement("div");
      wrapper.innerHTML = `
        <article class="article-item faq-section-item">
          <div class="article-inner">
            <div class="faq-section-icon">
              ${icon}
            </div>
            <div class="faq-section-content">
              <h3 class="article-title">
                <a href="${section.html_url}">${section.name}</a>
              </h3>
            </div>
          </div>
        </article>
      `.trim();
      frag.appendChild(wrapper.firstElementChild);
    });
    
    container.appendChild(frag);
  }
  
  // Renderers - Top Tags (for team brand)
  function displayTopTagLinks(containerId, tags) {
    const container = qs(`#${containerId}`);
    if (!container) {
      console.error(`Container with ID "${containerId}" not found.`);
      return;
    }
    container.innerHTML = "";
    if (!tags || !tags.length) return;

    const frag = document.createDocumentFragment();
    tags.forEach((tag, index) => {
      const link = document.createElement("a");
      link.href = `/hc/en-au/search?content_tags=${tag.id}`;
      link.textContent = tag.name;
      link.className = "popular-tag-link";
      frag.appendChild(link);

      // Add comma and space between tags, but not after the last tag
      if (index < tags.length - 1) {
        frag.appendChild(document.createTextNode(", "));
      }
    });
    container.appendChild(frag);
  }

  // Search helpers
  let searchFormFilledClassName = "search-has-value";
  let searchFormSelector = "form[role='search']";

  function clearSearchInput(event) {
    const form = event.target.closest(searchFormSelector);
    if (!form) return;
    form.classList.remove(searchFormFilledClassName);

    let input;
    if (event.target.tagName === "INPUT") {
      input = event.target;
    } else if (event.target.tagName === "BUTTON") {
      input = event.target.previousElementSibling;
    } else {
      input = event.target.closest("button").previousElementSibling;
    }
    if (input) {
      input.value = "";
      input.focus();
    }
  }

  function clearSearchInputOnKeypress(event) {
    const searchInputDeleteKeys = ["Delete", "Escape"];
    if (searchInputDeleteKeys.includes(event.key)) {
      clearSearchInput(event);
    }
  }

  function buildClearSearchButton(inputId) {
    const button = document.createElement("button");
    button.setAttribute("type", "button");
    button.setAttribute("aria-controls", inputId);
    button.classList.add("clear-button");
    const buttonLabel = window.searchClearButtonLabelLocalized;
    const icon = `<svg xmlns='http://www.w3.org/2000/svg' width='12' height='12' focusable='false' role='img' viewBox='0 0 12 12' aria-label='${buttonLabel}'><path stroke='currentColor' stroke-linecap='round' stroke-width='2' d='M3 9l6-6m0 6L3 3'/></svg>`;
    button.innerHTML = icon;
    button.addEventListener("click", clearSearchInput);
    button.addEventListener("keyup", clearSearchInputOnKeypress);
    return button;
  }

  function appendClearSearchButton(input, form) {
    const searchClearButton = buildClearSearchButton(input.id);
    form.append(searchClearButton);
    if (input.value.length > 0) {
      form.classList.add(searchFormFilledClassName);
    }
  }

  const toggleClearSearchButtonAvailability = debounce((event) => {
    const form = event.target.closest(searchFormSelector);
    if (!form) return;
    form.classList.toggle(
      searchFormFilledClassName,
      event.target.value.length > 0
    );
  }, 200);

  // ============================================
  // SMOOTH SCROLLING FUNCTIONALITY - NEW ADDITION
  // ============================================
  
  function initSmoothScrolling() {
    // Select all anchor links that start with #
    const anchorLinks = document.querySelectorAll('a[href^="#"]:not([href="#"])');
    
    anchorLinks.forEach(function(link) {
      link.addEventListener('click', function(e) {
        // Get the target element
        const targetId = this.getAttribute('href');
        const targetElement = document.querySelector(targetId);
        
        if (targetElement) {
          e.preventDefault();
          
          // Calculate offset (adjust if you have a fixed header)
          const headerOffset = 80; // Adjust this value based on your header height
          const elementPosition = targetElement.getBoundingClientRect().top;
          const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
          
          // Smooth scroll to target
          window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
          });
          
          // Update URL hash without jumping
          if (history.pushState) {
            history.pushState(null, null, targetId);
          } else {
            window.location.hash = targetId;
          }
        }
      });
    });
    
    // Handle direct navigation to anchored URLs (when page loads with hash)
    if (window.location.hash) {
      setTimeout(function() {
        const targetElement = document.querySelector(window.location.hash);
        if (targetElement) {
          const headerOffset = 80; // Same offset as above
          const elementPosition = targetElement.getBoundingClientRect().top;
          const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
          
          window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
          });
        }
      }, 100); // Small delay to ensure page is fully loaded
    }
  }

  // One DOMContentLoaded to rule them all
  document.addEventListener("DOMContentLoaded", () => {
    // Reading time
    readingTime();

    // Table of Contents
    (function buildTOC() {
      const tocContainer = qs(".toc-container");
      if (!tocContainer) return;

      const headings = qsa(".article-content h2, h3");
      if (!headings.length) {
        if (tocContainer.parentElement)
          tocContainer.parentElement.style.display = "none";
        return;
      }

      const tocList = document.createElement("ul");
      let currentLevel = 2;
      let currentList = tocList;

      tocContainer.setAttribute("role", "navigation");
      tocContainer.setAttribute("aria-label", "Table of Contents");

      headings.forEach((heading, index) => {
        if (!heading.id) {
          heading.id =
            (heading.textContent || "")
              .trim()
              .toLowerCase()
              .replace(/\W+/g, "-") +
            "-" +
            index;
        }

        const level = parseInt(heading.tagName[1], 10);
        const listItem = document.createElement("li");
        const link = document.createElement("a");

        link.href = `#${heading.id}`;
        link.textContent = heading.textContent || "";
        link.classList.add("toc-link");

        const nextHeading = headings[index + 1];
        if (nextHeading && parseInt(nextHeading.tagName[1], 10) > level) {
          link.classList.add("has-children");
        }

        listItem.appendChild(link);

        if (level > currentLevel) {
          const nestedList = document.createElement("ul");
          nestedList.classList.add("nested");
          if (currentList.lastElementChild) {
            currentList.lastElementChild.appendChild(nestedList);
            currentList = nestedList;
          }
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

      tocContainer.addEventListener("click", (e) => {
        const t = e.target;
        if (t && t.classList && t.classList.contains("has-children")) {
          e.preventDefault();
          e.stopPropagation();
          t.classList.toggle("expanded");
          const nestedList = t.parentElement.querySelector(".nested");
          if (nestedList) nestedList.classList.toggle("show");
        }
      });
    })();

    // Navigation
    (function nav() {
      const menuButton = qs(".header-nav .menu-button-mobile");
      const menuList = qs("#user-nav-mobile");
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

      const collapsible = qsa(".collapsible-nav, .collapsible-sidebar");
      collapsible.forEach((element) => {
        const toggle = qs(
          ".collapsible-nav-toggle, .collapsible-sidebar-toggle",
          element
        );
        element.addEventListener("click", () =>
          toggleNavigation(toggle, element)
        );
        element.addEventListener("keyup", (event) => {
          // keep console.log("escape") behavior
          console.log("escape");
          if (event.keyCode === ESCAPE) closeNavigation(toggle, element);
        });
      });

      const multibrandFilterLists = qsa(".multibrand-filter-list");
      multibrandFilterLists.forEach((filter) => {
        if (filter.children.length > 6) {
          const trigger = qs(".see-all-filters", filter);
          if (!trigger) return;
          trigger.setAttribute("aria-hidden", false);
          trigger.addEventListener("click", (event) => {
            event.stopPropagation();
            trigger.parentNode.removeChild(trigger);
            filter.classList.remove("multibrand-filter-list--collapsed");
          });
        }
      });
    })();

    // Dropdowns
    (function dropdownsInit() {
      const dropdownToggles = qsa(".dropdown-toggle");
      dropdownToggles.forEach((toggle) => {
        const menu = toggle.nextElementSibling;
        if (menu && menu.classList.contains("dropdown-menu")) {
          new Dropdown(toggle, menu);
        }
      });
    })();

    // Share
    (function shareInit() {
      const links = qsa(".share a");
      links.forEach((anchor) => {
        anchor.addEventListener("click", (event) => {
          event.preventDefault();
          window.open(anchor.href, "", "height = 500, width = 500");
        });
      });
    })();

    // Search field clear button
    (function searchInit() {
      const searchForms = qsa(searchFormSelector);
      const searchInputs = searchForms
        .map((form) => qs("input[type='search']", form))
        .filter(Boolean);
      searchInputs.forEach((input) => {
        appendClearSearchButton(input, input.closest(searchFormSelector));
        input.addEventListener("keyup", clearSearchInputOnKeypress);
        input.addEventListener("keyup", toggleClearSearchButtonAvailability);
      });
    })();

    // Forms
    (function formsInit() {
      // Preserve focus
      (function returnFocus() {
        const key = "returnFocusTo";
        const returnFocusTo = sessionStorage.getItem(key);
        if (returnFocusTo) {
          sessionStorage.removeItem("returnFocusTo");
          const el = qs(returnFocusTo);
          el && el.focus && el.focus();
        }
      })();
      
      const commentContainerTextarea = qs(".comment-container textarea");
      const commentContainerFormControls = qs(
        ".comment-form-controls, .comment-ccs"
      );

      if (commentContainerTextarea) {
        commentContainerTextarea.addEventListener(
          "focus",
          function focusCommentContainerTextarea() {
            if (commentContainerFormControls)
              commentContainerFormControls.style.display = "block";
            commentContainerTextarea.removeEventListener(
              "focus",
              focusCommentContainerTextarea
            );
          }
        );

        if (
          commentContainerTextarea.value !== "" &&
          commentContainerFormControls
        ) {
          commentContainerFormControls.style.display = "block";
        }
      }

      const showRequestCommentContainerTrigger = qs(
        ".request-container .comment-container .comment-show-container"
      );
      const requestCommentFields = qsa(
        ".request-container .comment-container .comment-fields"
      );
      const requestCommentSubmit = qs(
        ".request-container .comment-container .request-submit-comment"
      );

      if (showRequestCommentContainerTrigger) {
        showRequestCommentContainerTrigger.addEventListener("click", () => {
          showRequestCommentContainerTrigger.style.display = "none";
          requestCommentFields.forEach((el) => {
            el.style.display = "block";
          });
          if (requestCommentSubmit)
            requestCommentSubmit.style.display = "inline-block";
          if (commentContainerTextarea) commentContainerTextarea.focus();
        });
      }

      const requestMarkAsSolvedButton = qs(
        ".request-container .mark-as-solved:not([data-disabled])"
      );
      const requestMarkAsSolvedCheckbox = qs(
        ".request-container .comment-container input[type=checkbox]"
      );
      const requestCommentSubmitButton = qs(
        ".request-container .comment-container input[type=submit]"
      );

      if (requestMarkAsSolvedButton) {
        requestMarkAsSolvedButton.addEventListener("click", () => {
          if (requestMarkAsSolvedCheckbox)
            requestMarkAsSolvedCheckbox.setAttribute("checked", true);
          if (requestCommentSubmitButton)
            requestCommentSubmitButton.disabled = true;
          requestMarkAsSolvedButton.setAttribute("data-disabled", true);
          requestMarkAsSolvedButton.form.submit();
        });
      }

      const requestCommentTextarea = qs(
        ".request-container .comment-container textarea"
      );
      const usesWysiwyg =
        requestCommentTextarea &&
        requestCommentTextarea.dataset.helper === "wysiwyg";

      function isEmptyPlaintext(s) {
        return s.trim() === "";
      }
      function isEmptyHtml(xml) {
        const doc = new DOMParser().parseFromString(
          `<_>${xml}</_>`,
          "text/xml"
        );
        const img = doc.querySelector("img");
        return (
          img === null && isEmptyPlaintext(doc.children[0].textContent || "")
        );
      }
      const isEmpty = usesWysiwyg ? isEmptyHtml : isEmptyPlaintext;

      if (requestCommentTextarea) {
        requestCommentTextarea.addEventListener("input", () => {
          if (isEmpty(requestCommentTextarea.value)) {
            if (requestMarkAsSolvedButton) {
              requestMarkAsSolvedButton.innerText =
                requestMarkAsSolvedButton.getAttribute(
                  "data-solve-translation"
                );
            }
          } else {
            if (requestMarkAsSolvedButton) {
              requestMarkAsSolvedButton.innerText =
                requestMarkAsSolvedButton.getAttribute(
                  "data-solve-and-submit-translation"
                );
            }
          }
        });
      }

      const selects = qsa(
        "#request-status-select, #request-organization-select"
      );
      selects.forEach((element) => {
        element.addEventListener("change", (event) => {
          event.stopPropagation();
          const activeElementId =
            document.activeElement && document.activeElement.getAttribute("id");
          if (activeElementId)
            sessionStorage.setItem("returnFocusTo", "#" + activeElementId);
          element.form.submit();
        });
      });

      const quickSearch = qs("#quick-search");
      if (quickSearch) {
        quickSearch.addEventListener("keyup", (event) => {
          if (event.keyCode === ENTER) {
            event.stopPropagation();
            const activeElementId =
              document.activeElement &&
              document.activeElement.getAttribute("id");
            if (activeElementId)
              sessionStorage.setItem("returnFocusTo", "#" + activeElementId);
            quickSearch.form.submit();
          }
        });
      }

      const requestOrganisationSelect = qs("#request-organization select");
      if (requestOrganisationSelect) {
        requestOrganisationSelect.addEventListener("change", () => {
          requestOrganisationSelect.form.submit();
        });
        requestOrganisationSelect.addEventListener("click", (e) => {
          e.stopPropagation();
        });
      }

      const notificationElm = qs(".notification-error");
      if (
        notificationElm &&
        notificationElm.previousElementSibling &&
        typeof notificationElm.previousElementSibling.focus === "function"
      ) {
        notificationElm.previousElementSibling.focus();
      }
    })();

    // ============================================
    // COMMUNITY TOPIC ICONS INITIALIZATION - TEAM BRAND ONLY 
    // ============================================
    
    const brand = detectBrand();
    
    if (brand === 'team') {
      // Only run on team brand and if we're on a community topics page
      const topicsList = document.querySelector('.topics-list');
      if (topicsList) {
        setCommunityTopicIcons();
        
        // Watch for dynamically loaded community topics
        const communityObserver = new MutationObserver(function(mutations) {
          setCommunityTopicIcons();
        });
        
        communityObserver.observe(topicsList, {
          childList: true,
          subtree: true
        });
      }
    }
    
    // ============================================
    // BRAND-SPECIFIC CONTENT LOADING
    // ============================================
    (async function bootContent() {
      try {
        const brand = detectBrand();
        
        if (brand === 'team') {
          // TEAM BRAND: Load articles and top tags
          console.log("🚀 Loading content for Team brand...");
          
          // Only load recent articles if the container exists
          const recentArticlesContainer = document.getElementById('recent-articles');
          if (recentArticlesContainer) {
            const articles = await fetchRecentlyUpdatedArticles(5);
            if (articles && articles.length > 0) {
              console.log("✅ Displaying recent articles:", articles.length);
              displayRecentArticles("recent-articles", articles);
            } else {
              recentArticlesContainer.innerHTML = "<p>No recently updated articles found.</p>";
            }
          }

          // Only load top tags if the container exists
          const topTagsContainer = document.getElementById('top-tags');
          if (topTagsContainer) {
            try {
              const topTags = await fetchTopContentTags(3);
              if (topTags && topTags.length > 0) {
                console.log("✅ Displaying top tags:", topTags.length);
                displayTopTagLinks("top-tags", topTags);
              }
            } catch (error) {
              console.log("⚠️ Top tags not available:", error);
            }
          }
          
        } else {
          // SUPPORT BRAND: Load FAQ sections
          console.log("🚀 Loading content for Support brand...");
          
          // Only load FAQ sections if the container exists
          const recentArticlesContainer = document.getElementById('recent-articles');
          if (recentArticlesContainer) {
            const FAQ_CATEGORY_ID = 12279744997263;
            
            const faqSections = await fetchFAQSectionsDirectly(FAQ_CATEGORY_ID);
            
            if (faqSections && faqSections.length > 0) {
              console.log("✅ Displaying FAQ sections:", faqSections.length);
              displayFAQSections("recent-articles", faqSections);
            } else {
              console.log("⚠️ No FAQ sections found, trying fallback method");
              const fallbackSections = await fetchFAQSectionsByID(FAQ_CATEGORY_ID);
              if (fallbackSections && fallbackSections.length > 0) {
                displayFAQSections("recent-articles", fallbackSections);
              } else {
                recentArticlesContainer.innerHTML = "<p>No FAQ sections found.</p>";
              }
            }
          }
        }
        
      } catch (error) {
        console.error("❌ Failed to load content:", error);
        const container = qs("#recent-articles");
        if (container) {
          container.innerHTML = "<p>Unable to load content. Please try again later.</p>";
        }
      }
    })();  // This self-invokes the bootContent function

    // ============================================
    // RECENT ACTIVITY ORDER SWAP - SIMPLIFIED
    // ============================================
    (function() {
      console.log('Recent activity swap script initialized');
      
      let hasSwapped = {};
      
      function swapRecentActivityOrder() {
        const items = document.querySelectorAll('.recent-activity-item');
        
        if (items.length === 0) {
          return false;
        }
        
        let swappedCount = 0;
        
        items.forEach((item) => {
          // Create a unique identifier for this item
          const itemText = item.textContent.trim();
          const itemId = itemText.substring(0, 50);
          
          // Skip if we've already swapped this exact item
          if (hasSwapped[itemId]) {
            return;
          }
          
          const parentDiv = item.querySelector('.recent-activity-item-parent');
          const linkDiv = item.querySelector('.recent-activity-item-link');
          
          if (parentDiv && linkDiv) {
            // Just swap them - no need to check specific names
            const tempHTML = parentDiv.innerHTML;
            parentDiv.innerHTML = linkDiv.innerHTML;
            linkDiv.innerHTML = tempHTML;
            
            hasSwapped[itemId] = true;
            swappedCount++;
          }
        });
        
        if (swappedCount > 0) {
          console.log('Swapped ' + swappedCount + ' items');
        }
        
        return true;
      }
      
      function maintainSwap() {
        swapRecentActivityOrder();
      }
      
      const observer = new MutationObserver(function(mutations) {
        maintainSwap();
      });
      
      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
      
      setInterval(maintainSwap, 500);
      setTimeout(maintainSwap, 1000);
      
      console.log('Persistent swap monitoring active');
    })();

  }); // This closes the main DOMContentLoaded event listener from line 863 

})(); // This closes the main IIFE - MAKE SURE THIS STAYS AT THE END

document.addEventListener('DOMContentLoaded', function() {
  // Target the featured posts section specifically
  const featuredSection = document.querySelector('.community-featured-posts');
  if (!featuredSection) return;
  
  const featuredList = featuredSection.querySelector('.promoted-articles');
  if (!featuredList) return;
  
  // Find the "Feature a post" item
  const items = featuredList.querySelectorAll('li');
  items.forEach(item => {
    const link = item.querySelector('a');
    if (link && link.textContent.trim() === 'Feature a post') {
      // Store the link href
      const href = link.href;
      
      // Remove the item from the list
      item.remove();
      
      // Create a new container for admin actions
      const adminActions = document.createElement('div');
      adminActions.className = 'community-admin-actions';
      adminActions.innerHTML = `<a href="${href}" class="feature-post-link">Feature a post</a>`;
      
      // Insert after the promoted articles list
      featuredList.insertAdjacentElement('afterend', adminActions);
    }
  });
  
  // Hide the entire section if the list is now empty (no actual featured posts)
  if (featuredList.children.length === 0) {
    // Option 1: Hide the entire section
    // featuredSection.style.display = 'none';
    
    // Option 2: Show a message (better UX for admins)
    const emptyMessage = document.createElement('p');
    emptyMessage.className = 'no-featured-posts';
    emptyMessage.textContent = 'No posts have been featured yet.';
    featuredList.replaceWith(emptyMessage);
  }
});

// Custom Recent Activity Implementation - Reusing existing CSS classes
// Recent Activity Order Swap - Persistent Version
(function() {
  console.log('Recent activity swap script initialized');
  
  let hasSwapped = {};  // Track which items we've already swapped
  
  // Function to swap the order
  function swapRecentActivityOrder() {
    const items = document.querySelectorAll('.recent-activity-item');
    
    if (items.length === 0) {
      return false;
    }
    
    let swappedCount = 0;
    
    items.forEach((item, index) => {
      // Create a unique identifier for this item
      const itemText = item.textContent.trim();
      const itemId = itemText.substring(0, 50); // Use first 50 chars as ID
      
      // Skip if we've already swapped this exact item
      if (hasSwapped[itemId]) {
        return;
      }
      
      const parentDiv = item.querySelector('.recent-activity-item-parent');
      const linkDiv = item.querySelector('.recent-activity-item-link');
      
      if (parentDiv && linkDiv) {
        // Check if it needs swapping (topic should not be first)
        const parentText = parentDiv.textContent.trim();
        
        // Only swap if the parent contains "Noticeboard", "General Discussion", etc. (topics)
        if (parentText === 'Noticeboard' || 
            parentText === 'General Discussion' || 
            parentText === 'Feature Requests' || 
            parentText === 'Feedback') {
          
          const tempHTML = parentDiv.innerHTML;
          parentDiv.innerHTML = linkDiv.innerHTML;
          linkDiv.innerHTML = tempHTML;
          
          hasSwapped[itemId] = true;
          swappedCount++;
          console.log('Swapped item: ' + itemId.substring(0, 30) + '...');
        }
      }
    });
    
    if (swappedCount > 0) {
      console.log('Swapped ' + swappedCount + ' items');
    }
    
    return true;
  }
  
  // Run continuously to catch any re-renders
  function maintainSwap() {
    swapRecentActivityOrder();
  }
  
  // Watch for changes and reapply swap
  const observer = new MutationObserver(function(mutations) {
    maintainSwap();
  });
  
  // Start observing
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
  
  // Also run periodically to catch any missed updates
  setInterval(maintainSwap, 500); // Check every 500ms
  
  // Initial attempt
  setTimeout(maintainSwap, 1000);
  
  console.log('Persistent swap monitoring active');
})();
