import React, {useState, useEffect, useRef, useCallback} from 'react';
import {View, StyleSheet, Dimensions} from 'react-native';
import {IconButton, useTheme} from 'react-native-paper';
import {useRoute} from '@react-navigation/native';
import {useNavigation} from '@react-navigation/native';
import {RTCView, mediaDevices, RTCPeerConnection} from 'react-native-webrtc';

// STUN servers configuration
const configuration = {
  iceServers: [
    {
      urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302'],
    },
  ],
};

const Call = () => {
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const {type, modalId} = useRoute().params;
  const navigation = useNavigation();
  const theme = useTheme();

  const peerConnection = useRef(null);

  const endCall = useCallback(() => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }
    if (peerConnection.current) {
      peerConnection.current.close();
    }
    // Notify the remote peer that the call has ended
    // socket.emit('end-call', { modalId });
    navigation.goBack();
  }, [localStream, navigation]);

  useEffect(() => {
    let mounted = true;

    // Initialize WebRTC
    const initializeWebRTC = async () => {
      try {
        // Create peer connection
        peerConnection.current = new RTCPeerConnection(configuration);

        // Request camera and microphone permissions
        const stream = await mediaDevices.getUserMedia({
          audio: true,
          video:
            type === 'video'
              ? {
                  facingMode: 'user',
                }
              : false,
        });

        if (!mounted) return;
        setLocalStream(stream);

        // Add local stream to peer connection
        stream.getTracks().forEach(track => {
          if (peerConnection.current && stream) {
            peerConnection.current.addTrack(track, stream);
          }
        });

        // Handle remote stream
        peerConnection.current.ontrack = event => {
          if (mounted) {
            setRemoteStream(event.streams[0]);
          }
        };

        // Handle ICE candidates
        peerConnection.current.onicecandidate = event => {
          if (event.candidate) {
            // Send the candidate to the remote peer via your signaling server
            // socket.emit('ice-candidate', { candidate: event.candidate, modalId });
          }
        };

        // Handle connection state changes
        peerConnection.current.onconnectionstatechange = () => {
          if (peerConnection.current?.connectionState === 'disconnected') {
            endCall();
          }
        };

        // Create and send offer if initiating the call
        const offer = await peerConnection.current.createOffer({
          offerToReceiveAudio: true,
          offerToReceiveVideo: type === 'video',
        });
        await peerConnection.current.setLocalDescription(offer);

        // Send the offer to the remote peer via your signaling server
        // socket.emit('call-offer', { offer, modalId });
      } catch (err) {
        console.error('Error initializing WebRTC:', err);
        if (mounted) {
          navigation.goBack();
        }
      }
    };

    initializeWebRTC();

    // Cleanup function
    return () => {
      mounted = false;
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
      if (peerConnection.current) {
        peerConnection.current.close();
      }
    };
  }, [type, modalId, navigation, endCall]);

  const toggleMute = () => {
    if (localStream) {
      const audioTracks = localStream.getAudioTracks();
      audioTracks.forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsMuted(!isMuted);
    }
  };

  const toggleCamera = () => {
    if (localStream) {
      const videoTracks = localStream.getVideoTracks();
      videoTracks.forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsCameraOff(!isCameraOff);
    }
  };

  return (
    <View style={styles.container}>
      {/* Local Stream */}
      {localStream && (
        <RTCView
          streamURL={localStream.toURL()}
          style={styles.localStream}
          objectFit="cover"
        />
      )}

      {/* Remote Stream */}
      {remoteStream && (
        <RTCView
          streamURL={remoteStream.toURL()}
          style={styles.remoteStream}
          objectFit="cover"
        />
      )}

      {/* Call Controls */}
      <View style={styles.controls}>
        <IconButton
          icon={isMuted ? 'microphone-off' : 'microphone'}
          size={30}
          iconColor={theme.colors.primary}
          onPress={toggleMute}
          style={styles.controlButton}
        />
        <IconButton
          icon="phone-hangup"
          size={30}
          iconColor={theme.colors.error}
          onPress={endCall}
          style={[styles.controlButton, styles.endCallButton]}
        />
        {type === 'video' && (
          <IconButton
            icon={isCameraOff ? 'camera-off' : 'camera'}
            size={30}
            iconColor={theme.colors.primary}
            onPress={toggleCamera}
            style={styles.controlButton}
          />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  localStream: {
    position: 'absolute',
    top: 20,
    right: 20,
    width: Dimensions.get('window').width / 3,
    height: Dimensions.get('window').width / 4,
    backgroundColor: '#444',
    borderRadius: 10,
  },
  remoteStream: {
    flex: 1,
  },
  controls: {
    position: 'absolute',
    bottom: 30,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  controlButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    margin: 10,
  },
  endCallButton: {
    backgroundColor: 'rgba(255, 0, 0, 0.3)',
  },
});

export default Call;
