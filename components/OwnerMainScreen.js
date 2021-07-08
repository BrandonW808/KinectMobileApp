import React, { Component } from 'react';
import { StyleSheet, Vibration, Text, View, TextInput, Image, Button, TouchableOpacity, Picker } from 'react-native';
import axios from "axios";

const LocalCancelToken = axios.CancelToken;
const PublicCancelToken = axios.CancelToken;
const localSource = LocalCancelToken.source();
const publicSource = PublicCancelToken.source();

export default class OwnerMainScreen extends Component {
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

    this.openDoor = this.openDoor.bind(this);
    this.openDoorWithIP = this.openDoorWithIP.bind(this);
    this.waitForClose = this.waitForClose.bind(this);
    this.selectGym = this.selectGym.bind(this);
    this.listGyms = this.listGyms.bind(this);
    this.logout = this.logout.bind(this);

  }

  componentDidMount(){
    this.setState({mounted: true});
    this.selectGym(this.props.owner.registeredGyms[0]);

    let url = this.props.url + "/door/getPresent/" + this.props.owner.businessDB + "/" + this.state.gymSelected._id;
    axios.get(url).then((data) => {
      (this.state.mounted) && this.setState({membersPresent: data.data.present});
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

  waitForClose(url, type){
    this.setState({error: false});

    url =  url + "/door/notifyOnClose/";
    axios.get(url, {
      timeout: 10000,
      cancelToken: (type == "public") ? publicSource.token : localSource.token,
    }).then((data) => {
      if(type == "public"){
        LocalCancelToken.source().cancel("On public connection");
      }else if (type == "local"){
        PublicCancelToken.source().cancel("On local connection");
      }
      if (data.data == "closed"){
        this.setState({loading: false});
        this.setState({unlocked: false});
      }
      this.render();
    }).catch((err) => {
      if (err){
        console.log("Error from waitForClose()\n" + err);
      }
    });
  }

  openDoorWithIP(url, type){
    this.render();
    var CryptoJS = require("react-native-crypto-js");
    let mobilePass = CryptoJS.AES.encrypt(this.props.owner.mobilePass, this.props.owner.salt).toString();
    let password = CryptoJS.AES.encrypt(this.props.owner.password, this.props.owner.salt).toString();

    url = url + "/door/staffOpenDoor";
    axios.post(url, {
      email: this.props.owner.email.toLowerCase(),
      mobilePass: mobilePass,
      gym: this.state.gymSelected._id,
    },{
      timeout: 10000,
      cancelToken: (type == "public") ? publicSource.token : localSource.token
    }).then((data) => {
      if (data.data == "open"){
        this.setState({loading: false});
        this.setState({unlocked: true});
      }
      if(type == "public"){
        LocalCancelToken.source().cancel("On public connection");
      }else if (type == "local"){
        PublicCancelToken.source().cancel("On local connection");
      }
      this.render();
      this.waitForClose(this.state.gymSelected.localip, "local");
      this.waitForClose(this.state.gymSelected.publicip, "public");

    }).catch((err) => {
      console.log("ERR: " + err);
      this.setState({unlocked: false});
      this.setState({loading: false});
      if (err.message != "Network Error"){
        this.render();
      }
      if (err.message == "Request failed with status code 409"){
        this.setState({error: "You do not have access to this door!"});
      }
      this.render();
    })
  }

  openDoor(){
    (this.state.mounted) && this.setState({loading: true}, function(){
        this.openDoorWithIP(this.state.gymSelected.localip, "local");
        this.openDoorWithIP(this.state.gymSelected.publicip, "public");
    });
  }

  listGyms(){
    return this.props.owner.registeredGyms.map((gym) => {
      return (
        <Picker.Item key={gym.name} label={gym.name} value={gym} />
      );
    });
  }

  render(){
    let source;
    let loading = require('./../assets/loading.gif');
    if(this.state.unlocked){
      source = require('./../assets/unlocked.png')
    }else{
      source = require('./../assets/locked.png')
    }

    let gyms;
    if (this.props.owner.registeredGyms != undefined){
      gyms = this.listGyms();
    }else{
      return(<Picker.Item label={"Couldn't find gyms!"} value="gym.name" />)
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
            {this.state.membersPresent != undefined && <View style={styles.container}>
              <Text style={styles.numberText}>{this.state.membersPresent}</Text>
              <Text>Member{this.state.membersPresent != 1 ? 's' : ''} Present</Text>
            </View>}
          <View style={styles.container}>
            {(this.state.gymSelected.localip != undefined && this.state.gymSelected.publicip != undefined && !this.state.loading) &&
              <TouchableOpacity style={styles.button} onPress={this.openDoor}>
                <Image source={source}
                style={{
                  height: 200,
                  width: 200,
                }}/>
              </TouchableOpacity>}

              {this.state.loading &&
                <TouchableOpacity style={styles.button} onPress={this.openDoor}>
                  <Image source={loading}
                  style={{
                    height: 200,
                    width: 200,
                  }}/>
                </TouchableOpacity>}
            {(this.state.gymSelected.localip == undefined || this.state.gymSelected.publicip == undefined) &&
              <View style={styles.parent}>
                <Text>
                  Cannot access door system!
                </Text>
                <Text>
                  Do you have the IP set?
                </Text>
              </View>
            }

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
  },
});
