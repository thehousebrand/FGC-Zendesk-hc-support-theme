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
    13484939008143: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M30 26H29V9C29 8.73478 28.8946 8.48043 28.7071 8.29289C28.5196 8.10536 28.2652 8 28 8H23V5C23 4.73478 22.8946 4.48043 22.7071 4.29289C22.5196 4.10536 22.2652 4 22 4H10C9.73478 4 9.48043 4.10536 9.29289 4.29289C9.10536 4.48043 9 4.73478 9 5V12H4C3.73478 12 3.48043 12.1054 3.29289 12.2929C3.10536 12.4804 3 12.7348 3 13V26H2C1.73478 26 1.48043 26.1054 1.29289 26.2929C1.10536 26.4804 1 26.7348 1 27C1 27.2652 1.10536 27.5196 1.29289 27.7071C1.48043 27.8946 1.73478 28 2 28H30C30.2652 28 30.5196 27.8946 30.7071 27.7071C30.8946 27.5196 31 27.2652 31 27C31 26.7348 30.8946 26.4804 30.7071 26.2929C30.5196 26.1054 30.2652 26 30 26ZM5 14H10C10.2652 14 10.5196 13.8946 10.7071 13.7071C10.8946 13.5196 11 13.2652 11 13V6H21V9C21 9.26522 21.1054 9.51957 21.2929 9.70711C21.4804 9.89464 21.7348 10 22 10H27V26H19V21C19 20.7348 18.8946 20.4804 18.7071 20.2929C18.5196 20.1054 18.2652 20 18 20H14C13.7348 20 13.4804 20.1054 13.2929 20.2929C13.1054 20.4804 13 20.7348 13 21V26H5V14ZM17 26H15V22H17V26ZM14 9C14 8.73478 14.1054 8.48043 14.2929 8.29289C14.4804 8.10536 14.7348 8 15 8H17C17.2652 8 17.5196 8.10536 17.7071 8.29289C17.8946 8.48043 18 8.73478 18 9C18 9.26522 17.8946 9.51957 17.7071 9.70711C17.5196 9.89464 17.2652 10 17 10H15C14.7348 10 14.4804 9.89464 14.2929 9.70711C14.1054 9.51957 14 9.26522 14 9ZM14 13C14 12.7348 14.1054 12.4804 14.2929 12.2929C14.4804 12.1054 14.7348 12 15 12H17C17.2652 12 17.5196 12.1054 17.7071 12.2929C17.8946 12.4804 18 12.7348 18 13C18 13.2652 17.8946 13.5196 17.7071 13.7071C17.5196 13.8946 17.2652 14 17 14H15C14.7348 14 14.4804 13.8946 14.2929 13.7071C14.1054 13.5196 14 13.2652 14 13ZM21 13C21 12.7348 21.1054 12.4804 21.2929 12.2929C21.4804 12.1054 21.7348 12 22 12H24C24.2652 12 24.5196 12.1054 24.7071 12.2929C24.8946 12.4804 25 12.7348 25 13C25 13.2652 24.8946 13.5196 24.7071 13.7071C24.5196 13.8946 24.2652 14 24 14H22C21.7348 14 21.4804 13.8946 21.2929 13.7071C21.1054 13.5196 21 13.2652 21 13ZM11 17C11 17.2652 10.8946 17.5196 10.7071 17.7071C10.5196 17.8946 10.2652 18 10 18H8C7.73478 18 7.48043 17.8946 7.29289 17.7071C7.10536 17.5196 7 17.2652 7 17C7 16.7348 7.10536 16.4804 7.29289 16.2929C7.48043 16.1054 7.73478 16 8 16H10C10.2652 16 10.5196 16.1054 10.7071 16.2929C10.8946 16.4804 11 16.7348 11 17ZM11 21C11 21.2652 10.8946 21.5196 10.7071 21.7071C10.5196 21.8946 10.2652 22 10 22H8C7.73478 22 7.48043 21.8946 7.29289 21.7071C7.10536 21.5196 7 21.2652 7 21C7 20.7348 7.10536 20.4804 7.29289 20.2929C7.48043 20.1054 7.73478 20 8 20H10C10.2652 20 10.5196 20.1054 10.7071 20.2929C10.8946 20.4804 11 20.7348 11 21ZM14 17C14 16.7348 14.1054 16.4804 14.2929 16.2929C14.4804 16.1054 14.7348 16 15 16H17C17.2652 16 17.5196 16.1054 17.7071 16.2929C17.8946 16.4804 18 16.7348 18 17C18 17.2652 17.8946 17.5196 17.7071 17.7071C17.5196 17.8946 17.2652 18 17 18H15C14.7348 18 14.4804 17.8946 14.2929 17.7071C14.1054 17.5196 14 17.2652 14 17ZM21 17C21 16.7348 21.1054 16.4804 21.2929 16.2929C21.4804 16.1054 21.7348 16 22 16H24C24.2652 16 24.5196 16.1054 24.7071 16.2929C24.8946 16.4804 25 16.7348 25 17C25 17.2652 24.8946 17.5196 24.7071 17.7071C24.5196 17.8946 24.2652 18 24 18H22C21.7348 18 21.4804 17.8946 21.2929 17.7071C21.1054 17.5196 21 17.2652 21 17ZM21 21C21 20.7348 21.1054 20.4804 21.2929 20.2929C21.4804 20.1054 21.7348 20 22 20H24C24.2652 20 24.5196 20.1054 24.7071 20.2929C24.8946 20.4804 25 20.7348 25 21C25 21.2652 24.8946 21.5196 24.7071 21.7071C24.5196 21.8946 24.2652 22 24 22H22C21.7348 22 21.4804 21.8946 21.2929 21.7071C21.1054 21.5196 21 21.2652 21 21Z" fill="black"/>
