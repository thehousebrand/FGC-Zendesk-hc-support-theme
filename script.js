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
  
function readingTime() {
  const text = document.getElementById("article-body").innerText
  const wpm = 225
  const words = text.trim().split(/\s+/).length
  const time = Math.ceil(words / wpm)
  document.getElementById("time").innerText = time
}
const articlebody = document.getElementById("article-body")
if (articlebody) {
  readingTime();
}

// Table of Contents

document.addEventListener("DOMContentLoaded", () => {
const tocContainer = document.querySelector('.toc-container');

// Exit if the tocContainer doesn't exist
if (!tocContainer) {
  return;
}

// Select only h2-h4 heading elements
const headings = document.querySelectorAll(".article-content h2, h3");

// Hide the tocContainer if no headings are found
if (headings.length === 0) {
  tocContainer.parentElement.style.display = 'none';
  return;
}

const tocList = document.createElement('ul');
let currentLevel = 2; // Start at h2 level
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
  
  // Set up the link with expand/collapse functionality
  link.href = `#${heading.id}`;
  link.textContent = heading.textContent;
  link.classList.add('toc-link');
  
  // Add expand/collapse indicator if item has children
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
    
    // Add click handlers for expand/collapse
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
  
    // Toggles expanded aria to collapsible elements
    const collapsible = document.querySelectorAll(
      ".collapsible-nav, .collapsible-sidebar"
    );

    collapsible.forEach((element) => {
      const toggle = element.querySelector(
        ".collapsible-nav-toggle, .collapsible-sidebar-toggle"
      );
    
      element.addEventListener("click", () => {
        toggleNavigation(toggle, element);
      });
    
      element.addEventListener("keyup", (event) => {
        console.log("escape");
        if (event.keyCode === ESCAPE) {
          closeNavigation(toggle, element);
        }
      });
    });
    
    // If multibrand search has more than 5 help centers or categories collapse the list
    const multibrandFilterLists = document.querySelectorAll(
      ".multibrand-filter-list"
    );
    multibrandFilterLists.forEach((filter) => {
      if (filter.children.length > 6) {
        // Display the show more button
        const trigger = filter.querySelector(".see-all-filters");
        trigger.setAttribute("aria-hidden", false);

              // Add event handler for click
              trigger.addEventListener("click", (event) => {
                event.stopPropagation();
                trigger.parentNode.removeChild(trigger);
                filter.classList.remove("multibrand-filter-list--collapsed");
              });
            }
          });
        });
        
        const isPrintableChar = (str) => {
          return str.length === 1 && str.match(/^\S$/);
        };
        
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
                menuItem.textContent.trim()[0].toLowerCase()
              );
            
              const startIndex =
                (this.menuItems.indexOf(currentItem) + 1) % this.menuItems.length;
            
              // look up starting from current index
              let index = itemChars.indexOf(char, startIndex);
            
              // if not found, start from start
              if (index === -1) {
                index = itemChars.indexOf(char, 0);
              }
            
              if (index > -1) {
                this.focusByIndex(index);
              }
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
                  case "Down": {
                    e.stopPropagation();
                    e.preventDefault();
              
                    this.open();
                    this.focusFirstMenuItem();
                    break;
                  }
                  case "ArrowUp":
                  case "Up": {
                    e.stopPropagation();
                    e.preventDefault();
              
                    this.open();
                    this.focusLastMenuItem();
                    break;
                  }
                  case "Esc":
                  case "Escape": {
                    e.stopPropagation();
                    e.preventDefault();
              
                    this.dismiss();
                    this.toggle.focus();
                    break;
                  }
                }
              },
  
  menuKeyHandler: function (e) {
    const key = e.key;
    const currentElement = this.menuItems[this.focusedIndex];
  
    if (e.ctrlKey || e.altKey || e.metaKey) {
      return;
    }
  
    switch (key) {
      case "Esc":
      case "Escape": {
        e.stopPropagation();
        e.preventDefault();
  
        this.dismiss();
        this.toggle.focus();
        break;
      }
      case "ArrowDown":
      case "Down": {
        e.stopPropagation();
        e.preventDefault();

                this.focusNextMenuItem(currentElement);
                break;
              }
              case "ArrowUp":
              case "Up": {
                e.stopPropagation();
                e.preventDefault();
                this.focusPreviousMenuItem(currentElement);
                break;
              }
              case "Home":
              case "PageUp": {
                e.stopPropagation();
                e.preventDefault();
                this.focusFirstMenuItem();
                break;
              }
              case "End":
              case "PageDown": {
                e.stopPropagation();
                e.preventDefault();
                this.focusLastMenuItem();
                break;
              }
              case "Tab": {
                if (e.shiftKey) {
                  e.stopPropagation();
                  e.preventDefault();
                  this.dismiss();
                  this.toggle.focus();
                } else {
                  this.dismiss();
                }
                break;
              }
              default: {
                if (isPrintableChar(key)) {
                  e.stopPropagation();
                  e.preventDefault();
                  this.focusByChar(currentElement, key);
                }
              }
            }
          },
        };

        // Drodowns
        
        window.addEventListener("DOMContentLoaded", () => {
          const dropdowns = [];
          const dropdownToggles = document.querySelectorAll(".dropdown-toggle");
        
          dropdownToggles.forEach((toggle) => {
            const menu = toggle.nextElementSibling;
            if (menu && menu.classList.contains("dropdown-menu")) {
              dropdowns.push(new Dropdown(toggle, menu));
            }
          });
        });

        // Share
        
        window.addEventListener("DOMContentLoaded", () => {
          const links = document.querySelectorAll(".share a");
          links.forEach((anchor) => {
            anchor.addEventListener("click", (event) => {
              event.preventDefault();
              window.open(anchor.href, "", "height = 500, width = 500");
            });
          });
        });

        // Vanilla JS debounce function, by Josh W. Comeau:
        // https://www.joshwcomeau.com/snippets/javascript/debounce/
        function debounce(callback, wait) {
          let timeoutId = null;
          return (...args) => {
            window.clearTimeout(timeoutId);
            timeoutId = window.setTimeout(() => {
              callback.apply(null, args);
            }, wait);
          };
        }
        
        // Define variables for search field
        let searchFormFilledClassName = "search-has-value";
        let searchFormSelector = "form[role='search']";
        
        // Clear the search input, and then return focus to it
        function clearSearchInput(event) {
          event.target
            .closest(searchFormSelector)
            .classList.remove(searchFormFilledClassName);

              let input;
              if (event.target.tagName === "INPUT") {
                input = event.target;
              } else if (event.target.tagName === "BUTTON") {
                input = event.target.previousElementSibling;
              } else {
                input = event.target.closest("button").previousElementSibling;
              }
              input.value = "";
              input.focus();
            }
            
            // Have the search input and clear button respond
            // when someone presses the escape key, per:
            // https://twitter.com/adambsilver/status/1152452833234554880
            function clearSearchInputOnKeypress(event) {
              const searchInputDeleteKeys = ["Delete", "Escape"];
              if (searchInputDeleteKeys.includes(event.key)) {
                clearSearchInput(event);
              }
            }

            // Create an HTML button that all users -- especially keyboard users --
            // can interact with, to clear the search input.
            // To learn more about this, see:
            // https://adrianroselli.com/2019/07/ignore-typesearch.html#Delete
            // https://www.scottohara.me/blog/2022/02/19/custom-clear-buttons.html
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

            // Append the clear button to the search form
            function appendClearSearchButton(input, form) {
              const searchClearButton = buildClearSearchButton(input.id);
              form.append(searchClearButton);
              if (input.value.length > 0) {
                form.classList.add(searchFormFilledClassName);
              }
            }
            
            // Add a class to the search form when the input has a value;
            // Remove that class from the search form when the input doesn't have a value.
            // Do this on a delay, rather than on every keystroke.
            const toggleClearSearchButtonAvailability = debounce((event) => {
              const form = event.target.closest(searchFormSelector);
              form.classList.toggle(
                searchFormFilledClassName,
                event.target.value.length > 0
              );
            }, 200);

            // Search
            
            window.addEventListener("DOMContentLoaded", () => {
              // Set up clear functionality for the search field
              const searchForms = [...document.querySelectorAll(searchFormSelector)];
              const searchInputs = searchForms.map((form) =>
                form.querySelector("input[type='search']")
              );
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
              // In some cases we should preserve focus after page reload
              returnFocus();
            
              // show form controls when the textarea receives focus or back button is used and value exists
              const commentContainerTextarea = document.querySelector(
                ".comment-container textarea"
              );
              const commentContainerFormControls = document.querySelector(
                ".comment-form-controls, .comment-ccs"
              );
  
  if (commentContainerTextarea) {
    commentContainerTextarea.addEventListener(
      "focus",
      function focusCommentContainerTextarea() {
        commentContainerFormControls.style.display = "block";
        commentContainerTextarea.removeEventListener(
          "focus",
          focusCommentContainerTextarea
        );
      }
    );
  
    if (commentContainerTextarea.value !== "") {
      commentContainerFormControls.style.display = "block";
    }
  }
  
  // Expand Request comment form when Add to conversation is clicked
  const showRequestCommentContainerTrigger = document.querySelector(
    ".request-container .comment-container .comment-show-container"
  );
  const requestCommentFields = document.querySelectorAll(
    ".request-container .comment-container .comment-fields"
  );
  const requestCommentSubmit = document.querySelector(
    ".request-container .comment-container .request-submit-comment"
  );
  
  if (showRequestCommentContainerTrigger) {
    showRequestCommentContainerTrigger.addEventListener("click", () => {
      showRequestCommentContainerTrigger.style.display = "none";
      Array.prototype.forEach.call(requestCommentFields, (element) => {
        element.style.display = "block";
      });
      requestCommentSubmit.style.display = "inline-block";
  
      if (commentContainerTextarea) {
        commentContainerTextarea.focus();
      }
    });
  }
  
  // Mark as solved button
  const requestMarkAsSolvedButton = document.querySelector(
    ".request-container .mark-as-solved:not([data-disabled])"
  );
  const requestMarkAsSolvedCheckbox = document.querySelector(
    ".request-container .comment-container input[type=checkbox]"
  );
  const requestCommentSubmitButton = document.querySelector(
    ".request-container .comment-container input[type=submit]"
  );
  
  if (requestMarkAsSolvedButton) {
    requestMarkAsSolvedButton.addEventListener("click", () => {
      requestMarkAsSolvedCheckbox.setAttribute("checked", true);
      requestCommentSubmitButton.disabled = true;
      requestMarkAsSolvedButton.setAttribute("data-disabled", true);
      requestMarkAsSolvedButton.form.submit();
    });
  }
  
  // Change Mark as solved text according to whether comment is filled
  const requestCommentTextarea = document.querySelector(
    ".request-container .comment-container textarea"
  );
  
  const usesWysiwyg =
    requestCommentTextarea &&
    requestCommentTextarea.dataset.helper === "wysiwyg";

    function isEmptyPlaintext(s) {
      return s.trim() === "";
    }
    
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
            requestMarkAsSolvedButton.innerText =
              requestMarkAsSolvedButton.getAttribute("data-solve-translation");
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

    const selects = document.querySelectorAll(
      "#request-status-select, #request-organization-select"
    );
    
    selects.forEach((element) => {
      element.addEventListener("change", (event) => {
        event.stopPropagation();
        saveFocus();
        element.form.submit();
      });
    });
    
    // Submit requests filter form on search in the request list page
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

      // Submit organization form in the request page
      const requestOrganisationSelect = document.querySelector(
        "#request-organization select"
      );
    
      if (requestOrganisationSelect) {
        requestOrganisationSelect.addEventListener("change", () => {
          requestOrganisationSelect.form.submit();
        });
    
        requestOrganisationSelect.addEventListener("click", (e) => {
          // Prevents Ticket details collapsible-sidebar to close on mobile
          e.stopPropagation();
        });
      }
    
      // If there are any error notifications below an input field, focus that field
      const notificationElm = document.querySelector(".notification-error");
      if (
        notificationElm &&
        notificationElm.previousElementSibling &&
        typeof notificationElm.previousElementSibling.focus === "function"
      ) {
        notificationElm.previousElementSibling.focus();
      }
    });

      // Function to fetch the current user's CSRF token
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
    
    // Function to fetch the current user's CSRF token
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

    // Function to fetch recently updated articles with CSRF token
    async function fetchRecentlyUpdatedArticles(limit = 5) {
      try {
        // First get the CSRF token
        const csrfToken = await fetchCSRFToken();
        
        if (!csrfToken) {
          throw new Error("Could not retrieve CSRF token. User may not be logged in.");
        }
        
        // Construct the Zendesk API URL for articles sorted by updated_at
        const apiUrl = `/api/v2/help_center/articles.json?sort_by=created_at&sort_order=desc&per_page=${limit}`;
        
        // Make the API request with the CSRF token
        const response = await fetch(apiUrl, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRF-Token': csrfToken
          }
        });

            // Check if the request was successful
            if (!response.ok) {
              throw new Error(`HTTP error! Status: ${response.status}`);
            }
        
            // Parse the JSON response
            const data = await response.json();
            
            // Return the articles array
            return data.articles;
          } catch (error) {
            console.error('Error fetching recent articles:', error);
            return [];
          }
        }

        // Function to fetch all content tags from the content_tags endpoint
        async function fetchAllContentTags() {
          try {
            // Get the CSRF token
            const csrfToken = await getCSRFTokenWithCache();
        
            if (!csrfToken) {
              throw new Error("Could not retrieve CSRF token. User may not be logged in.");
            }
        
            // Fetch content tags from the API
            const apiUrl = `/api/v2/guide/content_tags?page[size]=30`;
        
            const response = await fetch(apiUrl, {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
                'X-CSRF-Token': csrfToken
              }
            });
        
            if (!response.ok) {
              throw new Error(`HTTP error! Status: ${response.status}`);
            }
        
            const data = await response.json();
            return data.records;
          } catch (error) {
            console.error('Error fetching content tags:', error);
            return [];
          }
        }
