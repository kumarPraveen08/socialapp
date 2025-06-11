import React from "react";
import { Box } from "@adminjs/design-system";

const ShowImage = (props) => {
  const { record } = props;
  const srcValue = record.params[props.property.name];

  if (!srcValue) {
    return null;
  }

  return (
    <Box>
      <img
        src={srcValue}
        alt={props.property.name}
        style={{ maxWidth: "100%", maxHeight: "200px", objectFit: "contain" }}
      />
    </Box>
  );
};

export default ShowImage;
