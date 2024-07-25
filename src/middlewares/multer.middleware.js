import multer from "multer";
import path from "path";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const allowedFileTypes = ['.jpg', '.jpeg', '.png', '.pdf', '.doc', '.docx', '.xls', '.xlsx','.txt','.mp4','.avi','.mov'];

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, "..", "..","public", "files"));
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const originalExtension = path.extname(file.originalname);
        const randomFilename = uniqueSuffix + originalExtension;
        cb(null, randomFilename); 
    }
});

// const limits = { fileSize: 1024*2000};

const fileFilter = (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedFileTypes.includes(ext)) {
        cb(null, true); 
    } else {
        cb(new Error('Only specific file types are allowed!'), false); 
    }
};

export const uploadForfile = multer({ 
    storage, 
    // limits,
    fileFilter, 
});
