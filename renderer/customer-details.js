function getQueryParam(key) {
  return new URLSearchParams(window.location.search).get(key);
}

function setValue(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value || "-";
}

async function loadCustomer() {
  try {
    const id = getQueryParam("id");
    let customer = null;
    
    if (id === 'preview' || typeof window.api === 'undefined') {
      if (id === 'preview' && typeof window.api !== 'undefined' && typeof window.api.getCustomers === 'function') {
        try {
          const customers = await window.api.getCustomers();
          if (customers && customers.length > 0) {
            const sorted = customers.slice().sort((a,b) => {
              const ai = parseInt(a.uniqueID) || 0;
              const bi = parseInt(b.uniqueID) || 0;
              return bi - ai;
            });
            customer = sorted[0];
          }
        } catch (e) {
          customer = null;
        }
      }

      if (!customer) {
        customer = {
          uniqueID: 'preview',
          name: '',
          phone: '',
          address: '',
          notes: '',
          lambai: '',
          bazo: '',
          shoulder: '',
          shoulderDown: '',
          kalarSize: '',
          chati: '',
          mora: '',
          kamar: '',
          gira: '',
          girashalwar: '',
          shalwar: '',
          pancha: '',
          kanda: '',
          designNo: '',
          karigarName: '',
          samne: '',
          samneSize: '',
          dblSide: '',
          kalar_Ban: '',
          kaf: '',
          plat: '',
          btnDesign: '',
          pati: '',
          daman: '',
          pakat: '',
          chamakPatiBtn: '',
          salai: ''
        };
      }
    } else {
      if (typeof window.api !== 'undefined' && typeof window.api.getCustomers === 'function') {
        const customers = await window.api.getCustomers();
        customer = customers.find((c) => String(c.uniqueID) === id);
      } else {
        customer = null;
      }
    }

    if (!customer) {
      document.body.innerHTML = "<p>Customer not found.</p>";
      return;
    }

    // Basic Info
    document.getElementById("customerName").textContent = customer.name || "Unknown";
    setValue("customerID", customer.uniqueID);
    setValue("customerPhone", customer.phone);
    setValue("customerAddress", customer.address);
    setValue("customerNotes", customer.notes);
    
    // Measurements
    setValue("lambai", customer.lambai);
    setValue("bazo", customer.bazo);
    setValue("shoulder", customer.shoulder);
    setValue("sdValue", customer.shoulderDown);
    setValue("kalarSize", customer.kalarSize);
    setValue("chati", customer.chati);
    setValue("gira", customer.gira);
    setValue("kamar", customer.kamar);
    setValue("girashalwar", customer.girashalwar);
    setValue("shalwar", customer.shalwar);
    setValue("pancha", customer.pancha);
    setValue("mora", customer.mora);
    setValue("kanda", customer.kanda);

    // Design & Style
    setValue("designNo", customer.designNo);
    setValue("karigarName", customer.karigarName);
    
    // Qameez Style Options
    setValue("kalar_Ban", customer.kalar_Ban);
    setValue("plat", customer.plat);
    setValue("kaf", customer.kaf);
    setValue("daman", customer.daman);
    
    // Pockets
    const samneElement = document.getElementById("samne");
    const samneValue = customer.samne || "-";
    const samneSizeValue = (customer.samneSize && customer.samneSize.trim() !== "") ? customer.samneSize : "-";
    samneElement.innerHTML = `<span class="size-text">(سائز: ${samneSizeValue})</span> ${samneValue}`;
    
    setValue("dblSide", customer.dblSide);
    setValue("pakat", customer.pakat);
    
    // Patti - split into length and width
    if (customer.pati) {
      const patiParts = customer.pati.split('،');
      setValue("patiLength", patiParts[0]?.trim() || "-");
      setValue("patiWidth", patiParts[1]?.trim() || "-");
    } else {
      setValue("patiLength", "-");
      setValue("patiWidth", "-");
    }
    
    // Other Options
    setValue("btnDesign", customer.btnDesign);
    setValue("chamakPatiBtn", customer.chamakPatiBtn);
    setValue("salai", customer.salai);
    
    try {
      if (typeof window._lastPrintSettings !== 'undefined' && typeof window.applyPrintPageSize === 'function') {
        const s = window._lastPrintSettings;
        setTimeout(() => {
          try { window.applyPrintPageSize(s.printPageSize, s.widthOffset, s.heightOffset, s.usePrintPageSize, s.printFontSize); } catch (e) {}
        }, 40);
      }
    } catch (e) {}
  } catch (err) {
    console.error("Failed to load customer:", err);
    document.body.innerHTML = "<p>Error loading customer details.</p>";
  }
}

