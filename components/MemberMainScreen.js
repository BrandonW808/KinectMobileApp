import React, { Component, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, Image, Button, TouchableOpacity, Picker, Alert} from 'react-native';
import * as Device from 'expo-device';
import axios from "axios";

import * as Permissions from "expo-permissions";

const preKey = require('../prekey.js');

const LEFT_KEY = preKey + ':left';
const MEMBER_KEY = preKey + ":member";
const URL_KEY = preKey + ":url";

const CancelToken = axios.CancelToken;
//const PublicCancelToken = axios.CancelToken;
const Source = CancelToken.source();
//const publicSource = PublicCancelToken.source();

export default class MemberMainScreen extends Component {
  constructor(props){
    super(props);

    this.state = {
      email: "",
      password: "",
      loading: false,
      unlocked: false,
      error: false,
      mounted: false,
      mounted: false,
      gymSelected: this.props.member.registeredGyms[0],
      coords: {
        maxLat: undefined,
        minLat: undefined,
        maxLong: undefined,
        minLong: undefined,
      },
      membersPresent: undefined,
    }

    this.openDoor = this.openDoor.bind(this);
    this.openDoorWithIP = this.openDoorWithIP.bind(this);
    this.waitForClose = this.waitForClose.bind(this);
    this.selectGym = this.selectGym.bind(this);
    this.listGyms = this.listGyms.bind(this);
    this.logout = this.logout.bind(this);

  }

  componentDidMount(){
    this.setState({mounted: true});
    for (let i=0; i<this.props.member.registeredGyms.length; i++){
      if (this.props.member.registeredGyms[i]._id == this.props.member.registeredgym){
        this.selectGym(this.props.member.registeredGyms[i]);
      }
    }
    console.log("Selected: " + JSON.stringify(this.state.gymSelected));
    let url = this.props.url + "/door/getPresent/" + this.props.member.businessDB + "/" + this.state.gymSelected._id;
    console.log("URL: " + url);
    axios.get(url).then((data) => {
      (this.state.mounted) && this.setState({membersPresent: data.data.present});
    }).catch((err) => {
      console.log(err);
    });

  }

  selectGym(gym){
    CancelToken.source().cancel("Aborted");
    (this.state.mounted) && this.setState({loading: false});
    (this.state.mounted) && this.setState({gymSelected: gym});
  }

  logout(){
    this.props.memberHandler(undefined);
  }

  waitForClose(url){
    (this.state.mounted) && this.setState({error: false});
    url = url + "/door/notifyOnClose"
    axios.get(url, {}, {
      cancelToken: Source.token,
    }).then((data) => {
      if (data.data == "closed"){
        (this.state.mounted) && this.setState({loading: false});
        (this.state.mounted) && this.setState({unlocked: false});
      }
      this.render();
    }).catch((err) => {
        (this.state.mounted) && this.setState({loading: false});
        (this.state.mounted) && this.setState({unlocked: false});
    });
  }

  async openDoorWithIP(url){
    var CryptoJS = require("react-native-crypto-js");
    let mobilePass = CryptoJS.AES.encrypt(this.props.member.mobilePass, this.props.member.salt).toString();

    url = url + "/door/openDoor";
    console.log("Unlocking: " + url);

    axios.post(url, {
      email: this.props.member.email.toLowerCase(),
      mobilePass: mobilePass,
      gymName: this.state.gymSelected.name,
      uid: Device.deviceName,
    },{
      timeout: 15000,
      cancelToken: Source.token,
    }).then(async (data) => {
      (this.state.mounted) && this.setState({loading: false});
      if (data.data.status == "open"){
        (this.state.mounted) && this.setState({unlocked: true});
        (this.state.mounted) && this.setState({error: false});
      }
      this.render();

      this.waitForClose(this.state.gymSelected.localip);


    }).catch((err) => {
      console.log(err);
      this.setState({loading: false});
      if (err.message != "Network Error"){
        (this.state.mounted) && this.setState({error: "Unable to reach door!"});
      }
      if (err.message == "Request failed with status code 409"){
        (this.state.mounted) && this.setState({error: "You do not have access to this door!"});
      }
      if (err.message == "Request failed with status code 401"){
        (this.state.mounted) && this.setState({error: "Error, try logging out and in again"});
      }
      if (err.message == "Request failed with status code 488"){
        (this.state.mounted) && this.setState({error: err.response.data});
      }
      this.render();
    })
  }

  openDoor(){
    (this.state.mounted) && this.setState({loading: true}, function(){
      this.openDoorWithIP(this.state.gymSelected.localip);
    });
  }

  listGyms(){
    if (this.props.member.registeredGyms != undefined){
      return this.props.member.registeredGyms.map((gym) => {
        return (
          <Picker.Item key={gym.name} label={gym.name} value={gym} />
        );
      });
    }else{
      return (<p></p>);
    }
  }

  render(){
    let source = (this.state.unlocked) ? require('./../assets/unlocked.png') : require('./../assets/locked.png');
    let loading = require('./../assets/loading.gif');
    let gyms;
    if (this.props.member.registeredGyms != undefined){
      gyms = this.listGyms();
    }else{
      return(<Picker.Item label={"Couldn't find gyms!"} value="gym.name" />)
    }
    let buttonEnabled = !this.state.loading && !this.state.unlocked;

    return (
      <View style={styles.parent}>
        <Picker
            style={styles.picker}
            selectedValue={this.state.gymSelected}
            onValueChange={(itemValue, itemIndex) => this.selectGym(itemValue)}
          >
          {gyms}
          </Picker>

          {this.state.membersPresent != undefined && <View style={styles.container}>
            <Text style={styles.numberText}>{this.state.membersPresent}</Text>
            <Text>Member{this.state.membersPresent != 1 ? 's' : ''} Present</Text>
          </View>}
        <View style={styles.container}>

        {this.state.loading &&
          <TouchableOpacity style={styles.button} disabled={true}>
            <Image source={loading}
            style={{
              height: 200,
              width: 200,
            }}/>
          </TouchableOpacity>}
          {!this.state.loading &&
            <TouchableOpacity style={styles.button} disabled={(this.state.loading || this.state.unlocked)} onLongPress={this.openDoor} onPress={this.openDoor}>
            <Image source={source}
            style={{
              height: 200,
              width: 200,
            }}/>
          </TouchableOpacity>}
          <View style={styles.container}>
            {this.state.error && <Text>{this.state.error}</Text>}
          </View>
        </View>
        <View style={styles.parent}>
          <Button
            containerStyle={styles.button}
              onPress={this.logout}
              title="Log Out"
              color="#BC313A"
              raised="true"
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
  }
});
