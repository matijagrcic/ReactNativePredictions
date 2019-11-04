import React from 'react';
import { Text, Button, SafeAreaView, Image, StyleSheet } from 'react-native';
import * as Permissions from 'expo-permissions';
import { Camera } from 'expo-camera';
import { Predictions } from 'aws-amplify'
import Constants from 'expo-constants';
import * as ImagePicker from 'expo-image-picker';


export default class IdentifyScreen extends React.Component {
  state = {
    hasCameraPermission: null,
    type: Camera.Constants.Type.back,
    image: null
  };

  identify = async() => {
    const blob = await new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest()
      xhr.onload = function() {
        resolve(xhr.response)
      }
      xhr.onerror = function(e) {
        console.log(e)
        reject(new TypeError('Network request failed'))
      }
      xhr.responseType = 'blob'
      xhr.open('GET', this.state.image, true)
      xhr.send(null)
    })
    Predictions.identify({
      labels: {
        source: {
          file: blob
        },
        type: "ALL"
      }
    }).then(result => {
      console.log('result: ', result)
    })
      .catch(err => {
        console.log('error: ', err)
      })
  }

  async componentDidMount() {
    const { status } = await Permissions.askAsync(Permissions.CAMERA);
    this.setState({ hasCameraPermission: status === 'granted' });
    this.getPermissionAsync();
  }

  snap = async () => {
    if (this.camera) {
      let photo = await this.camera.takePictureAsync();
      console.log('photo: ', photo)
      this.setState({ image: photo })
      await this.identify()
    }
  };

  getPermissionAsync = async () => {
    if (Constants.platform.ios) {
      const { status } = await Permissions.askAsync(Permissions.CAMERA_ROLL);
      if (status !== 'granted') {
        alert('Sorry, we need camera roll permissions to make this work!');
      }
    }
  }

  _pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: true,
      aspect: [4, 3],
    });

    console.log(result);

    if (!result.cancelled) {
      this.setState({ image: result.uri });
      await this.identify()
    }
  };

  render() {
    const { hasCameraPermission, image } = this.state;
    if (hasCameraPermission === null) {
      return <SafeAreaView />;
    } else if (hasCameraPermission === false) {
      return <Text>No access to camera</Text>;
    } else {
      return (
        <SafeAreaView style={styles.container}>
          <Button title="Take a Photo" onPress={this._pickImage}></Button>
          {image &&
          <Image source={{ uri: image }} style={{ width: 300, height: 300 }} />}
        </SafeAreaView>
      );
    }
  }
}

IdentifyScreen.navigationOptions = {
  title: 'Identify',
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
