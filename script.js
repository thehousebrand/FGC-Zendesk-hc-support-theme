  
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