</svg>`, // The Clinic
    13488463351055: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M29 24.8312V30C29 30.2652 28.8946 30.5196 28.7071 30.7071C28.5196 30.8946 28.2652 31 28 31C27.7348 31 27.4804 30.8946 27.2929 30.7071C27.1054 30.5196 27 30.2652 27 30V24.8312C26.9953 23.5477 26.7266 22.2788 26.2105 21.1036C25.6944 19.9284 24.9419 18.8719 24 18V25.2937C23.9998 25.509 23.9302 25.7184 23.8015 25.8908C23.6729 26.0633 23.492 26.1897 23.2857 26.2512C23.0795 26.3127 22.8589 26.306 22.6568 26.2322C22.4547 26.1583 22.2818 26.0212 22.1637 25.8412L20.8288 23.8025C20.8188 23.7875 20.8087 23.7712 20.8 23.755C20.6039 23.4087 20.2783 23.1545 19.8948 23.0483C19.5113 22.9421 19.1013 22.9927 18.755 23.1887C18.4087 23.3848 18.1545 23.7105 18.0483 24.094C17.9421 24.4775 17.9927 24.8875 18.1887 25.2337L20.955 29.4575C21.1002 29.6795 21.1513 29.95 21.097 30.2096C21.0428 30.4692 20.8876 30.6967 20.6656 30.8419C20.4437 30.9871 20.1731 31.0382 19.9135 30.9839C19.6539 30.9296 19.4265 30.7745 19.2812 30.5525L16.4988 26.3025L16.4688 26.255C16.038 25.5169 15.8923 24.6466 16.0589 23.8084C16.2256 22.9702 16.6932 22.222 17.3735 21.7047C18.0539 21.1875 18.8999 20.9371 19.7522 21.0007C20.6044 21.0643 21.404 21.4375 22 22.05V8H20C19.7348 8 19.4804 7.89464 19.2929 7.70711C19.1054 7.51957 19 7.26522 19 7C19 6.73478 19.1054 6.48043 19.2929 6.29289C19.4804 6.10536 19.7348 6 20 6H22C22.5304 6 23.0391 6.21071 23.4142 6.58579C23.7893 6.96086 24 7.46957 24 8V15.4525C25.5349 16.4897 26.7928 17.8865 27.6643 19.5211C28.5358 21.1558 28.9943 22.9788 29 24.8312ZM11 7C11 6.73478 10.8946 6.48043 10.7071 6.29289C10.5196 6.10536 10.2652 6 10 6H8C7.46957 6 6.96086 6.21071 6.58579 6.58579C6.21071 6.96086 6 7.46957 6 8V25C6 25.2652 6.10536 25.5196 6.29289 25.7071C6.48043 25.8946 6.73478 26 7 26C7.26522 26 7.51957 25.8946 7.70711 25.7071C7.89464 25.5196 8 25.2652 8 25V8H10C10.2652 8 10.5196 7.89464 10.7071 7.70711C10.8946 7.51957 11 7.26522 11 7ZM19.7075 12.2925C19.6146 12.1995 19.5043 12.1258 19.3829 12.0754C19.2615 12.0251 19.1314 11.9992 19 11.9992C18.8686 11.9992 18.7385 12.0251 18.6171 12.0754C18.4957 12.1258 18.3854 12.1995 18.2925 12.2925L16 14.5862V2C16 1.73478 15.8946 1.48043 15.7071 1.29289C15.5196 1.10536 15.2652 1 15 1C14.7348 1 14.4804 1.10536 14.2929 1.29289C14.1054 1.48043 14 1.73478 14 2V14.5862L11.7075 12.2925C11.5199 12.1049 11.2654 11.9994 11 11.9994C10.7346 11.9994 10.4801 12.1049 10.2925 12.2925C10.1049 12.4801 9.99944 12.7346 9.99944 13C9.99944 13.2654 10.1049 13.5199 10.2925 13.7075L14.2925 17.7075C14.3854 17.8005 14.4957 17.8742 14.6171 17.9246C14.7385 17.9749 14.8686 18.0008 15 18.0008C15.1314 18.0008 15.2615 17.9749 15.3829 17.9246C15.5043 17.8742 15.6146 17.8005 15.7075 17.7075L19.7075 13.7075C19.8005 13.6146 19.8742 13.5043 19.9246 13.3829C19.9749 13.2615 20.0008 13.1314 20.0008 13C20.0008 12.8686 19.9749 12.7385 19.9246 12.6171C19.8742 12.4957 19.8005 12.3854 19.7075 12.2925Z" fill="black"/>
</svg>`, // Referrals and Rebates
    13488434662159: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M19.5 3.5H17.25V2.75C17.25 2.55109 17.171 2.36032 17.0303 2.21967C16.8897 2.07902 16.6989 2 16.5 2C16.3011 2 16.1103 2.07902 15.9697 2.21967C15.829 2.36032 15.75 2.55109 15.75 2.75V3.5H8.25V2.75C8.25 2.55109 8.17098 2.36032 8.03033 2.21967C7.88968 2.07902 7.69891 2 7.5 2C7.30109 2 7.11032 2.07902 6.96967 2.21967C6.82902 2.36032 6.75 2.55109 6.75 2.75V3.5H4.5C4.10218 3.5 3.72064 3.65804 3.43934 3.93934C3.15804 4.22064 3 4.60218 3 5V20C3 20.3978 3.15804 20.7794 3.43934 21.0607C3.72064 21.342 4.10218 21.5 4.5 21.5H19.5C19.8978 21.5 20.2794 21.342 20.5607 21.0607C20.842 20.7794 21 20.3978 21 20V5C21 4.60218 20.842 4.22064 20.5607 3.93934C20.2794 3.65804 19.8978 3.5 19.5 3.5ZM6.75 5V5.75C6.75 5.94891 6.82902 6.13968 6.96967 6.28033C7.11032 6.42098 7.30109 6.5 7.5 6.5C7.69891 6.5 7.88968 6.42098 8.03033 6.28033C8.17098 6.13968 8.25 5.94891 8.25 5.75V5H15.75V5.75C15.75 5.94891 15.829 6.13968 15.9697 6.28033C16.1103 6.42098 16.3011 6.5 16.5 6.5C16.6989 6.5 16.8897 6.42098 17.0303 6.28033C17.171 6.13968 17.25 5.94891 17.25 5.75V5H19.5V8H4.5V5H6.75ZM19.5 20H4.5V9.5H19.5V20ZM15.9056 11.9694C15.9754 12.039 16.0307 12.1217 16.0684 12.2128C16.1062 12.3038 16.1256 12.4014 16.1256 12.5C16.1256 12.5986 16.1062 12.6962 16.0684 12.7872C16.0307 12.8783 15.9754 12.961 15.9056 13.0306L11.4056 17.5306C11.336 17.6004 11.2533 17.6557 11.1622 17.6934C11.0712 17.7312 10.9736 17.7506 10.875 17.7506C10.7764 17.7506 10.6788 17.7312 10.5878 17.6934C10.4967 17.6557 10.414 17.6004 10.3444 17.5306L8.09437 15.2806C7.95364 15.1399 7.87458 14.949 7.87458 14.75C7.87458 14.551 7.95364 14.3601 8.09437 14.2194C8.23511 14.0786 8.42598 13.9996 8.625 13.9996C8.82402 13.9996 9.01489 14.0786 9.15563 14.2194L10.875 15.9397L14.8444 11.9694C14.914 11.8996 14.9967 11.8443 15.0878 11.8066C15.1788 11.7688 15.2764 11.7494 15.375 11.7494C15.4736 11.7494 15.5712 11.7688 15.6622 11.8066C15.7533 11.8443 15.836 11.8996 15.9056 11.9694Z" fill="black"/>
