document.addEventListener('DOMContentLoaded', () => {
  // Theme toggle
  const themeSwitch = document.getElementById('themeSwitch');
  const root = document.documentElement;
  
  // Load saved theme
  const savedTheme = localStorage.getItem('theme') || 'dark';
  root.setAttribute('data-theme', savedTheme);
  themeSwitch.checked = savedTheme === 'light';
  
  themeSwitch.addEventListener('change', () => {
    const theme = themeSwitch.checked ? 'light' : 'dark';
    root.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  });
  
  // DOM elements
  const generateBtn = document.getElementById('generateButton');
  const sampleBtn = document.getElementById('sampleButton');
  const previewBtn = document.getElementById('previewButton');
  const downloadBtn = document.getElementById('downloadButton');
  const tabs = document.querySelectorAll('.tab');
  const loadingSection = document.getElementById('loadingSection');
  const outputSection = document.getElementById('outputSection');
  const previewFrame = document.getElementById('previewFrame');
  
  let currentProject = {
    html: '',
    css: '',
    js: '',
    react: [],
    redux: [],
    projectId: ''
  };

  // Tab switching
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      // Update active tab
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      
      // Show corresponding code display
      const tabType = tab.getAttribute('data-tab');
      document.querySelectorAll('.code-display').forEach(display => {
        display.classList.remove('active');
      });
      document.getElementById(`${tabType}CodeContainer`).classList.add('active');
      
      // Special handling for React/Redux tabs
      if (tabType === 'react' && currentProject.react.length > 0) {
        document.getElementById('reactCode').textContent = 
          currentProject.react.map(c => `// ${c.name}\n${c.content}`).join('\n\n');
      }
      
      if (tabType === 'redux' && currentProject.redux.length > 0) {
        document.getElementById('reduxCode').textContent = 
          currentProject.redux.map(f => `// ${f.name}\n${f.content}`).join('\n\n');
      }
    });
  });

  // Show loading state
  function showLoading() {
    loadingSection.style.display = 'flex';
    outputSection.style.display = 'none';
  }

  // Hide loading state
  function hideLoading() {
    loadingSection.style.display = 'none';
  }

  // Display generated code
  function displayOutput(data) {
    currentProject = {
      html: data.htmlContent || '',
      css: data.cssContent || '',
      js: data.jsContent || '',
      react: data.reactComponents || [],
      redux: data.reduxFiles || [],
      projectId: data.projectId || ''
    };
    
    // Set code content
    document.getElementById('htmlCode').textContent = currentProject.html;
    document.getElementById('cssCode').textContent = currentProject.css;
    document.getElementById('jsCode').textContent = currentProject.js;
    
    // Show output section
    outputSection.style.display = 'block';
    hideLoading();
    
    // Update preview
    updatePreview();
  }
  
  // Update iframe preview
  function updatePreview() {
    const previewDoc = `
      <!DOCTYPE html>
      <html>
      <head>
        <base href="about:blank">
        <style>${currentProject.css}</style>
      </head>
      <body>
        ${currentProject.html}
        <script>${currentProject.js}</script>
      </body>
      </html>
    `;
    
    const iframe = document.getElementById('previewFrame');
    iframe.srcdoc = previewDoc;
  }
  
  // Full preview in new window
  previewBtn.addEventListener('click', () => {
    const previewWindow = window.open('', '_blank');
    previewWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Website Preview</title>
        <base href="about:blank">
        <style>${currentProject.css}</style>
      </head>
      <body>
        ${currentProject.html}
        <script>${currentProject.js}</script>
      </body>
      </html>
    `);
  });
  
  // Download project as ZIP
  downloadBtn.addEventListener('click', () => {
    alert('Download functionality would be implemented in production');
  });

  // Load sample prompt
  sampleBtn.addEventListener('click', () => {
    const samplePrompt = "Create a responsive e-commerce website with React and Redux. Include: " +
      "- Product listing grid with search/filter " +
      "- Shopping cart functionality " +
      "- User authentication (login/signup) " +
      "- Checkout process " +
      "- Responsive design with dark/light mode " +
      "- Use React Router for navigation";
      
    document.getElementById('userPrompt').value = samplePrompt;
  });

  // Generate website
  generateBtn.addEventListener('click', async () => {
    const prompt = document.getElementById('userPrompt').value.trim();
    if (!prompt) {
      alert('Please enter a website description');
      return;
    }

    showLoading();

    try {
      const response = await fetch('api/generate-website', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      });

      // Handle HTTP errors
      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
          if (errorData.details) errorMessage += `: ${errorData.details}`;
        } catch (e) {
          // Couldn't parse JSON error
        }
        throw new Error(errorMessage);
      }

      // Parse JSON response
      const data = await response.json();
      
      // Handle API errors
      if (data.error) {
        throw new Error(data.error + (data.details ? `: ${data.details}` : ''));
      }
      
      displayOutput(data);

    } catch (error) {
      console.error("Error:", error);
      alert(`Error: ${error.message}`);
      hideLoading();
    }
  });
});