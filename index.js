const express = require('express');
const app = express();
const mongoose = require('mongoose');
const cors = require('cors')
const cloudinary = require('cloudinary')
const multer = require('multer')
const fs = require('fs');
// const path = require('path');
const PORT = process.env.PORT || 8000
const DATA_BASE = process.env.DATA_BASE

// app.use(express.static(path.join(__dirname, 'build')));

// app.get('/admin', (req, res) => {
//     res.sendFile(path.join(__dirname, 'build', 'index.html'));
// });

mongoose.set('strictQuery', false);

// Database Connection
async function main() {
    try {
        await mongoose.connect(DATA_BASE);
        console.log('Database connected successfully');
    } catch (err) {
        console.error(err);
    }
}
main().catch(
    err => {
        return console.log(err)
    }
);

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

// All CRUD Operations
app.get('/get', async (req, res) => {
    try {
        let data = await Model.find();
        res.send(data);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

app.get('/getAdded', async (req, res) => {
    try {
        let data1 = await Model.find();
        res.send(data1);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

app.get('/getFirst', async (req, res) => {
    try {
        let data1 = await FirstProjectModel.find();
        res.send(data1);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

app.get('/FooterGet', async (req, res) => {
    try {
        let data1 = await ModelFooter.find();
        res.send(data1);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// Storage
const ImageConfig = multer.diskStorage({
    destination: (req, file, callback) => {
        callback(null, './uploads')
    }
})

// ImageFilter
// const ImageFilter = (req, file, callback) => {
//     if (file.mimetype.startsWith('image')) {
//         callback(null, true)
//     } else {
//         callback(new Error('only image allows'))
//     }
// }

const upload = multer({
    storage: ImageConfig,
    // fileFilter: ImageFilter
})

// cloudinary
cloudinary.config({
    cloud_name: process.CLOUD_NAME,
    api_key: process.API_KEY,
    api_secret: process.API_SECRET
})

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
        const ProjectImage = req.files['ProjectImage'][0].path
        const ProfileLogo = req.files['ProfileLogo'][0].path

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
        res.json(err);
    }
});

app.post('/postFooter', upload.fields([{ name: 'Image' }]), async (req, res) => {
    try {
        const Image = req.files['Image'][0].path

        const uploadResult = await cloudinary.uploader.upload(Image);
        const ImageUrl = uploadResult.secure_url;

        const updatedData = {
            Image: ImageUrl,
            Name: req.body.Name,
            Exprience: req.body.Exprience
        };
        const dataRecived = await ModelFooter(updatedData);
        let dataInserted = await dataRecived.save()
        cleanupUploadedFiles('./uploads')
        res.send(dataInserted);
    } catch (err) {
        res.json(err);
    }
});

app.patch('/patch/:id', upload.fields([{ name: 'ProjectImage' }, { name: 'ProfileLogo' }]), async (req, res) => {
    try {
        let ProjectImagePublic_id = req.query.ProjectImage
        let ProfileLogoPublic_id = req.query.ProfileLogo
        cloudinary.uploader.destroy(ProjectImagePublic_id, function (result) { console.log(result) });
        cloudinary.uploader.destroy(ProfileLogoPublic_id, function (result) { console.log(result) });

        let id = req.params.id
        const ProjectImage = req.files['ProjectImage'][0].path
        const ProfileLogo = req.files['ProfileLogo'][0].path

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

        const result = await FirstProjectModel.findOneAndUpdate({ _id: id }, updatedData, { new: true });
        res.json(result);
        cleanupUploadedFiles('./uploads');
    } catch (err) {
        res.status(500).send("Error updating document");
    }
});


app.patch('/patchContent/:id', async (req, res) => {
    try {
        let id = req.params.id
        let likes = req.body.likes
        let deletedData = await Model.findOneAndUpdate({ _id: id }, { likes: likes }, { new: true })
        res.send(deletedData)
    } catch (err) {
        res.json(err)
    }
})

app.patch('/patch1/:id', async (req, res) => {
    try {
        let id = req.params.id
        let updatedData = await FirstProjectModel.findOneAndUpdate({ _id: id }, req.body, { new: true })
        res.send(updatedData)
    } catch (err) {
        res.json(err)
    }
})

app.patch('/patchEditAddedProject/:id', upload.fields([{ name: 'ProjectImage' }, { name: 'ProfileLogo' }]), async (req, res) => {
    let id = req.params.id
    let ProjectImagePublic_id = req.query.ProjectImage
    let ProfileLogoPublic_id = req.query.ProfileLogo

    let profileImageUrl;
    let profileImageUrl1
    if (req.files.ProjectImage !== undefined || req.files.ProfileLogo !== undefined) {
        if (req.files.ProjectImage !== undefined) {
            cloudinary.uploader.destroy(ProjectImagePublic_id, function (result) { console.log(result) });
            const ProjectImage = req.files['ProjectImage'][0].path
            const uploadResult = await cloudinary.uploader.upload(ProjectImage);
            profileImageUrl = uploadResult.secure_url;
        }

        if (req.files.ProfileLogo !== undefined) {
            cloudinary.uploader.destroy(ProfileLogoPublic_id, function (result) { console.log(result) });
            const ProfileLogo = req.files['ProfileLogo'][0].path
            const uploadResult1 = await cloudinary.uploader.upload(ProfileLogo);
            profileImageUrl1 = uploadResult1.secure_url;
        }

    } else {
        console.log('nahi aayi image')
    }
    let updatedData = new Object()
    if (profileImageUrl !== undefined || profileImageUrl1 !== undefined) {
        if (profileImageUrl !== undefined && profileImageUrl1 == undefined) {
            console.log('pro Img aayi ha')
            updatedData.ProjectImage = profileImageUrl
            if (req.body.Name !== '') {
                updatedData.Name = req.body.Name
            }
            if (req.body.userName !== '') {
                updatedData.userName = req.body.userName
            }
            if (req.body.likes !== '') {
                updatedData.likes = req.body.likes
            }
            if (req.body.projectTitle !== '') {
                updatedData.projectTitle = req.body.projectTitle
            }
            if (req.body.projectDiscription !== '') {
                updatedData.projectDiscription = req.body.projectDiscription
            }
        } else if (profileImageUrl1 !== undefined && profileImageUrl == undefined) {
            console.log('pro Logo aaya ha')
            updatedData.ProfileLogo = profileImageUrl1
            if (req.body.Name !== '') {
                updatedData.Name = req.body.Name
            }
            if (req.body.userName !== '') {
                updatedData.userName = req.body.userName
            }
            if (req.body.likes !== '') {
                updatedData.likes = req.body.likes
            }
            if (req.body.projectTitle !== '') {
                updatedData.projectTitle = req.body.projectTitle
            }
            if (req.body.projectDiscription !== '') {
                updatedData.projectDiscription = req.body.projectDiscription
            }
        } else {
            console.log('dono ha')
            updatedData.ProjectImage = profileImageUrl
            updatedData.ProfileLogo = profileImageUrl1
            if (req.body.Name !== '') {
                updatedData.Name = req.body.Name
            }
            if (req.body.userName !== '') {
                updatedData.userName = req.body.userName
            }
            if (req.body.likes !== '') {
                updatedData.likes = req.body.likes
            }
            if (req.body.projectTitle !== '') {
                updatedData.projectTitle = req.body.projectTitle
            }
            if (req.body.projectDiscription !== '') {
                updatedData.projectDiscription = req.body.projectDiscription
            }
        }

    } else {
        console.log('dono nahi ha')
        if (req.body.Name !== '') {
            updatedData.Name = req.body.Name
        }
        if (req.body.userName !== '') {
            updatedData.userName = req.body.userName
        }
        if (req.body.likes !== '') {
            updatedData.likes = req.body.likes
        }
        if (req.body.projectTitle !== '') {
            updatedData.projectTitle = req.body.projectTitle
        }
        if (req.body.projectDiscription !== '') {
            updatedData.projectDiscription = req.body.projectDiscription
        }

    }

    const result = await Model.findOneAndUpdate({ _id: id }, updatedData, { new: true });
    res.json(result);
    cleanupUploadedFiles('./uploads');
})

app.patch('/patchEditFooter/:id', upload.fields([{ name: 'Image' }]), async (req, res) => {
    let id = req.params.id
    let ImagePublic_id = req.query.Image

    let profileImageUrl;
    if (req.files.Image !== undefined) {

        cloudinary.uploader.destroy(ImagePublic_id, function (result) { console.log(result) });
        const ProjectImage = req.files['Image'][0].path
        const uploadResult = await cloudinary.uploader.upload(ProjectImage);
        profileImageUrl = uploadResult.secure_url;
    } else {
        console.log('nahi aayi image')
    }

    let updatedData = new Object()
    if (profileImageUrl !== undefined) {
        updatedData.Image = profileImageUrl
        if (req.body.Name !== '') {
            updatedData.Name = req.body.Name
        }
        if (req.body.Exprience !== '') {
            updatedData.Exprience = req.body.Exprience
        }
    } else {
        if (req.body.Name !== '') {
            updatedData.Name = req.body.Name
        }
        if (req.body.Exprience !== '') {
            updatedData.Exprience = req.body.Exprience
        }
    }

    const result = await ModelFooter.findOneAndUpdate({ _id: id }, updatedData, { new: true });
    res.json(result);
    cleanupUploadedFiles('./uploads');
})

app.delete('/deleteAddedData/:id', async (req, res) => {
    try {
        let id = req.params.id
        let ProjectImagePublic_id = req.query.ProjectImage
        let ProfileLogoPublic_id = req.query.ProfileLogo

        cloudinary.uploader.destroy(ProjectImagePublic_id, function (result) { console.log(result) });
        cloudinary.uploader.destroy(ProfileLogoPublic_id, function (result) { console.log(result) });

        let deletedData = await Model.findByIdAndDelete({ _id: id }, function (err, docs) {
            if (err) {
                console.log(err)
            }
            else {
                console.log("Deleted : ", docs);
            }
        })
        res.send(deletedData)
    } catch (error) {
        res.json(error)
    }
})

app.delete('/deleteFooterAddedData/:id', async (req, res) => {
    try {
        let id = req.params.id
        let ProjectImagePublic_id = req.query.ProjectImage
        let ProfileLogoPublic_id = req.query.ProfileLogo

        cloudinary.uploader.destroy(ProjectImagePublic_id, function (result) { console.log(result) });
        cloudinary.uploader.destroy(ProfileLogoPublic_id, function (result) { console.log(result) });

        let deletedData = await ModelFooter.findByIdAndDelete({ _id: id }, function (err, docs) {
            if (err) {
                console.log(err)
            }
            else {
                console.log("Deleted : ", docs);
            }
        })
        res.send(deletedData)
    } catch (error) {
        res.json(error)
    }
})

app.listen(PORT, () => {
    console.log('Server started on port 8000');
});
