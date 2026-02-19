// Initialize event listeners when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  // Export to CSV button
  const exportBtn = document.getElementById('exportCSVBtn');
  if (exportBtn) {
    exportBtn.addEventListener("click", async () => {
      try {
        const result = await window.api.exportCSV();
        if (result.success) {
          alert(`✅ Export successful!\n\n${result.count} customers exported to:\n${result.path}\n\nYou can open this file in Excel or any spreadsheet application.`);
        } else if (result.canceled) {
          // User canceled - no message needed, just return
          return;
        } else {
          alert("❌ Export failed.");
        }
      } catch (err) {
        console.error(err);
        alert("❌ An error occurred during export.");
      }
    });
  }
});
