// --- CONFIGURATION ---
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbw9hKdUwCPxXhY50eYnFPEClIhS5Sc3v-oz3PqvhGCZXFqQTdJBABHcSFg-O6OPvbmx/exec';

// --- TAB SWITCHING ---
function showTabFromHash() {
  const defaultTab = 'profile';
  const hash = window.location.hash.slice(1); // Get hash without the '#'

  // Determine which tab to show
  let tabToShow = defaultTab;
  if (hash && document.getElementById(hash)) {
    tabToShow = hash;
  }

  // Deactivate all sections
  document.querySelectorAll("main section").forEach(s => {
    s.classList.remove("active");
  });

  // Activate the determined section
  const activeSection = document.getElementById(tabToShow);
  if (activeSection) {
    activeSection.classList.add("active");
  }

  // Update the URL hash without creating a history entry
  if (window.location.hash !== `#${tabToShow}`) {
    window.location.hash = tabToShow;
  }

  // Load content for the blog tab if it's the active one
  if (tabToShow === 'blog') {
    loadBlogPosts();
    loadComments();
  }
}

// Event listeners for navigation links
const tabs = document.querySelectorAll("nav a");
tabs.forEach(tab => {
  tab.addEventListener("click", e => {
    e.preventDefault();
    const id = tab.dataset.tab;
    // Update the URL hash, which will trigger the hashchange event
    window.location.hash = id;
  });
});

// Event listener for when the URL hash changes
window.addEventListener('hashchange', showTabFromHash);

// --- DEBUG FUNCTIONS ---
function toggleDebug() {
  const debugSection = document.getElementById('debug-section');
  const debugToggle = document.querySelector('.debug-toggle');
  
  if (debugSection.style.display === 'none' || debugSection.style.display === '') {
    debugSection.style.display = 'block';
    debugToggle.textContent = 'Hide Debug Info';
  } else {
    debugSection.style.display = 'none';
    debugToggle.textContent = 'Show Debug Info';
  }
}

async function testConnection(action) {
  const testResult = document.getElementById('test-result');
  testResult.innerHTML = '<p>Testing connection...</p>';
  
  try {
    let response, data;
    
    if (action === 'addComment') {
      const payload = {
        action: 'addComment',
        name: 'Test User',
        message: 'This is a test comment from the debugger.'
      };
      
      response = await fetch(SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } else {
      response = await fetch(`${SCRIPT_URL}?action=${action}`);
    }
    
    const responseText = await response.text();
    
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      testResult.innerHTML = `
        <div class="response-container">
          <p><strong>Error parsing JSON response:</strong> ${e.message}</p>
          <p><strong>Raw response:</strong> ${responseText}</p>
        </div>
        <p>This usually means your Google Apps Script is not returning valid JSON.
        Check your script for errors.</p>
      `;
      return;
    }
    
    if (data.error) {
      testResult.innerHTML = `
        <div class="response-container">
          <p><strong>Error from Google Apps Script:</strong> ${data.error}</p>
          <p><strong>Full response:</strong> ${JSON.stringify(data, null, 2)}</p>
        </div>
        <p>Check your Google Apps Script code and make sure your Sheets are properly shared.</p>
      `;
    } else {
      testResult.innerHTML = `
        <div class="response-container">
          <p><strong>Success! Connection test passed.</strong></p>
          <p><strong>Action:</strong> ${action}</p>
          <p><strong>Response:</strong> ${JSON.stringify(data, null, 2)}</p>
        </div>
        <p>Your connection is working! If you're still having issues, 
        try refreshing the page or checking your browser's console for more details.</p>
      `;
    }
  } catch (error) {
    testResult.innerHTML = `
      <div class="response-container">
        <p><strong>Failed to fetch:</strong> ${error.message}</p>
      </div>
      <p>This means your browser cannot connect to your Google Apps Script.</p>
      <p>Common causes:</p>
      <ul>
        <li>Google Apps Script not deployed as Web App</li>
        <li>Incorrect deployment permissions (not set to "Anyone")</li>
        <li>Google Sheets not shared properly</li>
        <li>Incorrect SCRIPT_URL in your code</li>
      </ul>
    `;
  }
}

