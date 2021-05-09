const express = require("express");
const bodyParser = require("body-parser");
const multer = require("multer");
const util = require("util");
const webp = require("webp-converter");

webp.grant_permission();

const port = 3004;
const app = express();

app.set("views", "./templates");
app.set("view engine", "pug");
app.use(bodyParser.urlencoded({extended: true}));

const storage = multer.diskStorage({
    destination: (req, file, callback) => {
        callback(null, "./temp");
    },
    filename: (req, file, callback) => {
        console.log(file);
        const extension = file.originalname.split(".")[1];
        callback(null, `${file.fieldname} - ${Date.now()}.${extension}`)
    }
});

const uploadFiles = multer({ storage: storage }).array("files", 10);
const upload = util.promisify(uploadFiles);

const converWebpToJpeg = async (filename, destination) => {
    return webp.dwebp(filename, destination, "-o").then((result) => console.log(result)).catch((error) => console.error(error));
}

app.get("/", (_, res) => {
    return res.render("index");
});

app.post("/", async (req, res) => {
    try {
        await upload(req, res);
    
        if (req.files.length <= 0) {
          return res.send(`You must select at least 1 file.`);
        }

        for (const file of req.files) {
            const fileNameWithoutExtension = file.originalname.split(".")[0];
            await converWebpToJpeg(`./temp/${file.filename}`, `./converted/${fileNameWithoutExtension}.jpeg`)
        }
    
        return res.send(`Files has been uploaded.`);
    } catch (error) {
        console.error(error);

        if (error.code === "LIMIT_UNEXPECTED_FILE") {
            return res.send("Too many files to upload.");
        }
        return res.send(`Error when trying upload many files: ${error}`);
    }
});

app.listen(port, () => {
    console.log(`Server started at port ${port}`);
})