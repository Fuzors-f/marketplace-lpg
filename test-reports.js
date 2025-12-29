// Quick test script for reports API

const baseURL = 'http://localhost:5000/api/reports';

// Test simple endpoint
fetch(`${baseURL}/test-simple`)
  .then(res => res.json())
  .then(data => {
    console.log('Test Simple Result:', data);
  })
  .catch(err => {
    console.error('Test Simple Error:', err);
  });

// Test with auth (you need to replace TOKEN with actual token)
const testWithAuth = (token) => {
  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };

  // Test best sellers
  fetch(`${baseURL}/best-sellers?limit=5`, { headers })
    .then(res => res.json())
    .then(data => {
      console.log('Best Sellers Result:', data);
    })
    .catch(err => {
      console.error('Best Sellers Error:', err);
    });

  // Test sales report
  fetch(`${baseURL}/sales?period=week`, { headers })
    .then(res => res.json())
    .then(data => {
      console.log('Sales Report Result:', data);
    })
    .catch(err => {
      console.error('Sales Report Error:', err);
    });
};

console.log('Testing Reports API...');
console.log('Replace TOKEN in script and call testWithAuth(TOKEN) to test authenticated endpoints');