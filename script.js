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
  function detectBrand() {
    // Check for team-specific elements that would only exist in the team brand
    const teamElements = qs('.common-topics'); // This element only exists in team brand based on your template
    const playbooks = qs('a[href*="13449690492559"]'); // Playbooks category link
    
    if (teamElements || playbooks) {
      console.log("🏢 Detected: Team brand");
      return 'team';
    } else {
      console.log("🏥 Detected: Support brand");
      return 'support';
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
    13484939008143: `<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M30 26H29V9C29 8.73478 28.8946 8.48043 28.7071 8.29289C28.5196 8.10536 28.2652 8 28 8H23V5C23 4.73478 22.8946 4.48043 22.7071 4.29289C22.5196 4.10536 22.2652 4 22 4H10C9.73478 4 9.48043 4.10536 9.29289 4.29289C9.10536 4.48043 9 4.73478 9 5V12H4C3.73478 12 3.48043 12.1054 3.29289 12.2929C3.10536 12.4804 3 12.7348 3 13V26H2C1.73478 26 1.48043 26.1054 1.29289 26.2929C1.10536 26.4804 1 26.7348 1 27C1 27.2652 1.10536 27.5196 1.29289 27.7071C1.48043 27.8946 1.73478 28 2 28H30C30.2652 28 30.5196 27.8946 30.7071 27.7071C30.8946 27.5196 31 27.2652 31 27C31 26.7348 30.8946 26.4804 30.7071 26.2929C30.5196 26.1054 30.2652 26 30 26ZM5 14H10C10.2652 14 10.5196 13.8946 10.7071 13.7071C10.8946 13.5196 11 13.2652 11 13V6H21V9C21 9.26522 21.1054 9.51957 21.2929 9.70711C21.4804 9.89464 21.7348 10 22 10H27V26H19V21C19 20.7348 18.8946 20.4804 18.7071 20.2929C18.5196 20.1054 18.2652 20 18 20H14C13.7348 20 13.4804 20.1054 13.2929 20.2929C13.1054 20.4804 13 20.7348 13 21V26H5V14ZM17 26H15V22H17V26ZM14 9C14 8.73478 14.1054 8.48043 14.2929 8.29289C14.4804 8.10536 14.7348 8 15 8H17C17.2652 8 17.5196 8.10536 17.7071 8.29289C17.8946 8.48043 18 8.73478 18 9C18 9.26522 17.8946 9.51957 17.7071 9.70711C17.5196 9.89464 17.2652 10 17 10H15C14.7348 10 14.4804 9.89464 14.2929 9.70711C14.1054 9.51957 14 9.26522 14 9ZM14 13C14 12.7348 14.1054 12.4804 14.2929 12.2929C14.4804 12.1054 14.7348 12 15 12H17C17.2652 12 17.5196 12.1054 17.7071 12.2929C17.8946 12.4804 18 12.7348 18 13C18 13.2652 17.8946 13.5196 17.7071 13.7071C17.5196 13.8946 17.2652 14 17 14H15C14.7348 14 14.4804 13.8946 14.2929 13.7071C14.1054 13.5196 14 13.2652 14 13ZM21 13C21 12.7348 21.1054 12.4804 21.2929 12.2929C21.4804 12.1054 21.7348 12 22 12H24C24.2652 12 24.5196 12.1054 24.7071 12.2929C24.8946 12.4804 25 12.7348 25 13C25 13.2652 24.8946 13.5196 24.7071 13.7071C24.5196 13.8946 24.2652 14 24 14H22C21.7348 14 21.4804 13.8946 21.2929 13.7071C21.1054 13.5196 21 13.2652 21 13ZM11 17C11 17.2652 10.8946 17.5196 10.7071 17.7071C10.5196 17.8946 10.2652 18 10 18H8C7.73478 18 7.48043 17.8946 7.29289 17.7071C7.10536 17.5196 7 17.2652 7 17C7 16.7348 7.10536 16.4804 7.29289 16.2929C7.48043 16.1054 7.73478 16 8 16H10C10.2652 16 10.5196 16.1054 10.7071 16.2929C10.8946 16.4804 11 16.7348 11 17ZM11 21C11 21.2652 10.8946 21.5196 10.7071 21.7071C10.5196 21.8946 10.2652 22 10 22H8C7.73478 22 7.48043 21.8946 7.29289 21.7071C7.10536 21.5196 7 21.2652 7 21C7 20.7348 7.10536 20.4804 7.29289 20.2929C7.48043 20.1054 7.73478 20 8 20H10C10.2652 20 10.5196 20.1054 10.7071 20.2929C10.8946 20.4804 11 20.7348 11 21ZM14 17C14 16.7348 14.1054 16.4804 14.2929 16.2929C14.4804 16.1054 14.7348 16 15 16H17C17.2652 16 17.5196 16.1054 17.7071 16.2929C17.8946 16.4804 18 16.7348 18 17C18 17.2652 17.8946 17.5196 17.7071 17.7071C17.5196 17.8946 17.2652 18 17 18H15C14.7348 18 14.4804 17.8946 14.2929 17.7071C14.1054 17.5196 14 17.2652 14 17ZM21 17C21 16.7348 21.1054 16.4804 21.2929 16.2929C21.4804 16.1054 21.7348 16 22 16H24C24.2652 16 24.5196 16.1054 24.7071 16.2929C24.8946 16.4804 25 16.7348 25 17C25 17.2652 24.8946 17.5196 24.7071 17.7071C24.5196 17.8946 24.2652 18 24 18H22C21.7348 18 21.4804 17.8946 21.2929 17.7071C21.1054 17.5196 21 17.2652 21 17ZM21 21C21 20.7348 21.1054 20.4804 21.2929 20.2929C21.4804 20.1054 21.7348 20 22 20H24C24.2652 20 24.5196 20.1054 24.7071 20.2929C24.8946 20.4804 25 20.7348 25 21C25 21.2652 24.8946 21.5196 24.7071 21.7071C24.5196 21.8946 24.2652 22 24 22H22C21.7348 22 21.4804 21.8946 21.2929 21.7071C21.1054 21.5196 21 21.2652 21 21Z" fill="black"/>
</svg>`, // The Clinic
    13488463351055: `<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M29 24.8312V30C29 30.2652 28.8946 30.5196 28.7071 30.7071C28.5196 30.8946 28.2652 31 28 31C27.7348 31 27.4804 30.8946 27.2929 30.7071C27.1054 30.5196 27 30.2652 27 30V24.8312C26.9953 23.5477 26.7266 22.2788 26.2105 21.1036C25.6944 19.9284 24.9419 18.8719 24 18V25.2937C23.9998 25.509 23.9302 25.7184 23.8015 25.8908C23.6729 26.0633 23.492 26.1897 23.2857 26.2512C23.0795 26.3127 22.8589 26.306 22.6568 26.2322C22.4547 26.1583 22.2818 26.0212 22.1637 25.8412L20.8288 23.8025C20.8188 23.7875 20.8087 23.7712 20.8 23.755C20.6039 23.4087 20.2783 23.1545 19.8948 23.0483C19.5113 22.9421 19.1013 22.9927 18.755 23.1887C18.4087 23.3848 18.1545 23.7105 18.0483 24.094C17.9421 24.4775 17.9927 24.8875 18.1887 25.2337L20.955 29.4575C21.1002 29.6795 21.1513 29.95 21.097 30.2096C21.0428 30.4692 20.8876 30.6967 20.6656 30.8419C20.4437 30.9871 20.1731 31.0382 19.9135 30.9839C19.6539 30.9296 19.4265 30.7745 19.2812 30.5525L16.4988 26.3025L16.4688 26.255C16.038 25.5169 15.8923 24.6466 16.0589 23.8084C16.2256 22.9702 16.6932 22.222 17.3735 21.7047C18.0539 21.1875 18.8999 20.9371 19.7522 21.0007C20.6044 21.0643 21.404 21.4375 22 22.05V8H20C19.7348 8 19.4804 7.89464 19.2929 7.70711C19.1054 7.51957 19 7.26522 19 7C19 6.73478 19.1054 6.48043 19.2929 6.29289C19.4804 6.10536 19.7348 6 20 6H22C22.5304 6 23.0391 6.21071 23.4142 6.58579C23.7893 6.96086 24 7.46957 24 8V15.4525C25.5349 16.4897 26.7928 17.8865 27.6643 19.5211C28.5358 21.1558 28.9943 22.9788 29 24.8312ZM11 7C11 6.73478 10.8946 6.48043 10.7071 6.29289C10.5196 6.10536 10.2652 6 10 6H8C7.46957 6 6.96086 6.21071 6.58579 6.58579C6.21071 6.96086 6 7.46957 6 8V25C6 25.2652 6.10536 25.5196 6.29289 25.7071C6.48043 25.8946 6.73478 26 7 26C7.26522 26 7.51957 25.8946 7.70711 25.7071C7.89464 25.5196 8 25.2652 8 25V8H10C10.2652 8 10.5196 7.89464 10.7071 7.70711C10.8946 7.51957 11 7.26522 11 7ZM19.7075 12.2925C19.6146 12.1995 19.5043 12.1258 19.3829 12.0754C19.2615 12.0251 19.1314 11.9992 19 11.9992C18.8686 11.9992 18.7385 12.0251 18.6171 12.0754C18.4957 12.1258 18.3854 12.1995 18.2925 12.2925L16 14.5862V2C16 1.73478 15.8946 1.48043 15.7071 1.29289C15.5196 1.10536 15.2652 1 15 1C14.7348 1 14.4804 1.10536 14.2929 1.29289C14.1054 1.48043 14 1.73478 14 2V14.5862L11.7075 12.2925C11.5199 12.1049 11.2654 11.9994 11 11.9994C10.7346 11.9994 10.4801 12.1049 10.2925 12.2925C10.1049 12.4801 9.99944 12.7346 9.99944 13C9.99944 13.2654 10.1049 13.5199 10.2925 13.7075L14.2925 17.7075C14.3854 17.8005 14.4957 17.8742 14.6171 17.9246C14.7385 17.9749 14.8686 18.0008 15 18.0008C15.1314 18.0008 15.2615 17.9749 15.3829 17.9246C15.5043 17.8742 15.6146 17.8005 15.7075 17.7075L19.7075 13.7075C19.8005 13.6146 19.8742 13.5043 19.9246 13.3829C19.9749 13.2615 20.0008 13.1314 20.0008 13C20.0008 12.8686 19.9749 12.7385 19.9246 12.6171C19.8742 12.4957 19.8005 12.3854 19.7075 12.2925Z" fill="black"/>
</svg>`, // Referrals & Rebates
    13488434662159: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`, // Appointments
    // Add more mappings as needed
  };

  // Default icon for sections without specific mapping
  const DEFAULT_FAQ_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`;

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
      const menuButton = qs(".header .menu-button-mobile");
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
    
    // BRAND-SPECIFIC CONTENT LOADING
    (async function bootContent() {
      try {
        const brand = detectBrand();
        
        if (brand === 'team') {
          // TEAM BRAND: Load articles and top tags
          console.log("🚀 Loading content for Team brand...");
          
          // Load recent articles
          const articles = await fetchRecentlyUpdatedArticles(5);
          if (articles && articles.length > 0) {
            console.log("✅ Displaying recent articles:", articles.length);
            displayRecentArticles("recent-articles", articles);
          } else {
            const container = qs("#recent-articles");
            if (container) {
              container.innerHTML = "<p>No recently updated articles found.</p>";
            }
          }

          // Load top tags (for common topics)
          try {
            const topTags = await fetchTopContentTags(3);
            if (topTags && topTags.length > 0) {
              console.log("✅ Displaying top tags:", topTags.length);
              displayTopTagLinks("top-tags", topTags);
            }
          } catch (error) {
            console.log("⚠️ Top tags not available:", error);
          }
          
        } else {
          // SUPPORT BRAND: Load FAQ sections
          console.log("🚀 Loading content for Support brand...");
          
          // Your FAQ category ID
          const FAQ_CATEGORY_ID = 12279744997263;
          
          // Try to fetch FAQ sections directly from category
          const faqSections = await fetchFAQSectionsDirectly(FAQ_CATEGORY_ID);
          
          if (faqSections && faqSections.length > 0) {
            console.log("✅ Displaying FAQ sections:", faqSections.length);
            displayFAQSections("recent-articles", faqSections);
          } else {
            console.log("⚠️ No FAQ sections found, trying fallback method");
            // Fallback: fetch by filtering all sections
            const fallbackSections = await fetchFAQSectionsByID(FAQ_CATEGORY_ID);
            if (fallbackSections && fallbackSections.length > 0) {
              displayFAQSections("recent-articles", fallbackSections);
            } else {
              const container = qs("#recent-articles");
              if (container) {
                container.innerHTML = "<p>No FAQ sections found.</p>";
              }
            }
          }
        }
        
      } catch (error) {
        console.error("❌ Failed to load content:", error);
        const container = qs("#recent-articles");
        if (container) {
          container.innerHTML =
            "<p>Unable to load content. Please try again later.</p>";
        }
      }
    })();
  });
})();
