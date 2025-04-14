require('dotenv').config();
const { create } = require('multer');
const axios = require('axios');

const upload = create({ storage: create.memoryStorage() }).single('image');

module.exports = async (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      console.error('Upload error:', err.message);
      return res.status(500).json({ error: 'File upload failed' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No image uploaded' });
    }

    try {
      const formData = new FormData();
      formData.append('image', req.file.buffer, 'image.jpg');

      console.log('Sending request to DeepAI...');
      const apiResponse = await axios.post(
        'https://api.deepai.org/api/toonify',
        formData,
        {
          headers: {
            'Api-Key': process.env.DEEPAI_API_KEY,
            ...formData.getHeaders(),
          },
          timeout: 60000,
        }
      );

      console.log('DeepAI response status:', apiResponse.status);
      console.log('DeepAI response data:', apiResponse.data);

      if (apiResponse.status !== 200 || !apiResponse.data.output_url) {
        throw new Error('DeepAI API error: No output URL returned');
      }

      const imageUrl = apiResponse.data.output_url;
      res.status(200).json({ imageUrl });
    } catch (error) {
      console.error('Transformation error:', error.message);
      if (error.response) {
        console.error('DeepAI response:', error.response.data);
      }
      res.status(500).json({ error: 'Image transformation failed: ' + error.message });
    }
  });
};