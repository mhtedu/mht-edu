const fs = require('fs');
const path = require('path');

const urls = [
  'https://coze-coding-project.tos.coze.site/create_attachment/2026-03-27/2156599318681536_d5f6af14052bf62acf1fbc461423abcc_%E6%A3%89%E8%8A%B1%E7%B3%96%E6%95%99%E8%82%B2%E6%88%90%E9%95%BF%E5%B9%B3%E5%8F%B0.docx?sign=4896683887-518da6fec2-0-77e3088e0bbbe36386b54ea4844e43e1dec4737dabb2136fc749a4a68240a2b3',
  'https://coze-coding-project.tos.coze.site/create_attachment/2026-03-27/2156599318681536_f048f8fd059269d1d7f2e925b8617395_%E5%AE%B6%E6%95%99%E8%81%94%E7%9B%9F%E5%B9%B3%E5%8F%B0%E5%BC%80%E5%8F%91%E8%AE%A1%E5%88%92.docx?sign=4896683899-6e1f757d61-0-da2d88a100daf3404393ba418f768e04c82d8928c0bff9a4c69e81d85792adec'
];

async function fetchDocuments() {
  const results = [];
  
  for (let i = 0; i < urls.length; i++) {
    const url = urls[i];
    console.log(`Fetching document ${i + 1}/${urls.length}...`);
    
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const buffer = await response.arrayBuffer();
      const filePath = path.join(__dirname, `doc${i + 1}.docx`);
      fs.writeFileSync(filePath, Buffer.from(buffer));
      
      console.log(`Saved to ${filePath}`);
      results.push({ url, status: 'success', filePath });
    } catch (error) {
      console.error(`Error fetching ${url}:`, error.message);
      results.push({ url, status: 'error', error: error.message });
    }
  }
  
  console.log('\nResults:', JSON.stringify(results, null, 2));
}

fetchDocuments();
