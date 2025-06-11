import React from "react";
import { Box, H2, Text } from "@adminjs/design-system";

const Dashboard = () => {
  return (
    <Box variant="grey">
      <Box variant="white" padding="xl">
        <H2>Welcome to Dating App Admin Panel</H2>
        <Text>
          This is the admin panel for the Dating App. Created by Praveen
          Prajapati with ❤️ in India.
        </Text>
      </Box>
    </Box>
  );
};

export default Dashboard;