// Function to fetch all articles to count content tags
        async function fetchArticlesForTagCount(perPage = 100) {
          try {
            // Get the CSRF token
            const csrfToken = await getCSRFTokenWithCache();
            
            if (!csrfToken) {
              throw new Error("Could not retrieve CSRF token. User may not be logged in.");
            }
            
            // Fetch articles from the API
            const apiUrl = `/api/v2/help_center/articles.json?per_page=${perPage}`;
            
            const response = await fetch(apiUrl, {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
                'X-CSRF-Token': csrfToken
              }
            });
        
            if (!response.ok) {
              throw new Error(`HTTP error! Status: ${response.status}`);
            }
        
            const data = await response.json();
            return data.articles;
          } catch (error) {
            console.error('Error fetching articles for tag count:', error);
            return [];
          }
        }

        // Function to fetch top content tags by counting their occurrences in articles
        async function fetchTopContentTags(limit = 3) {
          try {
            // 1. Fetch all content tags first to have the complete set with IDs and names
            const allTags = await fetchAllContentTags();
            if (!allTags || allTags.length === 0) {
              return [];
            }
            
            // Create a map for quick lookup of tag details by ID
            const tagMap = {};
            allTags.forEach(tag => {
              tagMap[tag.id] = tag;
            });
            
            // 2. Fetch articles to analyze their content tags
            const articles = await fetchArticlesForTagCount(100); // Get up to 100 articles
            if (!articles || articles.length === 0) {
              return [];
            }
    
                // 3. Count occurrences of each content tag
                const tagCounts = {};
                
                articles.forEach(article => {
                  if (article.content_tag_ids && article.content_tag_ids.length > 0) {
                    article.content_tag_ids.forEach(tagId => {
                      if (tagCounts[tagId]) {
                        tagCounts[tagId]++;
                      } else {
                        tagCounts[tagId] = 1;
                      }
                    });
                  }
                });
                
                // 4. Create an array of tag objects with counts
                const tagArray = Object.keys(tagCounts).map(tagId => {
                  return {
                    id: tagId,
                    name: tagMap[tagId] ? tagMap[tagId].name : 'Unknown Tag',
                    count: tagCounts[tagId]
                  };
                });
                
                // 5. Sort by count in descending order
                tagArray.sort((a, b) => b.count - a.count);
                
                // 6. Return the top tags limited by the limit parameter
                return tagArray.slice(0, limit);
              } catch (error) {
                console.error('Error fetching top content tags:', error);
                return [];
              }
            }

            // Function to display articles in the DOM using the specified template
            function displayRecentArticles(containerId, articles) {
              const container = document.getElementById(containerId);
              
              // Check if container exists
              if (!container) {
                console.error(`Container with ID "${containerId}" not found.`);
                return;
              }
              
              // Clear existing content
              container.innerHTML = '';
              
              // Add each article using the specified template structure
              articles.forEach(article => {
                // Create article snippet (first ~120 characters of body)
                let snippet = '';
                if (article.body) {
                  // Strip HTML tags and get first 150 chars
                  const tempDiv = document.createElement('div');
                  tempDiv.innerHTML = article.body;
                  const textContent = tempDiv.textContent || tempDiv.innerText || '';
                  snippet = textContent.substring(0, 117) + (textContent.length > 117 ? '...' : '');
                }
    
                    // Create the article HTML using the specified template structure
                    const articleHTML = `
                      <article class="article-item">
                        <div class="article-inner">
                          <h3 class="article-title"><a href="${article.html_url}">${article.title}</a></h3>
                          <p class="article-description">
                            ${snippet}
                          </p>
                        </div>
                      </article>
                    `;
                    
                    // Add the article to the container
                    container.innerHTML += articleHTML;
                  });
                }
                
                // Function to display top content tag links
                function displayTopTagLinks(containerId, tags) {
                  const container = document.getElementById(containerId);
                  
                  if (!container) {
                    console.error(`Container with ID "${containerId}" not found.`);
                    return;
                  }
  
                    // Clear existing content
                    container.innerHTML = '';
                    
                    // Add each tag as a simple link
                    tags.forEach(tag => {
                      // Create the link element with the specified format
                      const link = document.createElement('a');
                      link.href = `/hc/en-au/search?content_tags=${tag.id}`;
                      link.textContent = tag.name;
                      link.className = 'popular-tag-link';
                      
                      // Add the link to the container
                      container.appendChild(link);
                      
                      // Add a space between links
                      container.appendChild(document.createTextNode(' '));
                    });
                  }
                  
                  // Function to cache the CSRF token in local storage
                  function cacheCSRFToken(token) {
                    localStorage.setItem('zd_csrf_token', token);
                    localStorage.setItem('zd_csrf_token_timestamp', Date.now());
                  }

                  // Function to retrieve cached CSRF token if it's still valid
                  function getCachedCSRFToken() {
                    const token = localStorage.getItem('zd_csrf_token');
                    const timestamp = localStorage.getItem('zd_csrf_token_timestamp');
                    
                    // Token is valid for the user session, but we refresh it every 2 minutes
                    // to be safe (as recommended in the documentation)
                    if (token && timestamp && (Date.now() - timestamp < 120000)) {
                      return token;
                    }
                    
                    return null;
                  }
                  
                  // Enhanced function to get CSRF token with caching
                  async function getCSRFTokenWithCache() {
                    // Try to get from cache first
                    const cachedToken = getCachedCSRFToken();
                    if (cachedToken) {
                      return cachedToken;
                    }
  
                      // If not in cache or expired, fetch a new one
                      const token = await fetchCSRFToken();
                      if (token) {
                        cacheCSRFToken(token);
                      }
                      return token;
                    }
                    
                    // Usage: Call this function when your page loads
                    document.addEventListener('DOMContentLoaded', async () => {
                      try {
                        // Fetch recently updated articles with CSRF token
                        const articles = await fetchRecentlyUpdatedArticles(5);
                        
                        if (articles && articles.length > 0) {
                          // Display the articles in container with ID 'recent-articles'
                          displayRecentArticles('recent-articles', articles);
                        } else {
                          // Handle case where no articles were found
                          const container = document.getElementById('recent-articles');
                          if (container) {
                            container.innerHTML = '<p>No recently updated articles found.</p>';
                          }
                        }
    
                            // Fetch and display top 3 content tags
                            const topTags = await fetchTopContentTags(3);
                            if (topTags && topTags.length > 0) {
                              displayTopTagLinks('top-tags', topTags);
                            }
                            
                          } catch (error) {
                            console.error('Failed to load content:', error);
                            
                            // Display error messages in respective containers
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