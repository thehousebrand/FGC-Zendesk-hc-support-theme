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

  // Data fetchers (unchanged behavior)
  async function fetchRecentlyUpdatedArticles(limit = 5) {
    try {
      const csrfToken = await getCSRFTokenWithCache();
      if (!csrfToken) {
        throw new Error(
          "Could not retrieve CSRF token. User may not be logged in."
        );
      }
      const apiUrl = `/api/v2/help_center/articles.json?sort_by=created_at&sort_order=desc&per_page=${limit}`;
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
      console.error("Error fetching recent articles:", error);
      return [];
    }
  }

  // Data fetchers (unchanged behavior)
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

  // Renderers (more efficient DOM updates)
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

    // Content: articles + top tags
    (async function bootContent() {
      try {
        const articles = await fetchRecentlyUpdatedArticles(5);
        if (articles && articles.length > 0) {
          displayRecentArticles("recent-articles", articles);
        } else {
          const container = qs("#recent-articles");
          if (container)
            container.innerHTML = "<p>No recently updated articles found.</p>";
        }

        const topTags = await fetchTopContentTags(3);
        if (topTags && topTags.length > 0) {
          displayTopTagLinks("top-tags", topTags);
        }
      } catch (error) {
        console.error("Failed to load content:", error);
        const articlesContainer = qs("#recent-articles");
        if (articlesContainer) {
          articlesContainer.innerHTML =
            "<p>Unable to load recent articles. Please try again later.</p>";
        }
        const tagsContainer = qs("#top-tags");
        if (tagsContainer) {
          tagsContainer.innerHTML =
            "<p>Unable to load popular topics. Please try again later.</p>";
        }
      }
    })();
  });
})();