</svg>`, // Appointments
    13488399682319: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M26 6H6C5.20435 6 4.44129 6.31607 3.87868 6.87868C3.31607 7.44129 3 8.20435 3 9V23C3 23.7956 3.31607 24.5587 3.87868 25.1213C4.44129 25.6839 5.20435 26 6 26H26C26.7956 26 27.5587 25.6839 28.1213 25.1213C28.6839 24.5587 29 23.7956 29 23V9C29 8.20435 28.6839 7.44129 28.1213 6.87868C27.5587 6.31607 26.7956 6 26 6ZM5 12H27V14H20C19.7348 14 19.4804 14.1054 19.2929 14.2929C19.1054 14.4804 19 14.7348 19 15C19 15.7956 18.6839 16.5587 18.1213 17.1213C17.5587 17.6839 16.7956 18 16 18C15.2044 18 14.4413 17.6839 13.8787 17.1213C13.3161 16.5587 13 15.7956 13 15C13 14.7348 12.8946 14.4804 12.7071 14.2929C12.5196 14.1054 12.2652 14 12 14H5V12ZM6 8H26C26.2652 8 26.5196 8.10536 26.7071 8.29289C26.8946 8.48043 27 8.73478 27 9V10H5V9C5 8.73478 5.10536 8.48043 5.29289 8.29289C5.48043 8.10536 5.73478 8 6 8ZM26 24H6C5.73478 24 5.48043 23.8946 5.29289 23.7071C5.10536 23.5196 5 23.2652 5 23V16H11.1C11.3295 17.1303 11.9427 18.1465 12.8357 18.8764C13.7288 19.6063 14.8466 20.005 16 20.005C17.1534 20.005 18.2712 19.6063 19.1643 18.8764C20.0573 18.1465 20.6705 17.1303 20.9 16H27V23C27 23.2652 26.8946 23.5196 26.7071 23.7071C26.5196 23.8946 26.2652 24 26 24Z" fill="black"/>
</svg>`, // Fees and payments
    12279761651215: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M12.75 7.25V11.2859L16.1644 9.57875C16.3423 9.48974 16.5483 9.47504 16.737 9.5379C16.9257 9.60075 17.0818 9.73601 17.1708 9.91391C17.2598 10.0918 17.2745 10.2978 17.2116 10.4865C17.1488 10.6753 17.0135 10.8313 16.8356 10.9203L12.3356 13.1703C12.2213 13.2275 12.0943 13.2546 11.9666 13.2489C11.8389 13.2432 11.7147 13.2049 11.606 13.1378C11.4972 13.0706 11.4074 12.9768 11.3451 12.8651C11.2828 12.7535 11.2501 12.6278 11.25 12.5V7.25C11.25 7.05109 11.329 6.86033 11.4697 6.71967C11.6103 6.57902 11.8011 6.5 12 6.5C12.1989 6.5 12.3897 6.57902 12.5303 6.71967C12.671 6.86033 12.75 7.05109 12.75 7.25ZM12 20.75C10.3683 20.75 8.77326 20.2661 7.41655 19.3596C6.05984 18.4531 5.00242 17.1646 4.378 15.6571C3.75358 14.1497 3.5902 12.4909 3.90853 10.8905C4.22685 9.29017 5.01259 7.82016 6.16637 6.66637C7.32016 5.51259 8.79017 4.72685 10.3905 4.40853C11.9909 4.0902 13.6497 4.25358 15.1571 4.878C16.6646 5.50242 17.9531 6.55984 18.8596 7.91655C19.7661 9.27326 20.25 10.8683 20.25 12.5C20.25 12.6989 20.329 12.8897 20.4697 13.0303C20.6103 13.171 20.8011 13.25 21 13.25C21.1989 13.25 21.3897 13.171 21.5303 13.0303C21.671 12.8897 21.75 12.6989 21.75 12.5C21.75 10.5716 21.1782 8.68657 20.1068 7.08319C19.0355 5.47982 17.5127 4.23013 15.7312 3.49218C13.9496 2.75422 11.9892 2.56114 10.0979 2.93735C8.20656 3.31355 6.46928 4.24215 5.10571 5.60571C3.74215 6.96928 2.81355 8.70656 2.43735 10.5979C2.06114 12.4892 2.25422 14.4496 2.99218 16.2312C3.73013 18.0127 4.97982 19.5355 6.58319 20.6068C8.18657 21.6782 10.0716 22.25 12 22.25C12.1989 22.25 12.3897 22.171 12.5303 22.0303C12.671 21.8897 12.75 21.6989 12.75 21.5C12.75 21.3011 12.671 21.1103 12.5303 20.9697C12.3897 20.829 12.1989 20.75 12 20.75ZM21.7247 21.3069C21.7522 21.4027 21.7603 21.5031 21.7485 21.6021C21.7367 21.7011 21.7053 21.7968 21.6561 21.8836C21.607 21.9703 21.541 22.0464 21.462 22.1073C21.3831 22.1682 21.2928 22.2128 21.1964 22.2384C21.1001 22.264 20.9996 22.2702 20.9008 22.2565C20.802 22.2428 20.707 22.2096 20.6212 22.1587C20.5354 22.1078 20.4607 22.0404 20.4013 21.9603C20.3419 21.8802 20.2991 21.789 20.2753 21.6922C20.01 20.6956 19.0744 20 18 20C16.9256 20 15.99 20.6956 15.7247 21.6922C15.6823 21.8521 15.5883 21.9934 15.4572 22.0943C15.3261 22.1952 15.1654 22.2499 15 22.25C14.9348 22.2498 14.8699 22.2413 14.8069 22.2247C14.6147 22.1735 14.4507 22.048 14.351 21.8759C14.2513 21.7037 14.2241 21.4991 14.2753 21.3069C14.5186 20.4036 15.0907 19.6238 15.8794 19.1206C15.4595 18.7012 15.1734 18.1667 15.0574 17.5846C14.9414 17.0026 15.0006 16.3992 15.2276 15.8509C15.4545 15.3025 15.8391 14.8338 16.3325 14.504C16.8259 14.1742 17.4061 13.9981 17.9995 13.9981C18.593 13.9981 19.1732 14.1742 19.6666 14.504C20.16 14.8338 20.5445 15.3025 20.7715 15.8509C20.9985 16.3992 21.0577 17.0026 20.9417 17.5846C20.8256 18.1667 20.5396 18.7012 20.1197 19.1206C20.9087 19.6236 21.4812 20.4034 21.7247 21.3069ZM16.5 17C16.5 17.2967 16.588 17.5867 16.7528 17.8334C16.9176 18.08 17.1519 18.2723 17.426 18.3858C17.7001 18.4994 18.0017 18.5291 18.2926 18.4712C18.5836 18.4133 18.8509 18.2704 19.0607 18.0607C19.2704 17.8509 19.4133 17.5836 19.4712 17.2926C19.5291 17.0017 19.4994 16.7001 19.3858 16.426C19.2723 16.1519 19.08 15.9176 18.8334 15.7528C18.5867 15.588 18.2967 15.5 18 15.5C17.6022 15.5 17.2206 15.658 16.9393 15.9393C16.658 16.2206 16.5 16.6022 16.5 17Z" fill="black"/>
