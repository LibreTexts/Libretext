const fs = require('fs').promises;
const path = require('path');
const spawn = require('child_process').spawn;

const PREPRESS_FILES = ['Content', 'Cover_Amazon', 'Cover_Casewrap', 'Cover_CoilBound', 'Cover_PerfectBound'];

async function getFiles(dir) {
  const files = await fs.readdir(dir, { withFileTypes: true });
  let filePaths = [];
  for (const file of files) {
      let fullPath = path.join(dir, file.name);
      if (file.isDirectory()) {
          filePaths = filePaths.concat(await getFiles(fullPath));
          continue;
      }
      filePaths.push(fullPath);
  }
  return filePaths.filter((p) => p.includes('.pdf'));
}

function getFilePreset(filePath) {
  const fileName = path.basename(filePath).replace('.pdf', '');
  if (PREPRESS_FILES.includes(fileName)) {
    return 'prepress';
  }
  return 'ebook';
}

module.exports = async function(path) {
  console.log('Post processing:', path);
  const allFiles = await getFiles(path);
  if (!allFiles.length) return;

  try {
    const succeededFiles = await Promise.all(allFiles.map((pdfToProcess) => (
      new Promise((resolve, reject) => {

        const preset = getFilePreset(pdfToProcess);
        const relInPath = `./${pdfToProcess}`;
        const splitInPath = relInPath.split('.pdf');
        if (splitInPath.length !== 2) {
          reject(new Error(`Invalid file path`));
        }
        const relOutPath = `${splitInPath[0]}_postprocessed.pdf`;
        const child = spawn(
          'gs',
          ['-o', relOutPath, `-sDEVICE=pdfwrite`, `-dPDFSETTINGS=/${preset}`, relInPath],
          { cwd: __dirname },
        );
        child.stderr.on('data', (data) => console.error(`${data}`));
        child.on('error', (err) => reject(err));
        child.on('exit', (code) => {
          if (code === 0) {
            resolve(relOutPath); // Successfully completed
          } else {
            reject(new Error(`PDF postprocessor child process exited with code ${code}`));
          }
        });
      })
    )));

    await Promise.all(succeededFiles.map(async (postProcessedFilePath) => {
      try {
        const origFilePath = postProcessedFilePath.replace('_postprocessed', '');
        await fs.rm(origFilePath, { force: true });
        await fs.rename(postProcessedFilePath, origFilePath);
      } catch (err) {
        console.error('Post-process file overwrite error', err);
      }
    }));
  } catch (err) {
    console.error('Error post-processing PDFs!', err);
  }
}
