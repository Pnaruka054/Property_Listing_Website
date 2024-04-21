const express = require('express');
const app = express();
const mongoose = require('mongoose');
const cors = require('cors')
const cloudinary = require('cloudinary').v2;
const multer = require('multer')
const fs = require('fs');
const path = require('path')
require('dotenv').config()
const PORT = process.env.PORT || 3000;

mongoose.set('strictQuery', false);

// Database Connection
async function connectToDatabase() {
    try {
        await mongoose.connect(process.env.DATA_BASE);
        console.log('Database connected successfully');
    } catch (err) {
        console.error(err);
    }
}
connectToDatabase();

// Create Schema
const Schema = new mongoose.Schema({
    Name: { type: String },
    userName: { type: String },
    likes: { type: Number, default: 0 },
    Exprience: { type: Number },
    Image: { type: String },
    ProjectImage: { type: String },
    ProfileLogo: { type: String },
    projectTitle: { type: String },
    projectDiscription: { type: String }
});

const Model = mongoose.model('contents_data', Schema);
const FirstProjectModel = mongoose.model('first_contents_data', Schema);
const ModelFooter = mongoose.model('footer_data', Schema)

// All Middleware
app.use(express.json());
app.use(cors())

// Serve static files
app.use(express.static(path.resolve(__dirname, 'build')));

// All CRUD Operations
app.get('/', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'build', 'index.html'))
});

app.get('/admin', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'build', 'index.html'))
});

app.get('/get', async (req, res) => {
    try {
        let data = await Model.find();
        res.send(data);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// Define storage and filter for multer
const ImageConfig = multer.diskStorage({
    destination: './uploads'
})

const ImageFilter = (req, file, callback) => {
    if (file.mimetype.startsWith('image')) {
        callback(null, true)
    } else {
        callback(new Error('only image allows'))
    }
}

const upload = multer({
    storage: ImageConfig,
    fileFilter: ImageFilter
})

// cloudinary config
cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.API_KEY,
    api_secret: process.env.API_SECRET
})

// Middleware to delete uploaded files
function cleanupUploadedFiles(directory) {
    fs.readdir(directory, 'utf-8', (err, files) => {
        if (err) {
            console.error("Error reading directory:", err);
            return;
        }
        files.forEach(file => {
            const filePath = `${directory}/${file}`;
            fs.unlink(filePath, (err) => {
                if (err) {
                    console.error("Error deleting file:", err);
                } else {
                    console.log(`File ${filePath} deleted successfully.`);
                }
            });
        });
    });
}

app.post('/post', upload.fields([{ name: 'ProjectImage' }, { name: 'ProfileLogo' }]), async (req, res) => {
    try {
        const ProjectImage = req.files['ProjectImage'][0].path;
        const ProfileLogo = req.files['ProfileLogo'][0].path;

        const uploadResult = await cloudinary.uploader.upload(ProjectImage);
        const profileImageUrl = uploadResult.secure_url;

        const uploadResult1 = await cloudinary.uploader.upload(ProfileLogo);
        const profileImageUrl1 = uploadResult1.secure_url;

        const updatedData = {
            ProjectImage: profileImageUrl,
            ProfileLogo: profileImageUrl1,
            Name: req.body.Name,
            userName: req.body.userName,
            likes: req.body.likes,
            projectTitle: req.body.projectTitle,
            projectDiscription: req.body.projectDiscription
        };

        const dataRecived = await Model(updatedData);
        let dataInserted = await dataRecived.save()
        cleanupUploadedFiles('./uploads')
        res.send(dataInserted);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Define other routes and CRUD operations similarly

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
