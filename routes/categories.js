const express = require('express');
const router = express.Router();

// Libraries untuk validasi dan interaksi dengan database
const { body, validationResult } = require('express-validator');
const connection = require('../config/database');

// Libraries untuk pengolahan gambar
const sharp = require('sharp');
const fs = require('fs'); // untuk menghapus gambar sementara

// Inisialisasi multer untuk mengunggah file
const multer = require('multer');
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, './uploads/'); // direktori tempat menyimpan file
    },
    filename: (req, file, cb) => {
        // Penamaan ulang gambar yang diunggah dengan timestamp untuk menghindari nama yang sama
        cb(null, Date.now() + '.jpg'); // menyimpan dengan ekstensi .jpg
    }
});
const upload = multer({ storage: storage });


// Route untuk mendapatkan daftar kategori
router.get('/', (req, res) => {
    const searchTerm = req.query.name || ""; // mengambil parameter 'name' dari query string
    const offsetParam = Number(req.query.offset) || 0; // misalnya, Anda juga bisa mengambil offset dari query string
    const limitParam = Number(req.query.limit) || 10; // misalnya, Anda juga bisa mengambil limit dari query string

    connection.beginTransaction(err => {
        if (err) throw err;
      
        connection.query('CALL CategoriesList(?, ?, ?, @totalCount)', [searchTerm, offsetParam, limitParam], (err, results) => {
          if (err) {
            return connection.rollback(() => {
              throw err;
            });
          }
      
          connection.query('SELECT @totalCount', (error, results2) => {
            if (error) {
              return connection.rollback(() => {
                throw error;
              });
            }
      
            const totalCount = results2[0]['@totalCount'];
            res.status(200).json({
              status: true,
              message: 'List of Categories',
              data: results[0],
              totalCount: totalCount
            });
      
            connection.commit(err => {
              if (err) {
                return connection.rollback(() => {
                  throw err;
                });
              }
            });
          });
        });
      });
      
});

// Route untuk mendapatkan detail dari satu kategori
router.get('/:id', function (req, res) {
    connection.query('CALL CategoryByIdGet(?)', [req.params.id], function (err, rows) {
        if (err) {
            return res.status(500).json({
                status: false,
                message: 'Internal Server Error',
            });
        } else {
            return res.status(200).json({
                status: true,
                message: 'Category Details',
                data: rows[0]
            });
        }
    });
});

// Route untuk menambahkan kategori baru
router.post('/add', upload.single('image'), [
    // validation
    body('name').notEmpty().withMessage('Name is required'),
    body('slug').notEmpty().withMessage('Slug is required')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    
    if (!req.file) {
        return res.status(400).json({
            status: false,
            message: 'Image is required'
        });
    }

    const tempPath = req.file.path;
    const targetPath = './uploads/' + Date.now() + '.jpg';

    try {
        await sharp(tempPath)
            .resize(800) // Anda dapat mengubah ukuran sesuai kebutuhan
            .jpeg({ quality: 60 })
            .toFile(targetPath);

        fs.unlinkSync(tempPath); // Hapus gambar sementara
    } catch (err) {
        fs.unlinkSync(tempPath); // Pastikan gambar sementara dihapus jika ada kesalahan
        return res.status(500).json({
            status: false,
            message: 'Failed to process image.',
            error: err.message
        });
    }

    connection.query(
        'CALL CategoryAdd(?, ?, ?, @result); SELECT @result;', 
        [req.body.name, req.body.slug, targetPath],
        (err, results) => {
            if (err) {
                return res.status(500).json({
                    status: false,
                    message: 'Internal Server Error',
                    error: err
                });
            }

            const procedureResult = results[1][0]['@result'];
            if (procedureResult === 'Insert successful') {
                res.status(201).json({
                    status: true,
                    message: procedureResult
                });
            } else {
                res.status(400).json({
                    status: false,
                    message: procedureResult
                });
            }
        }
    );
});

// Route untuk mengupdate kategori berdasarkan ID
router.put('/update/:id', upload.single('image'), [
    // validation
    body('name').notEmpty().withMessage('Name is required'),
    body('slug').notEmpty().withMessage('Slug is required')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    
    const id = req.params.id;
    let imagePath;

    // Jika gambar baru diunggah
    if (req.file) {
        const tempPath = req.file.path;
        const targetPath = './uploads/' + Date.now() + '.jpg';

        try {
            await sharp(tempPath)
                .resize(800) // Anda dapat mengubah ukuran sesuai kebutuhan
                .jpeg({ quality: 60 })
                .toFile(targetPath);

            fs.unlinkSync(tempPath); // Hapus gambar sementara

            imagePath = targetPath; // Gunakan path gambar yang baru

        } catch (err) {
            fs.unlinkSync(tempPath); // Pastikan gambar sementara dihapus jika ada kesalahan
            return res.status(500).json({
                status: false,
                message: 'Failed to process image.',
                error: err.message
            });
        }
    } else {
        // Jika tidak ada gambar baru yang diunggah, gunakan gambar sebelumnya
        imagePath = req.body.existingImage;
    }

    connection.query(
        'CALL CategoryUpdate(?, ?, ?, ?, @result); SELECT @result;', 
        [id, req.body.name, req.body.slug, imagePath],
        (err, results) => {
            if (err) {
                return res.status(500).json({
                    status: false,
                    message: 'Internal Server Error',
                    error: err
                });
            }

            const procedureResult = results[1][0]['@result'];
            if (procedureResult === 'Update successful') {
                res.status(200).json({
                    status: true,
                    message: procedureResult
                });
            } else {
                res.status(400).json({
                    status: false,
                    message: procedureResult
                });
            }
        }
    );
});


// Route untuk menghapus kategori berdasarkan ID
router.delete('/delete/:id', (req, res) => {
    const id = req.params.id;
    connection.query(
        'CALL CategoryDelete(?, @result); SELECT @result;',
        [id],
        (err, results) => {
            if (err) {
                return res.status(500).json({
                    status: false,
                    message: 'Internal Server Error',
                    error: err
                });
            }

            const procedureResult = results[1][0]['@result'];
            if (procedureResult === 'Delete successful') {
                res.status(200).json({
                    status: true,
                    message: procedureResult
                });
            } else {
                res.status(404).json({
                    status: false,
                    message: procedureResult
                });
            }
        }
    );
});

module.exports = router;
