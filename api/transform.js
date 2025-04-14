require('dotenv').config(); // Add this at the top of the file

const { create } = require('multer');
const axios = require('axios');

const upload = create({ storage: create.memoryStorage() }).single('image');

module.exports = async (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      return res.status(500).json({ error: 'File upload failed' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No image uploaded' });
    }

    try {
      const imageBase64 = req.file.buffer.toString('base64');

      const apiResponse = await axios.post(
        'https://api-inference.huggingface.co/models/runwayml/stable-diffusion-v1-5',
        {
          inputs: `data:image/jpeg;base64,${imageBase64}`,
          parameters: { prompt: 'transform into Wojak cartoon style' },
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const transformedImage = apiResponse.data.image || apiResponse.data;
      const imageUrl = transformedImage.startsWith('data:image')
        ? transformedImage
        : `data:image/jpeg;base64,${transformedImage}`;

      res.status(200).json({ imageUrl });
    } catch (error) {
      console.error(error.message);
      res.status(500).json({ error: 'Image transformation failed' });
    }
  });
};