const db = require('../models');
const fs = require('fs');
const path = require('path');

function getFilesInDirectory(srcpath) {
    const items = fs.readdirSync(srcpath)
        .map(file => path.join(srcpath, file));
    return items.filter(item => fs.statSync(item).isFile());
}

function getDirectoriesRecursive(srcpath) {
    const entries = fs.readdirSync(srcpath)
        .map(item => path.join(srcpath, item));

    const files = entries.filter(item => fs.statSync(item).isFile());
    const directories = entries.filter(item => fs.statSync(item).isDirectory());

    const filesInSubdirectories = flatten(directories.map(getDirectoriesRecursive));
    return [...files, ...filesInSubdirectories];
}

function flatten(lists) {
    return lists.reduce((a, b) => a.concat(b), []);
}

class ImageController {

    async getList(req, res) {

        const userId = req.userId;
        const { fileNames } = req.query;

        if (fileNames && !Array.isArray(fileNames)) {
            return res.status(400).json({ error: 'Invalid file names provided.' });
        }

        const basePath = path.join(__dirname, `../uploads/images/${userId}`);
        let paths = getDirectoriesRecursive(basePath);
        
        const imagePath = [];
        fileNames?.map((name) => {
            imagePath.push(path.join(basePath, `${name}`));
        });

        const data = []
        paths.map((item) => {
            if (!imagePath.includes(item)) {
                const dir = path.relative(basePath, item);
                //if (!fs.existsSync(item)) {
                const image = fs.readFileSync(item);
                data.push({ dir, image: image.toString('base64') })
            }
        })

        // if (data.length === 0) return res.status(404).json({ success:0, error: 'No images found.' });
        res.status(200).json({ count: data.length, data });
    }
};

module.exports = new ImageController();