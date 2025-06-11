import React, { useState } from "react";
import {
  Box,
  Label,
  DropZone,
  Button,
  Loader,
  MessageBox,
} from "@adminjs/design-system";
import axios from "axios";

const UploadImage = (props) => {
  const { property, onChange, record } = props;
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [preview, setPreview] = useState(record?.params[property.name] || null);

  const handleDropZoneChange = async (files) => {
    if (files && files.length > 0) {
      const file = files[0];
      setFile(file);
      setLoading(true);
      setError(null);

      try {
        // Create FormData
        const formData = new FormData();
        formData.append("file", file);

        // Upload to your backend endpoint that handles Cloudinary upload
        const response = await axios.post("/api/upload/image", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
          withCredentials: true,
        });

        // Get the Cloudinary URL from response
        const imageUrl = response.data.url;
        setPreview(imageUrl);

        // Trigger onChange to save the Cloudinary URL
        onChange(property.name, imageUrl);
      } catch (error) {
        console.error("Error uploading image:", error);
        setError(error.response?.data?.message || "Error uploading image");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleRemove = () => {
    setFile(null);
    setPreview(null);
    setError(null);
    onChange(property.name, null);
  };

  return (
    <Box>
      <Label>{property.label}</Label>
      <DropZone onChange={handleDropZoneChange} />
      {loading && (
        <Box mt="xl">
          <Loader />
        </Box>
      )}
      {error && (
        <Box mt="xl">
          <MessageBox variant="danger">{error}</MessageBox>
        </Box>
      )}
      {preview && !loading && (
        <Box mt="xl">
          <img
            src={preview}
            alt="Preview"
            style={{
              maxWidth: "100%",
              maxHeight: "200px",
              objectFit: "contain",
            }}
          />
          <Box mt="lg">
            <Button onClick={handleRemove} variant="danger">
              Remove Image
            </Button>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default UploadImage;
