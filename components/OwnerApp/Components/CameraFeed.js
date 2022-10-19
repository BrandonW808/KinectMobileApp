import React, { Component } from 'react';
import { Video } from 'expo-av';
import { StyleSheet, Vibration, Text, View, TextInput, Dimensions, Picker } from 'react-native';
import axios from "axios";

const LocalCancelToken = axios.CancelToken;
const PublicCancelToken = axios.CancelToken;
const localSource = LocalCancelToken.source();
const publicSource = PublicCancelToken.source();

export default class CameraFeed extends Component {
  constructor(props){
    super(props);
    this.state = {
      email: "",
      password: "",
      loading: false,
      unlocked: false,
      error: false,
      gymSelected: this.props.owner.registeredGyms[0],
      tsList: [],
      index: 2,
      loadedPlaylist: false,
    }

    this.getFeed = this.getFeed.bind(this);
    this.setStatus = this.setStatus.bind(this);
    this.listGyms = this.listGyms.bind(this);
    this.logout = this.logout.bind(this);

  }

  componentDidMount(){
    let ip = "http://" + this.state.gymSelected.localip.slice(6, (this.state.gymSelected.localip.length - 5)) + ":" + this.props.camera.port;
    this.setState({source: ip});
    this.setState({mounted: true});
    this.selectGym(this.props.owner.registeredGyms[0]);
    let url = (this.props.url + "/cameras/getLiveStream/" + this.props.owner.session.token + "/" + this.props.owner.session.businessDB + "/" + this.props.camera._id);
    console.log("Launching live stream: " + url);
    axios.get(url).then((data) => {
      this.getFeed();
      setInterval(this.getFeed, 5000);
    }).catch((err) => {
      console.log(err);
    });
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

  getFeed(){
    axios.get(this.state.source + "/index.m3u8").then((data) => {
      var source = data.data
      var arr  = source.split("\n");
      let tsList = this.state.tsList;
      arr = arr.filter((item)=>{
        if (item.match(/\.ts$/) && !tsList.includes((this.state.source + "/" + item))){
          console.log("Adding " + item + " to ts list");
          tsList.push((this.state.source + "/" + item));
        }
      });
      if (!this.state.loadedPlaylist){
        let index = (tsList.length > 1) ? tsList.length - 1 : 0;
        this.setState({index: tsList.length});
        this.setState({loadedPlaylist: true});
      }
      this.setState({tsList: tsList});
    }).catch((err) => {
      console.log(err);
    })
  }

  setStatus(status){
    if (status.didJustFinish){
      let index = this.state.index;
      this.setState({index: index+1});
    }
  }

  render(){
    let loading = require('../../../assets/loading.gif');
    let gyms;
    if (this.props.owner.registeredGyms != undefined){
      gyms = this.listGyms();
    }else{
      return(<Picker.Item label={"Couldn't find gyms!"} value="gym.name" />)
    }
    let videoWidth = Dimensions.get('window').width - 20;
    let videoHeight = videoWidth / 11 * 9 ;

    return (
      <View>
        <View style={styles.parent}>
          <Video
        	  source={{
              uri: (this.state.tsList != undefined) ? this.state.tsList[this.state.index] : '',
            }}
            rate={1.0}
            volume={1.0}
            shouldPlay
        	  resizeMode="cover"
        	  style={{ width: videoWidth, height: videoHeight }}
            onPlaybackStatusUpdate={this.setStatus}
        	/>
        </View>
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
  video: {
    position: 'absolute',
    top: 50,
  },
  picker: {
    height: 30,
    width: 300,
    alignItems: 'center',
  },
});
