/**
 * Customer Form Management Module
 * Handles customer data validation, saving, and form operations
 * @module save-customer
 */

// Configuration - Required fields for customer creation
const REQUIRED_FIELDS = {
    customerName: 'Name',
    customerPhone: 'Phone Number', 
    customerAddress: 'Address'
};

// Show toast notification
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast ${type} show`;
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Clear error styling
function clearErrors() {
    document.querySelectorAll('.input-field, .measurement-input, .urdu-input, .info-input, .info-textarea').forEach(input => {
        input.classList.remove('error');
    });
    document.querySelectorAll('.error-message').forEach(error => {
        error.classList.remove('show');
    });
}

// Validate phone number format
function validatePhoneNumber(phone) {
    if (!phone) return { valid: false, message: 'Phone number is required' };
    return { valid: true };
}

// Validate measurement values (should be positive numbers if entered)
function validateMeasurements() {
    const measurementFields = [
        'lambai', 'bazo', 'shoulder', 'shoulderDown', 'kalarSize', 'chati',
        'mora', 'kamar', 'gira', 'shalwar', 'girashalwar', 'pancha', 'kanda',
        'kalarLength', 'kalarWidth', 'kafLength', 'kafWidth', 'patiLength', 'patiWidth'
    ];
    
    for (const fieldId of measurementFields) {
        const input = document.getElementById(fieldId);
        if (!input) continue;
        
        const value = input.value.trim();
        if (value && isNaN(value)) {
            return { 
                valid: false, 
                field: fieldId, 
                message: `${fieldId} must be a valid number` 
            };
        }
        
        // Check for unrealistic values
        const numValue = parseFloat(value);
        if (value && (numValue < 0 || numValue > 200)) {
            return { 
                valid: false, 
                field: fieldId, 
                message: `${fieldId} value seems unrealistic (0-200 inches expected)` 
            };
        }
    }
    
    return { valid: true };
}

// Validate required fields (only customer info, not measurements)
function validateForm() {
    clearErrors();
    let isValid = true;
    let errorMessages = [];
    
    // Check only the 3 required customer info fields
    Object.keys(REQUIRED_FIELDS).forEach(fieldId => {
        const input = document.getElementById(fieldId);
        const value = input.value.trim();
        
        if (!value) {
            input.classList.add('error');
            const errorElement = document.getElementById(fieldId.replace('customer', '').toLowerCase() + 'Error');
            if (errorElement) {
                errorElement.classList.add('show');
            }
            isValid = false;
            errorMessages.push(REQUIRED_FIELDS[fieldId] + ' is required');
        }
    });
    
    // Validate phone number
    const phoneInput = document.getElementById('customerPhone');
    if (phoneInput && phoneInput.value.trim()) {
        const phoneValidation = validatePhoneNumber(phoneInput.value.trim());
        if (!phoneValidation.valid) {
            phoneInput.classList.add('error');
            isValid = false;
            errorMessages.push(phoneValidation.message);
        }
    }
    
    // Show error message if validation failed
    if (!isValid && errorMessages.length > 0) {
        showToast(errorMessages[0], 'error');
    }
    
    return isValid;
}

// Get selected button value from a group - ONLY if user actually selected something
function getSelectedValue(groupId) {
    const group = document.getElementById(groupId);
    if (!group) return '';
    
    const selected = group.querySelector('.pair-button.selected, .inline-pair-button.selected');
    return selected ? selected.getAttribute('data-value') : '';
}

// Check if any button in a group is selected
function isGroupSelected(groupId) {
    const group = document.getElementById(groupId);
    if (!group) return false;
    
    return group.querySelector('.pair-button.selected, .inline-pair-button.selected') !== null;
}

// Collect all form data
function collectFormData(uniqueID) {
    // Get basic info
    const name = document.getElementById('customerName').value.trim();
    const phone = document.getElementById('customerPhone').value.trim();
    const address = document.getElementById('customerAddress').value.trim();
    
    // Get measurements - only save if user entered value
    const lambai = document.getElementById('lambai').value.trim();
    const bazo = document.getElementById('bazo').value.trim();
    const shoulder = document.getElementById('shoulder').value.trim();
    const shoulderDown = (document.getElementById('shoulderDown') ? document.getElementById('shoulderDown').value.trim() : '');
    const kalarSize = document.getElementById('kalarSize').value.trim();
    const chati = document.getElementById('chati').value.trim();
    const mora = document.getElementById('mora').value.trim();
    const kamar = document.getElementById('kamar').value.trim();
    const gira = document.getElementById('gira').value.trim();
    const shalwar = document.getElementById('shalwar').value.trim();
    const girashalwar = document.getElementById('girashalwar').value.trim();
    const pancha = document.getElementById('pancha').value.trim();
    
    // Get pocket info (جیب) - collect samneGroup selection and samne size
    const samne = getSelectedValue('samneGroup');
    const samneSize = (document.getElementById('samneSize') ? document.getElementById('samneSize').value.trim() : '');
    const dblSide = getSelectedValue('sideJeebGroup');
    const pakat = getSelectedValue('shalwarPakatGroup');
    
    // Get patti (پٹی) - only save if user entered value
    const patiLength = document.getElementById('patiLength').value.trim();
    const patiWidth = document.getElementById('patiWidth').value.trim();
    const pati = (patiLength || patiWidth) ? `${patiLength}،${patiWidth}` : '';
    
    // Get kanda (کندہ) - ONLY if user actually selected something
    const kanda = getSelectedValue('kandaGroup');
    
    // Get daman (دامن) - ONLY if user actually selected something
    const daman = getSelectedValue('damanGroup');
    
    // Get plat (پلیٹ) - ONLY if user actually selected something
    const plat = getSelectedValue('platGroup');
    
    // Get kalar (گلا) - ONLY if user entered or selected something
    const kalarType = getSelectedValue('kalarTypeGroup');
    const kalarStyle = getSelectedValue('kalarStyleGroup');
    const kalarLength = document.getElementById('kalarLength').value.trim();
    const kalarWidth = document.getElementById('kalarWidth').value.trim();
    
    let kalar_Ban = '';
    if (kalarType || kalarStyle || kalarLength || kalarWidth) {
        kalar_Ban = `${kalarType || ''}، ${kalarStyle || ''}، ${kalarLength || ''}، ${kalarWidth || ''}`;
        // Clean up extra commas and spaces
        kalar_Ban = kalar_Ban.replace(/،،+/g, '،').replace(/^،|،$/g, '').trim();
    }
    
    // Get kaf (کف) - ONLY if user entered or selected something
    const kafType = getSelectedValue('kafTypeGroup');
    const kafStyle = getSelectedValue('kafStyleGroup');
    const kafLength = document.getElementById('kafLength').value.trim();
    const kafWidth = document.getElementById('kafWidth').value.trim();
    
    let kaf = '';
    if (kafType || kafStyle || kafLength || kafWidth) {
        const kafPart = kafType ? `${kafType} کف` : '';
        const stylePart = kafStyle || '';
        const lengthPart = kafLength || '';
        const widthPart = kafWidth || '';
        
        kaf = [kafPart, stylePart, lengthPart, widthPart]
            .filter(part => part !== '')
            .join('، ');
    }
    
    // Get other options - only save if user entered value
    const btnDesign = document.getElementById('btnDesign').value.trim();
    const chamakPatiBtn = document.getElementById('chamakPatiBtn').value.trim();
    const salai = document.getElementById('salai').value.trim();
    const designNo = document.getElementById('designNo').value.trim();
    const karigarName = document.getElementById('karigarName').value.trim();
    // global 'size' input removed from the form; keep empty string for DB compatibility
    const size = '';
    
    // Get notes
    const notes = document.getElementById('notes').value.trim();
    
    // Return complete customer object - empty strings will be handled as "-" in display
    return {
        uniqueID: String(uniqueID),
        name,
        phone,
        address,
        lambai: lambai || '',
        bazo: bazo || '',
    shoulder: shoulder || '',
    shoulderDown: shoulderDown || '',
    kalarSize: kalarSize || '',
    samne: samne || '',
    samneSize: samneSize || '',
        chati: chati || '',
        mora: mora || '',
        kamar: kamar || '',
        gira: gira || '',
        shalwar: shalwar || '',
        girashalwar: girashalwar || '',
        pancha: pancha || '',
        daman: daman || '',
        kanda: kanda || '',
        plat: plat || '',
    dblSide: dblSide || '',
        pakat: pakat || '',
        pati: pati || '',
        kalar_Ban: kalar_Ban || '',
        kaf: kaf || '',
        btnDesign: btnDesign || '',
        chamakPatiBtn: chamakPatiBtn || '',
        salai: salai || '',
        designNo: designNo || '',
        karigarName: karigarName || '',
        size: size || '',
        notes: notes || ''
    };
}

// Check for duplicate customer
async function checkDuplicate(name, phone, uniqueID) {
    try {
        const customers = await window.api.getCustomers();
        
        // Check if exact match exists (same name + phone + different ID)
        const duplicate = customers.find(customer => 
            customer.name.toLowerCase().trim() === name.toLowerCase().trim() &&
            customer.phone.trim() === phone.trim() &&
            String(customer.uniqueID) !== String(uniqueID)
        );
        
        return duplicate;
    } catch (error) {
        console.error('Error checking duplicates:', error);
        return null;
    }
}

// Handle save button click
async function handleSave() {
    // If Save button is disabled (edge case) or validation fails, abort
    const saveBtnCheck = document.getElementById('saveBtn');
    if (saveBtnCheck && saveBtnCheck.disabled) return;

    // Validate form
    if (!validateForm()) {
        showToast('Please fill in all required fields', 'error');
        return;
    }
    
    // Disable save button
    const saveBtn = document.getElementById('saveBtn');
    saveBtn.disabled = true;
    saveBtn.textContent = 'Saving...';
    
    try {
    // Get next ID from DB to avoid race conditions
    const nextID = await window.api.getNextUniqueID();
        
        // Normalize phone: keep digits, plus and spaces trimmed
        const phoneInput = document.getElementById('customerPhone');
        if (phoneInput) {
            phoneInput.value = phoneInput.value.trim();
        }

        // Collect form data
        const customerData = collectFormData(nextID);
        
        // Check for duplicates
        const duplicate = await checkDuplicate(customerData.name, customerData.phone, nextID);
        
        if (duplicate) {
            showToast(`Customer with same name and phone already exists (ID: ${duplicate.uniqueID})`, 'error');
            saveBtn.disabled = false;
            saveBtn.textContent = 'Save Customer';
            return;
        }
        
        // Save to database
        const result = await window.api.saveCustomer(customerData);
        
        if (result.success) {
            showToast('Customer saved successfully!', 'success');
            
            // Redirect to customer details page after 1 second
            setTimeout(() => {
                window.location.href = `customer-details.html?id=${nextID}`;
            }, 1000);
        } else {
            throw new Error(result.error || 'Failed to save customer');
        }
        
    } catch (error) {
        console.error('Save error:', error);
        showToast('Failed to save customer. Please try again.', 'error');
        saveBtn.disabled = false;
        saveBtn.textContent = 'Save Customer';
    }
}

// Copy measurements from last customer
async function copyFromLastCustomer() {
    try {
        const customers = await window.api.getCustomers();
        if (!customers || customers.length === 0) {
            showToast('No previous customers found to copy from', 'error');
            return;
        }
        
        // Get the most recent customer (they're sorted by ID descending)
        const lastCustomer = customers[0];
        
        if (!confirm(`Copy measurements from:\n\nID: ${lastCustomer.uniqueID}\nName: ${lastCustomer.name}\nPhone: ${lastCustomer.phone}\n\nThis will overwrite current measurement values. Continue?`)) {
            return;
        }
        
        // Copy all measurement fields
        const measurementFields = [
            'lambai', 'bazo', 'shoulder', 'shoulderDown', 'kalarSize', 'chati',
            'mora', 'kamar', 'gira', 'shalwar', 'girashalwar', 'pancha', 'kanda',
            'kalarLength', 'kalarWidth', 'kafLength', 'kafWidth', 'patiLength', 'patiWidth',
            'samneSize', 'designNo', 'karigarName'
        ];
        
        measurementFields.forEach(field => {
            const input = document.getElementById(field);
            if (input && lastCustomer[field]) {
                input.value = lastCustomer[field];
            }
        });
        
        // Copy style selections
        const styleFields = {
            'kalarTypeGroup': lastCustomer.kalar_Ban ? lastCustomer.kalar_Ban.split('،')[0]?.trim() : '',
            'kalarStyleGroup': lastCustomer.kalar_Ban ? lastCustomer.kalar_Ban.split('،')[1]?.trim() : '',
            'kafTypeGroup': lastCustomer.kaf ? (lastCustomer.kaf.includes('سنگل') ? 'سنگل' : lastCustomer.kaf.includes('ڈبل') ? 'ڈبل' : '') : '',
            'kafStyleGroup': lastCustomer.kaf ? (lastCustomer.kaf.includes('سیدھا') ? 'سیدھا' : lastCustomer.kaf.includes('گول') ? 'گول' : '') : '',
            'kandaGroup': lastCustomer.kanda || '',
            'damanGroup': lastCustomer.daman || '',
            'platGroup': lastCustomer.plat || '',
            'samneGroup': lastCustomer.samne || '',
            'sideJeebGroup': lastCustomer.dblSide || '',
            'shalwarPakatGroup': lastCustomer.pakat || ''
        };
        
        Object.keys(styleFields).forEach(groupId => {
            const value = styleFields[groupId];
            if (value) {
                const group = document.getElementById(groupId);
                if (group) {
                    const buttons = group.querySelectorAll('.pair-button, .inline-pair-button');
                    buttons.forEach(btn => {
                        if (btn.getAttribute('data-value') === value) {
                            btn.click();
                        }
                    });
                }
            }
        });
        
        showToast(`Measurements copied from ${lastCustomer.name} (ID: ${lastCustomer.uniqueID})`, 'success');
        
    } catch (error) {
        console.error('Error copying measurements:', error);
        showToast('Failed to copy measurements', 'error');
    }
}

// Handle Save & Print
async function handleSaveAndPrint() {
    const result = await handleSaveInternal();
    if (result && result.success && result.uniqueID) {
        // Redirect to customer details page which will auto-print
        window.location.href = `customer-details.html?id=${result.uniqueID}&autoprint=true`;
    }
}

// Handle Save & New
async function handleSaveAndNew() {
    const result = await handleSaveInternal();
    if (result && result.success) {
        showToast('Customer saved! Ready for new entry.', 'success');
        // Reload the page to clear the form
        setTimeout(() => {
            window.location.reload();
        }, 800);
    }
}

// Internal save function that returns result
async function handleSaveInternal() {
    const saveBtn = document.getElementById('saveBtn');
    const savePrintBtn = document.getElementById('savePrintBtn');
    const saveNewBtn = document.getElementById('saveNewBtn');
    
    try {
        // Show loading state on buttons
        const originalTexts = {};
        if (saveBtn) {
            originalTexts.save = saveBtn.innerHTML;
            saveBtn.innerHTML = '⏳ Saving...';
            saveBtn.disabled = true;
        }
        if (savePrintBtn) {
            originalTexts.savePrint = savePrintBtn.innerHTML;
            savePrintBtn.innerHTML = '⏳ Saving...';
            savePrintBtn.disabled = true;
        }
        if (saveNewBtn) {
            originalTexts.saveNew = saveNewBtn.innerHTML;
            saveNewBtn.innerHTML = '⏳ Saving...';
            saveNewBtn.disabled = true;
        }
        
        // Validate required fields
        const validationErrors = validateRequiredFields();
        if (validationErrors.length > 0) {
            const errorMessage = 'Please fill in all required fields:\n' + validationErrors.join('\n');
            showToast(errorMessage, 'error');
            if (saveBtn) saveBtn.disabled = false;
            if (savePrintBtn) savePrintBtn.disabled = false;
            if (saveNewBtn) saveNewBtn.disabled = false;
            return null;
        }

        // Get customer data
        const customerData = collectFormData();
        const nextID = customerData.uniqueID;
        
        if (!nextID) {
            throw new Error('Failed to generate customer ID');
        }
        
        // Save to database
        const result = await window.api.saveCustomer(customerData);
        
        // Restore button text and re-enable
        if (saveBtn) {
            saveBtn.innerHTML = originalTexts.save || '💾 Save';
            saveBtn.disabled = false;
        }
        if (savePrintBtn) {
            savePrintBtn.innerHTML = originalTexts.savePrint || '🖨️ Save & Print';
            savePrintBtn.disabled = false;
        }
        if (saveNewBtn) {
            saveNewBtn.innerHTML = originalTexts.saveNew || '➕ Save & New';
            saveNewBtn.disabled = false;
        }
        
        if (result.success) {
            showToast('✅ Customer saved successfully!', 'success');
            return { success: true, uniqueID: nextID };
        } else {
            throw new Error(result.error || 'Failed to save customer');
        }
        
    } catch (error) {
        console.error('Save error:', error);
        showToast('Failed to save customer. Please try again.', 'error');
        
        // Restore buttons on error
        if (saveBtn) {
            saveBtn.innerHTML = '💾 Save';
            saveBtn.disabled = false;
        }
        if (savePrintBtn) {
            savePrintBtn.innerHTML = '🖨️ Save & Print';
            savePrintBtn.disabled = false;
        }
        if (saveNewBtn) {
            saveNewBtn.innerHTML = '➕ Save & New';
            saveNewBtn.disabled = false;
        }
        
        return null;
    }
}

// Initialize event listeners and clear all selections on page load
let initialized = false;

function initializeEventListeners() {
    if (initialized) {
        return;
    }
    
    const saveBtn = document.getElementById('saveBtn');
    if (saveBtn) {
        saveBtn.addEventListener('click', handleSave);
    }
    
    const savePrintBtn = document.getElementById('savePrintBtn');
    if (savePrintBtn) {
        savePrintBtn.addEventListener('click', handleSaveAndPrint);
    }
    
    const saveNewBtn = document.getElementById('saveNewBtn');
    if (saveNewBtn) {
        saveNewBtn.addEventListener('click', handleSaveAndNew);
    }
    
    const copyMeasurementsBtn = document.getElementById('copyMeasurementsBtn');
    if (copyMeasurementsBtn) {
        copyMeasurementsBtn.addEventListener('click', copyFromLastCustomer);
    }
    
    // Clear all selections on page load
    document.querySelectorAll('.pair-button.selected, .inline-pair-button.selected').forEach(button => {
        button.classList.remove('selected');
    });
    
    // Clear error on input for required fields
    Object.keys(REQUIRED_FIELDS).forEach(fieldId => {
        const input = document.getElementById(fieldId);
        if (input) {
            input.addEventListener('input', () => {
                if (input.value.trim()) {
                    input.classList.remove('error');
                    const errorElement = document.getElementById(fieldId.replace('customer', '').toLowerCase() + 'Error');
                    if (errorElement) {
                        errorElement.classList.remove('show');
                    }
                }
            });
        }
    });
    
    initialized = true;
}

document.addEventListener('DOMContentLoaded', initializeEventListeners);