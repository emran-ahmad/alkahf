// renderer/dashboard.js - Simplified (order tracking removed)

document.addEventListener('DOMContentLoaded', () => {
    attachNavHandlers();
    loadDashboard();
    setupScrollFallback();
});

function attachNavHandlers() {
    const backHome = document.getElementById('backHome');
    if (backHome) backHome.addEventListener('click', e => { e.preventDefault(); window.api.navigate('home'); });
    const settingsBtn = document.getElementById('settingsBtn');
    if (settingsBtn) settingsBtn.addEventListener('click', e => { e.preventDefault(); window.api.navigate('settings'); });
}

async function loadDashboard() {
    const loadingEl = document.createElement('div');
    loadingEl.id = 'dashboardLoading';
    loadingEl.className = 'loading-overlay';
    loadingEl.innerHTML = '<div class="loading-content">Loading...</div>';
    document.body.appendChild(loadingEl);

    try {
        const [customers, popularDesigns] = await Promise.all([
            window.api.getCustomers(),
            window.api.dashboard.getPopularDesigns(8)
        ]);

        // Total customers
        const totalEl = document.getElementById('totalCustomers');
        if (totalEl) totalEl.textContent = customers.length || 0;

        // Popular designs list
        const ul = document.getElementById('popularDesigns');
        if (ul) {
            ul.innerHTML = '';
            if (popularDesigns && popularDesigns.length) {
                popularDesigns.forEach(d => {
                    const li = document.createElement('li');
                    li.textContent = `Design ${d.designNo} — ${d.count}`;
                    ul.appendChild(li);
                });
            } else {
                ul.innerHTML = '<li>No designs found.</li>';
            }
        }

        // Apply font size setting
        try {
            const fs = await window.api.getSetting('fontSize', '14');
            document.body.style.fontSize = fs + 'px';
        } catch (e) {/* ignore */}
    } catch (err) {
        console.error('Dashboard load error:', err);
        alert('Failed to load dashboard data.');
    } finally {
        const overlay = document.getElementById('dashboardLoading');
        if (overlay) overlay.remove();
    }
}

// Simple scroll fallback (keyboard only)
function setupScrollFallback(){
    const scrollTarget = document.querySelector('body.page-dashboard .main') || document.scrollingElement;
    const stepSmall = 80;
    const stepLarge = 400;

    function scrollBy(delta){
        if(!scrollTarget) return;
        scrollTarget.scrollBy({ top: delta, behavior:'smooth'});
    }

    document.addEventListener('keydown', (e) => {
        if(['ArrowDown','ArrowUp','PageDown','PageUp','Home','End'].includes(e.key)){
            e.preventDefault();
            switch(e.key){
                case 'ArrowDown': scrollBy(stepSmall); break;
                case 'ArrowUp': scrollBy(-stepSmall); break;
                case 'PageDown': scrollBy(stepLarge); break;
                case 'PageUp': scrollBy(-stepLarge); break;
                case 'Home': scrollTarget.scrollTo({ top:0, behavior:'smooth'}); break;
                case 'End': scrollTarget.scrollTo({ top: scrollTarget.scrollHeight, behavior:'smooth'}); break;
            }
        }
    }, { passive:false });
}
