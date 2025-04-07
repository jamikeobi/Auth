import archiver from 'archiver'
// const archiver = require('archiver')

const fs = require('fs')
// create ZIP from folder
const createZipFromFolder = (folderPath) => {
    const output = fs.createWriteStream(folderPath + '.zip')

    const archive = archiver('zip', {
        zlib: { level: 9 } // set compression level to the highest
    })

    archive.pipe(output)
    archive.directory(folderPath, false)
    archive.finalize()
}

// create ZIP from file
const createZipFromFile = (filePath) => {
    const output = fs.createWriteStream(filePath + '.zip')
    const archive = archiver('zip', {
        zlib: { level: 9 } // set compression level to the highest
    })
    archive.pipe(output);
    archive.file(filePath, { name: file })
    archive.finalize()
}

export default {
    createZipFromFolder,
    createZipFromFile
}