</svg>`, // Sessions
    13488480062351: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M15.75 14.75C15.75 14.9489 15.671 15.1397 15.5303 15.2803C15.3897 15.421 15.1989 15.5 15 15.5H9C8.80109 15.5 8.61032 15.421 8.46967 15.2803C8.32902 15.1397 8.25 14.9489 8.25 14.75C8.25 14.5511 8.32902 14.3603 8.46967 14.2197C8.61032 14.079 8.80109 14 9 14H15C15.1989 14 15.3897 14.079 15.5303 14.2197C15.671 14.3603 15.75 14.5511 15.75 14.75ZM15 11H9C8.80109 11 8.61032 11.079 8.46967 11.2197C8.32902 11.3603 8.25 11.5511 8.25 11.75C8.25 11.9489 8.32902 12.1397 8.46967 12.2803C8.61032 12.421 8.80109 12.5 9 12.5H15C15.1989 12.5 15.3897 12.421 15.5303 12.2803C15.671 12.1397 15.75 11.9489 15.75 11.75C15.75 11.5511 15.671 11.3603 15.5303 11.2197C15.3897 11.079 15.1989 11 15 11ZM20.25 4.99999V20.75C20.25 21.1478 20.092 21.5293 19.8107 21.8106C19.5294 22.092 19.1478 22.25 18.75 22.25H5.25C4.85218 22.25 4.47064 22.092 4.18934 21.8106C3.90804 21.5293 3.75 21.1478 3.75 20.75V4.99999C3.75 4.60216 3.90804 4.22063 4.18934 3.93933C4.47064 3.65802 4.85218 3.49999 5.25 3.49999H8.64937C9.07079 3.02817 9.58709 2.65066 10.1645 2.3922C10.7419 2.13373 11.3674 2.00012 12 2.00012C12.6326 2.00012 13.2581 2.13373 13.8355 2.3922C14.4129 2.65066 14.9292 3.02817 15.3506 3.49999H18.75C19.1478 3.49999 19.5294 3.65802 19.8107 3.93933C20.092 4.22063 20.25 4.60216 20.25 4.99999ZM9 6.49999H15C15 5.70434 14.6839 4.94128 14.1213 4.37867C13.5587 3.81606 12.7956 3.49999 12 3.49999C11.2044 3.49999 10.4413 3.81606 9.87868 4.37867C9.31607 4.94128 9 5.70434 9 6.49999ZM18.75 4.99999H16.2422C16.4128 5.48169 16.5 5.98896 16.5 6.49999V7.24999C16.5 7.4489 16.421 7.63966 16.2803 7.78032C16.1397 7.92097 15.9489 7.99999 15.75 7.99999H8.25C8.05109 7.99999 7.86032 7.92097 7.71967 7.78032C7.57902 7.63966 7.5 7.4489 7.5 7.24999V6.49999C7.50002 5.98896 7.58721 5.48169 7.75781 4.99999H5.25V20.75H18.75V4.99999Z" fill="black"/>
</svg>`, // Assessments
    // Add more mappings as needed
  };

  // Default icon for sections without specific mapping
  const DEFAULT_FAQ_ICON = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M13.5 18.5C13.5 18.6989 13.421 18.8897 13.2803 19.0303C13.1397 19.171 12.9489 19.25 12.75 19.25H11.25C11.0511 19.25 10.8603 19.171 10.7197 19.0303C10.579 18.8897 10.5 18.6989 10.5 18.5C10.5 18.3011 10.579 18.1103 10.7197 17.9697C10.8603 17.829 11.0511 17.75 11.25 17.75H12.75C12.9489 17.75 13.1397 17.829 13.2803 17.9697C13.421 18.1103 13.5 18.3011 13.5 18.5ZM11.25 7.25H12.75C12.9489 7.25 13.1397 7.17098 13.2803 7.03033C13.421 6.88968 13.5 6.69891 13.5 6.5C13.5 6.30109 13.421 6.11032 13.2803 5.96967C13.1397 5.82902 12.9489 5.75 12.75 5.75H11.25C11.0511 5.75 10.8603 5.82902 10.7197 5.96967C10.579 6.11032 10.5 6.30109 10.5 6.5C10.5 6.69891 10.579 6.88968 10.7197 7.03033C10.8603 7.17098 11.0511 7.25 11.25 7.25ZM12.75 11.75H11.25C11.0511 11.75 10.8603 11.829 10.7197 11.9697C10.579 12.1103 10.5 12.3011 10.5 12.5C10.5 12.6989 10.579 12.8897 10.7197 13.0303C10.8603 13.171 11.0511 13.25 11.25 13.25H12.75C12.9489 13.25 13.1397 13.171 13.2803 13.0303C13.421 12.8897 13.5 12.6989 13.5 12.5C13.5 12.3011 13.421 12.1103 13.2803 11.9697C13.1397 11.829 12.9489 11.75 12.75 11.75ZM20.25 4.25V20.75C20.25 21.1478 20.092 21.5294 19.8107 21.8107C19.5294 22.092 19.1478 22.25 18.75 22.25H5.25C4.85218 22.25 4.47064 22.092 4.18934 21.8107C3.90804 21.5294 3.75 21.1478 3.75 20.75V4.25C3.75 3.85218 3.90804 3.47064 4.18934 3.18934C4.47064 2.90804 4.85218 2.75 5.25 2.75H18.75C19.1478 2.75 19.5294 2.90804 19.8107 3.18934C20.092 3.47064 20.25 3.85218 20.25 4.25ZM5.25 14.75H18.75V10.25H5.25V14.75ZM5.25 4.25V8.75H18.75V4.25H5.25ZM18.75 20.75V16.25H5.25V20.75H18.75Z" fill="black"/>
</svg>`;

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
