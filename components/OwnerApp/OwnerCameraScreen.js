import React, { Component } from 'react';
import { StyleSheet, Text, View, Picker } from 'react-native';
import axios from "axios";
import CameraFeed from './Components/CameraFeed.js';

const LocalCancelToken = axios.CancelToken;
const PublicCancelToken = axios.CancelToken;
const localSource = LocalCancelToken.source();
const publicSource = PublicCancelToken.source();

export default class OwnerCameraScreen extends Component {
  constructor(props){
    super(props);
    this.state = {
      email: "",
      password: "",
      loading: false,
      unlocked: false,
      error: false,
      gymSelected: this.props.owner.registeredGyms[0],
    }

    this.selectGym = this.selectGym.bind(this);
    this.listGyms = this.listGyms.bind(this);
    this.logout = this.logout.bind(this);

  }

  componentDidMount(){
    this.selectGym(this.props.owner.registeredGyms[0]);
    if (this.props.owner.session != undefined){
      this.setState({mounted: true});
      console.log("Selected Gym: " + JSON.stringify(this.state.gymSelected));
      let url = this.props.url + '/cameras/getCamerasForGym/' + this.props.owner.session.token + "/" + this.props.owner.session.businessDB + "/" + this.state.gymSelected._id;
        axios.get(url).then((data) => {
          console.log("Got cameras: " + JSON.stringify(data.data));
          this.setState({cameras: data.data});
        }).catch((err) => {
          this.setState({erro: err});
        })
    }else{
      this.props.ownerHandler(null);
    }
  }

  selectGym(gym){
    this.setState({gymSelected: gym});
    this.render();
  }

  logout(){
    this.props.ownerHandler(undefined);
  }

  listGyms(){
    return this.props.owner.registeredGyms.map((gym) => {
      return (
        <Picker.Item key={gym.name} label={gym.name} value={gym} />
      );
    });
  }

  render(){
    let gyms;
    if (this.props.owner.registeredGyms != undefined){
      gyms = this.listGyms();
    }else{
      return(<Picker.Item label={"Couldn't find gyms!"} value="gym.name" />)
    }

    let cameras;
    if (this.state.cameras != undefined){
      cameras = this.state.cameras.map((camera, i) => {
        console.log("Viewing Camera: " + camera._id);
        camera.viewing = true;
        if (camera.viewing){
          return (<CameraFeed key={camera._id} index={i} url={this.props.url} owner={this.props.owner} camera={camera} gym={this.state.gym} feedLaunched={this.state.feedLaunched}/>);
        }
      })
    }

    return (
      <View>
      {(this.props.owner.registeredGyms.length > 0) &&
        <View style={styles.parent}>
          <Picker
            style={styles.picker}
            selectedValue={this.state.gymSelected}
            onValueChange={(itemValue, itemIndex) => this.selectGym(itemValue)}
          >
            {gyms}
          </Picker>

          <View style={styles.container}>
            {cameras}
          </View>
          <View style={styles.container}>
            {this.state.error && <Text>{this.state.error}</Text>}
          </View>
        </View>
      }
      {(this.props.owner.registeredGyms.length == 0) &&
        <View style={styles.parent}>
          <Text>
            Add a gym to get started!
          </Text>
        </View>
      }
      </View>
    );
  }
}

const styles = StyleSheet.create({
  parent: {
    marginLeft: 10,
    marginRight: 10,
    alignItems: 'center',
  },
  picker: {
    height: 30,
    width: 300,
    alignItems: 'center',
  },
  button: {
    marginTop: 15,
    borderRadius: 4,
    alignItems: 'center',
  },
  container: {
    width: 400,
    alignItems: 'center',
  },
  numberText: {
    fontSize: 30,
    alignItems: 'center',
  },
});