// --- BLOG FUNCTIONALITY ---
async function loadBlogPosts() {
  const container = document.getElementById('blog-content');
  container.innerHTML = '<p>Loading blog posts...</p>';

  try {
    const response = await fetch(`${SCRIPT_URL}?action=getBlogPosts`);
    const data = await response.json();

    if (data.error) throw new Error(data.error);
    if (data.posts.length === 0) {
      container.innerHTML = '<p>No blog posts yet. Check back soon!</p>';
      return;
    }

    let html = '';
    data.posts.forEach(post => {
      html += `
      <article style="margin-bottom: 3rem; border-bottom: 1px solid #eee; padding-bottom: 1.5rem;">
        <h3>${post.title}</h3>
        <p><small>Posted on: ${new Date(post.timestamp).toLocaleDateString()}</small></p>
        <div>${post.content.replace(/\n/g, '<br>')}</div>
      </article>
      `;
    });
    container.innerHTML = html;
  } catch (error) {
    console.error("Error loading blog:", error);
    container.innerHTML = `
      <p>Could not load blog posts. Error: ${error.message}</p>
      <p>Click the "Show Debug Info" button to troubleshoot connection issues.</p>
    `;
  }
}

// --- COMMENT FUNCTIONALITY ---
async function loadComments() {
  const container = document.getElementById('comments-container');
  container.innerHTML = '<p>Loading comments...</p>';

  try {
    const response = await fetch(`${SCRIPT_URL}?action=getComments`);
    const data = await response.json();

    if (data.error) throw new Error(data.error);

    if (data.data.length === 0) {
      container.innerHTML = '<p>No comments yet. Be the first to leave one!</p>';
      return;
    }

    let html = '<h4>What others are saying:</h4>';
    data.data.forEach(comment => {
      html += `
      <div style="background: #f9f9f9; padding: 1rem; margin: 1rem 0; border-radius: 5px;">
        <strong>${comment.name}</strong> <small>(${new Date(comment.timestamp).toLocaleDateString()})</small>
        <p>${comment.message}</p>
      </div>
      `;
    });
    container.innerHTML = html;
  } catch (error) {
    console.error("Error loading comments:", error);
    container.innerHTML = `
      <p>Could not load comments. Error: ${error.message}</p>
      <p>Click the "Show Debug Info" button to troubleshoot connection issues.</p>
    `;
  }
}

document.getElementById('comment-form').addEventListener('submit', async function(e) {
  e.preventDefault();

  const formData = new FormData(this);
  const submitButton = this.querySelector('button[type="submit"]');
  const originalButtonText = submitButton.textContent;

  const payload = {
    action: 'addComment',
    name: formData.get('reviewer-name'),
    message: formData.get('comment-text')
  };

  submitButton.textContent = 'Posting...';
  submitButton.disabled = true;

  try {
    const response = await fetch(SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const result = await response.json();

    if (result.error) throw new Error(result.error);

    alert('Thank you! Your comment has been submitted.');
    this.reset();
    loadComments();
  } catch (error) {
    console.error("Error submitting comment:", error);
    alert("Sorry, there was an error posting your comment. Please try again later.");
  } finally {
    submitButton.textContent = originalButtonText;
    submitButton.disabled = false;
  }
});

// --- RECOMMENDATIONS FUNCTIONALITY ---
document.getElementById('recommendation-form').addEventListener('submit', async function(e) {
  e.preventDefault();

  const formData = new FormData(this);
  const submitButton = this.querySelector('input[type="submit"]');
  const originalButtonText = submitButton.value;

  const payload = {
    action: 'addRecommendation',
    name: formData.get('name'),
    message: formData.get('message')
  };

  submitButton.value = 'Sending...';
  submitButton.disabled = true;

  try {
    const response = await fetch(SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const result = await response.json();

    if (result.error) throw new Error(result.error);

    alert('Thank you! Your recommendation has been submitted.');
    this.reset();
  } catch (error) {
    console.error("Error submitting recommendation:", error);
    alert("Sorry, there was an error submitting your recommendation. Please try again later.");
  } finally {
    submitButton.value = originalButtonText;
    submitButton.disabled = false;
  }
});

// --- INITIAL LOAD ---
// Call the function on initial page load
document.addEventListener('DOMContentLoaded', showTabFromHash);
