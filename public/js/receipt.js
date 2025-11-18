// public/receipt.js
const inp = document.getElementById('receiptInput');
const btn = document.getElementById('uploadBtn');
const preview = document.getElementById('preview');
const resultBox = document.getElementById('resultBox');

inp.addEventListener('change', () => {
  if (!inp.files || !inp.files[0]) return;
  const url = URL.createObjectURL(inp.files[0]);
  preview.src = url;
  preview.style.display = 'block';
});

btn.addEventListener('click', async () => {
  if (!inp.files || !inp.files[0]) return alert('Please select a receipt image first');

  const fd = new FormData();
  fd.append('receipt', inp.files[0]);

  resultBox.textContent = 'Uploading and processing...';

  try {
    const res = await fetch('/api/receipt/parse', { method: 'POST', body: fd });
    const json = await res.json();
    if (!json.success) {
      resultBox.textContent = 'Error: ' + (json.error || 'Unknown error');
      return;
    }

    // Pretty show
    const cp = json.data.carbon_footprint;
    let out = `Total CO2e: ${cp.total_co2_kg} kg (${cp.total_co2_lbs} lbs)\n`;
    out += `Items recognized: ${cp.items_matched}/${cp.total_items}\n\n`;

    if (cp.breakdown && cp.breakdown.length) {
      out += 'Breakdown:\n';
      cp.breakdown.forEach(it => {
        out += ` - ${it.item} ×${it.quantity} → ${it.total_co2_kg} kg (source: ${it.source})\n`;
      });
      out += '\n';
    }

    if (cp.not_found_list && cp.not_found_list.length) {
      out += 'Not recognized: ' + cp.not_found_list.join(', ') + '\n\n';
    }

    out += 'Raw items found:\n' + JSON.stringify(json.data.items_found, null, 2) + '\n\n';
    out += 'Extracted text preview:\n' + json.data.extracted_text_preview;

    resultBox.textContent = out;
  } catch (err) {
    resultBox.textContent = 'Error: ' + err.message;
  }
});
