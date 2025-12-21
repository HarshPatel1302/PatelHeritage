const BASE_URL = 'http://localhost:5000';

const MOCK_RESIDENTS = [
    { name: 'Dinesh Choudhary', flat: 'F1302' },
    { name: 'Rajesh Gupta', flat: 'A301' },
    { name: 'Priya Sharma', flat: 'B502' },
    { name: 'Amit Patel', flat: 'C1001' },
    { name: 'Sneha Reddy', flat: 'D703' },
    { name: 'Vikram Singh', flat: 'E1201' }
];

document.addEventListener('DOMContentLoaded', () => {
    const statusIndicator = document.getElementById('status-indicator');
    const serverStatus = document.getElementById('server-status');
    const searchInput = document.getElementById('resident-search');
    const resultsContainer = document.getElementById('search-results');

    // Check server health
    async function checkHealth() {
        try {
            const response = await fetch(BASE_URL, { mode: 'no-cors' });
            statusIndicator.className = 'status-online';
            serverStatus.textContent = 'Server Online: Port 5000';
        } catch (error) {
            statusIndicator.className = 'status-offline';
            serverStatus.textContent = 'Server Offline: Check Terminal';
        }
    }

    checkHealth();

    // Button Listeners
    document.getElementById('btn-home').onclick = () => window.open(`${BASE_URL}/resident-home`);
    document.getElementById('btn-dashboard').onclick = () => window.open(`${BASE_URL}/dashboard`);
    document.getElementById('btn-security').onclick = () => window.open(`${BASE_URL}/security`);
    document.getElementById('btn-messages').onclick = () => window.open(`${BASE_URL}/messages`);

    // Search Logic
    searchInput.oninput = (e) => {
        const query = e.target.value.toLowerCase();
        resultsContainer.innerHTML = '';

        if (!query) return;

        const filtered = MOCK_RESIDENTS.filter(r =>
            r.name.toLowerCase().includes(query) ||
            r.flat.toLowerCase().includes(query)
        );

        filtered.forEach(res => {
            const div = document.createElement('div');
            div.className = 'result-item';
            div.innerHTML = `
        <span class="name">${res.name}</span>
        <span class="flat">${res.flat}</span>
      `;
            div.onclick = () => {
                // Copy flat number to clipboard
                navigator.clipboard.writeText(res.flat);
                searchInput.value = res.flat;
                resultsContainer.innerHTML = '<p style="font-size: 0.7rem; color: #ca8a04; text-align: center;">Flat number copied!</p>';
                setTimeout(() => resultsContainer.innerHTML = '', 1500);
            };
            resultsContainer.appendChild(div);
        });
    };
});
