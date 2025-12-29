import React, { useState, useEffect } from 'react';

function UrlBlockList() {
  const [blockedUrls, setBlockedUrls] = useState([]);
  const [newUrl, setNewUrl] = useState('');

  // Load blocked URLs from storage on mount
  useEffect(() => {
    loadBlockedUrls();
  }, []);

  // Save blocked URLs to storage whenever they change
  useEffect(() => {
    saveBlockedUrls();
  }, [blockedUrls]);

  const loadBlockedUrls = () => {
    chrome.storage.local.get(['blockedUrls'], (result) => {
      if (result.blockedUrls) {
        setBlockedUrls(result.blockedUrls);
      }
    });
  };

  const saveBlockedUrls = () => {
    chrome.storage.local.set({ blockedUrls });
  };

  const addUrl = () => {
    if (newUrl.trim() === '') return;
    
    // Normalize URL - add https:// if no protocol specified
    let urlToAdd = newUrl.trim();
    if (!urlToAdd.startsWith('http://') && !urlToAdd.startsWith('https://')) {
      urlToAdd = 'https://' + urlToAdd;
    }
    
    // Check if URL already exists
    if (!blockedUrls.includes(urlToAdd)) {
      setBlockedUrls([...blockedUrls, urlToAdd]);
      setNewUrl('');
    }
  };

  const deleteUrl = (url) => {
    setBlockedUrls(blockedUrls.filter(u => u !== url));
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      addUrl();
    }
  };

  return (
    <div className="url-block-section">
      <h2>Blocked URLs</h2>
      <p className="section-description">
        When you try to visit a blocked URL, you'll be redirected here instead.
      </p>
      <div className="url-input-container">
        <input
          type="text"
          className="url-input"
          placeholder="Enter URL to block (e.g., facebook.com or https://twitter.com)"
          value={newUrl}
          onChange={(e) => setNewUrl(e.target.value)}
          onKeyPress={handleKeyPress}
        />
        <button className="add-button" onClick={addUrl}>
          Block URL
        </button>
      </div>
      <ul className="url-list">
        {blockedUrls.map((url, index) => (
          <li key={index} className="url-item">
            <span className="url-text">{url}</span>
            <button
              className="delete-button"
              onClick={() => deleteUrl(url)}
              title="Remove from blocked list"
            >
              ✕
            </button>
          </li>
        ))}
      </ul>
      {blockedUrls.length === 0 && (
        <p className="empty-message">No blocked URLs. Add one above to get started!</p>
      )}
    </div>
  );
}

export default UrlBlockList;