document.getElementById("backBtn").addEventListener("click", () => {
  window.location.href = "../main.html";
});

loadCustomer();

try {
  window.loadCustomer = loadCustomer;
} catch (e) {}

window.addEventListener('message', (ev) => {
  try {
    const msg = ev.data || {};
    if (!msg || typeof msg !== 'object') return;
    
    if (msg.type === 'load-last-customer' || msg.type === 'refresh-preview') {
      try { loadCustomer(); } catch (e) {}
    }

    if (msg.type === 'preview-customer' && msg.customer) {
      try {
        const provided = msg.customer;
        
        function renderProvided(cust) {
          document.getElementById("customerName").textContent = cust.name || "-";
          setValue("customerID", cust.uniqueID || "-");
          setValue("customerPhone", cust.phone);
          setValue("customerAddress", cust.address);
          setValue("customerNotes", cust.notes);

          setValue("lambai", cust.lambai);
          setValue("bazo", cust.bazo);
          setValue("shoulder", cust.shoulder);
          setValue("sdValue", cust.shoulderDown);
          setValue("kalarSize", cust.kalarSize);
          setValue("chati", cust.chati);
          setValue("gira", cust.gira);
          setValue("kamar", cust.kamar);
          setValue("girashalwar", cust.girashalwar);
          setValue("shalwar", cust.shalwar);
          setValue("pancha", cust.pancha);
          setValue("mora", cust.mora);
          setValue("kanda", cust.kanda);

          setValue("designNo", cust.designNo);
          setValue("karigarName", cust.karigarName);
          
          // Qameez Style Options
          setValue("kalar_Ban", cust.kalar_Ban);
          setValue("plat", cust.plat);
          setValue("kaf", cust.kaf);
          setValue("daman", cust.daman);
          
          // Pockets
          const samneElement = document.getElementById("samne");
          const samneValue = cust.samne || "-";
          const samneSizeValue = (cust.samneSize && cust.samneSize.trim() !== "") ? cust.samneSize : "-";
          samneElement.innerHTML = `${samneValue} <span class="size-text">(سائز: ${samneSizeValue})</span>`;

          setValue("dblSide", cust.dblSide);
          setValue("pakat", cust.pakat);
          
          // Patti - split into length and width
          if (cust.pati) {
            const patiParts = cust.pati.split('،');
            setValue("patiLength", patiParts[0]?.trim() || "-");
            setValue("patiWidth", patiParts[1]?.trim() || "-");
          } else {
            setValue("patiLength", "-");
            setValue("patiWidth", "-");
          }
          
          // Other Options
          setValue("btnDesign", cust.btnDesign);
          setValue("chamakPatiBtn", cust.chamakPatiBtn);
          setValue("salai", cust.salai);
        }
        
        renderProvided(provided);
        
        try {
          if (typeof window._lastPrintSettings !== 'undefined' && typeof window.applyPrintPageSize === 'function') {
            const s = window._lastPrintSettings;
            setTimeout(() => { try { window.applyPrintPageSize(s.printPageSize, s.widthOffset, s.heightOffset, s.usePrintPageSize, s.printFontSize); } catch (e) {} }, 20);
          } else if (typeof window.applyPrintPageSize === 'function') {
            try {
              const pt = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--print-font-size') || '14', 10) || 14;
              setTimeout(() => { try { window.applyPrintPageSize('a4', 0, 0, true, pt); } catch (e) {} }, 20);
            } catch (e) {}
          }
        } catch (e) {}
      } catch (e) {}
    }
  } catch (e) {}
});