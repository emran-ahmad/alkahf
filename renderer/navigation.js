// renderer/navigation.js

document.addEventListener('DOMContentLoaded', () => {
    // Add New Customer button
    const addCustomerBtn = document.querySelector('.btn-primary');
    
    if (addCustomerBtn) {
        addCustomerBtn.addEventListener('click', () => {
            // Add timestamp to URL to force fresh load every time
            const timestamp = new Date().getTime();
            window.location.href = `./screens/add-customer.html?t=${timestamp}`;
        });
    }
});