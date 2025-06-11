import React, { useState } from "react";
import { Box, Label, DropZone, Button } from "@adminjs/design-system";

const UploadImage = (props) => {
  const { property, onChange, record } = props;
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(record?.params[property.name] || null);

  const handleDropZoneChange = (files) => {
    if (files && files.length > 0) {
      const file = files[0];
      setFile(file);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(file);

      // Trigger onChange to save the file
      onChange(property.name, file);
    }
  };

  return (
    <Box>
      <Label>{property.label}</Label>
      <DropZone onChange={handleDropZoneChange} />
      {preview && (
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
        </Box>
      )}
      {preview && (
        <Box mt="lg">
          <Button
            onClick={() => {
              setFile(null);
              setPreview(null);
              onChange(property.name, null);
            }}
          >
            Remove Image
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default UploadImage;
