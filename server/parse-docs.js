const mammoth = require('mammoth');
const fs = require('fs');
const path = require('path');

async function parseDocx(filePath) {
  const result = await mammoth.extractRawText({ path: filePath });
  return result.value;
}

async function main() {
  const doc1 = await parseDocx(path.join(__dirname, 'doc1.docx'));
  const doc2 = await parseDocx(path.join(__dirname, 'doc2.docx'));
  
  console.log('=== 文档1: 棉花糖教育成长平台 ===\n');
  console.log(doc1);
  console.log('\n\n=== 文档2: 家教联盟平台开发计划 ===\n');
  console.log(doc2);
  
  // 保存到文件
  fs.writeFileSync(path.join(__dirname, 'doc1.txt'), doc1);
  fs.writeFileSync(path.join(__dirname, 'doc2.txt'), doc2);
  
  console.log('\n\n已保存到 doc1.txt 和 doc2.txt');
}

main().catch(console.error);
