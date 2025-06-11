import { Box } from "@adminjs/design-system";

const ShowImage = (props) => {
  const { record } = props;
  const srcUrl = record.params.image || record.params.thumbnail;

  if (!srcUrl) {
    return null;
  }

  return (
    <Box>
      <img
        src={srcUrl}
        alt={record.params.name || "Image"}
        style={{
          maxWidth: "100%",
          maxHeight: "300px",
          objectFit: "contain",
        }}
      />
    </Box>
  );
};

export default ShowImage;
