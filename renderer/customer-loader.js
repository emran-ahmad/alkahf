export let allCustomers = []; // global store for all customers

export async function loadCustomers() {
  try {
    const customers = await window.api.getCustomers();

    allCustomers = customers
      .filter(c => c && c.uniqueID && !isNaN(Number(c.uniqueID)) && c.name && c.phone)
      .sort((a, b) => Number(b.uniqueID) - Number(a.uniqueID)); // newest first

    renderCustomerList(allCustomers);
  } catch (err) {
    
  }
}

export function renderCustomerList(customers) {
  const list = document.getElementById("customerList");
  list.innerHTML = "";

  if (customers.length === 0) {
    list.innerHTML = "<p>No customers found.</p>";
    return;
  }

  customers.forEach(c => {
    const div = document.createElement("div");
    div.classList.add("customer-item");
    div.dataset.id = c.uniqueID;

    const badge = document.createElement("span");
    badge.classList.add("customer-badge");
    badge.textContent = `${c.uniqueID}`;

    const info = document.createElement("div");
    info.classList.add("customer-info");

    const name = document.createElement("div");
    name.classList.add("customer-name");
    name.textContent = c.name;

    const phone = document.createElement("div");
    phone.classList.add("customer-phone");
    phone.textContent = c.phone;

    info.appendChild(name);
    info.appendChild(phone);

    div.appendChild(badge);
    div.appendChild(info);

    div.addEventListener("click", () => {
      window.location.href = `./screens/customer-details.html?id=${c.uniqueID}`;
    });

    list.appendChild(div);
  });
}
