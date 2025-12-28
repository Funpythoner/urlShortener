const form = document.getElementById('url-form');
const fullUrlInput = document.getElementById('fullurl');
const shortUrlElement = document.getElementById('shorturl');
const urlTableBody = document.getElementById('urlTableBody');

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const fullUrl = fullUrlInput.value;

  if (!isValidUrl(fullUrl)) {
    alert('Invalid URL. Please enter a URL starting with "https://"');
    return;
  }

  try {
    const response = await fetch('https://shortifyservice.onrender.com/shorten', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ longUrl: fullUrl })
    });

    if (!response.ok) {
      throw new Error('Failed to shorten URL');
    }

    const data = await response.json();
    const shortUrl = data.shortUrl;

    const BASE_URL = window.location.origin;
    const finalShortUrl = `${BASE_URL}/${shortUrl}`;

    shortUrlElement.innerHTML =
      `Short URL: <a href="${finalShortUrl}" target="_blank">${shortUrl}</a>`;

    const row = document.createElement('tr');

    const fullUrlCell = document.createElement('td');
    const shortUrlCell = document.createElement('td');

    fullUrlCell.appendChild(createLink(fullUrl));
    shortUrlCell.appendChild(createLink(shortUrl));

    row.appendChild(fullUrlCell);
    row.appendChild(shortUrlCell);

    urlTableBody.prepend(row);

    fullUrlInput.value = '';
  } catch (error) {
    console.error('Error:', error.message);
  }
});

function isValidUrl(url) {
  return /^https:\/\/.*/.test(url);
}

function createLink(url) {
  const link = document.createElement('a');
  link.href = url;
  link.textContent = url;
  link.target = '_blank';
  return link;
}

async function fetchDatabaseContents() {
  try {
    const response = await fetch('/urls');
    const urls = await response.json();

    urlTableBody.innerHTML = '';

    const BASE_URL = window.location.origin;

    urls.forEach((url) => {
      const row = document.createElement('tr');

      const fullUrlCell = document.createElement('td');
      const shortUrlCell = document.createElement('td');

      fullUrlCell.appendChild(createLink(url.fullurl));
      shortUrlCell.appendChild(
        createLink(`${url.shorturl}`)
      );

      row.appendChild(fullUrlCell);
      row.appendChild(shortUrlCell);

      urlTableBody.appendChild(row);
    });
  } catch (error) {
    console.error('Error fetching database contents:', error);
  }
}

window.addEventListener('load', fetchDatabaseContents);
