import React, {useState, useEffect} from 'react';
import {View, FlatList, StyleSheet} from 'react-native';
import {Card, Title, Paragraph, Button, useTheme} from 'react-native-paper';
import {useNavigation} from '@react-navigation/native';

import {ROUTES} from '@navigation/types';

const Home = () => {
  const [modals, setModals] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation();
  const theme = useTheme();

  useEffect(() => {
    fetchModals();
  }, []);

  const fetchModals = async () => {
    try {
      // TODO: Replace with actual API call
      const response = await fetch('API_URL/modals');
      const data = await response.json();
      setModals(data);
    } catch (error) {
      console.error('Error fetching modals:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartChat = modalId => {
    navigation.navigate(ROUTES.CHAT, {modalId});
  };

  const handleStartCall = (modalId, type) => {
    navigation.navigate(ROUTES.CALL, {modalId, type});
  };

  const renderModal = ({item}) => (
    <Card style={styles.card}>
      <Card.Cover source={{uri: item.profileImage}} />
      <Card.Content>
        <Title>{item.name}</Title>
        <Paragraph>{item.bio}</Paragraph>
        <View style={styles.tags}>
          {item.categories.map((category, index) => (
            <Button
              key={index}
              mode="outlined"
              compact
              style={styles.tag}
              textColor={theme.colors.primary}>
              {category}
            </Button>
          ))}
        </View>
      </Card.Content>
      <Card.Actions style={styles.actions}>
        <Button
          mode="contained"
          onPress={() => handleStartChat(item.id)}
          icon="chat">
          Chat
        </Button>
        <Button
          mode="contained"
          onPress={() => handleStartCall(item.id, 'video')}
          icon="video">
          Video Call
        </Button>
        <Button
          mode="contained"
          onPress={() => handleStartCall(item.id, 'audio')}
          icon="phone">
          Voice Call
        </Button>
      </Card.Actions>
    </Card>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={modals}
        renderItem={renderModal}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        refreshing={loading}
        onRefresh={fetchModals}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  list: {
    padding: 16,
  },
  card: {
    marginBottom: 16,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  tag: {
    marginRight: 8,
    marginTop: 8,
  },
  actions: {
    justifyContent: 'space-around',
    paddingVertical: 8,
  },
});

export default Home;
