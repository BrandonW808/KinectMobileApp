import React, { Component } from 'react';
import { StyleSheet, Vibration, Text, View, TextInput, Image, Button, TouchableOpacity, Picker } from 'react-native';
import SelectDropdown from 'react-native-select-dropdown'
import { Icon } from 'react-native-elements';
const mode = require('../../mode.js');

import axios from "axios";
import { Dictionary } from '../../dictionary.js';
import { Languages } from '../../enums.js';

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
    this.logout = this.logout.bind(this);
    this.renderDropdownIcon = this.renderDropdownIcon.bind(this);
    this.updatePresent = this.updatePresent.bind(this);

  }

  componentDidMount(){
    this.setState({mounted: true});
    this.selectGym(this.props.owner.registeredGyms[0]);

    let url = this.props.url + "/door/getPresent/" + this.props.owner.businessDB + "/" + this.state.gymSelected._id;
    axios.get(url).then((data) => {
      console.log("Present: " + JSON.stringify(data.data));
      (this.state.mounted) && this.setState({membersPresent: data.data.present});
    }).catch((err) => {
      console.log("Error getting present: " + err);
    });
  }

  updatePresent(){
    let url = this.props.url + "/door/getPresent/" + this.props.owner.businessDB + "/" + this.state.gymSelected._id;
    axios.get(url).then((data) => {
      (this.state.mounted) && this.setState({membersPresent: data.data.present});
      console.log("Setting present: " + JSON.stringify(data.data.present));
    }).catch((err) => {
      console.log("Error getting present: " + err);
    });
  }

  selectGym(gym){
    console.log("Selecting GYM: " + gym.name)
    this.setState({gymSelected: gym});
    this.updatePresent();
    this.render();
  }

  logout(){
    this.props.ownerHandler(undefined);
  }

  waitForClose(url, type){
    this.setState({error: false});

    url =  url + "/door/notifyOnClose/" + (type == "public" ? this.state.gymSelected._id : "");
    axios.get(url, {
      timeout: 5000,
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

    url = url + "/door/staffOpenDoor";
    axios.post(url, {
      email: this.props.owner.email.toLowerCase(),
      mobilePass: mobilePass,
      gym: this.state.gymSelected._id,
    },{
      timeout: 5000,
      cancelToken: (type == "public") ? publicSource.token : localSource.token
    }).then((data) => {
      this.setState({loading: false});
      if (data.data == "open"){
        this.setState({unlocked: true});
      }
      this.render();
      this.waitForClose(this.state.gymSelected.localip, "local");
      this.waitForClose((this.props.mode == 0 ? "https://247kinect.ca" : "http://localhost:6901"), "public");
    }).catch((err) => {
      this.setState({loading: false});
      this.setState({errorCount: (this.state.errorCount+1)});
      if (err.message != "Network Error"){
        this.render();
      }
      if (err.message == "Request failed with status code 409"){
        this.setState({error: "You do not have access to this door!"});
      }
      if (this.state.errorCount > 1){
        this.setState({unlocked: false});
        this.setState({loading: false});
      }
      this.render();
    })
  }

  openDoor(){
    (this.state.mounted) && this.setState({loading: true}, function(){
        this.openDoorWithIP((this.props.mode == 0 ? "https://247kinect.ca" : "http://192.168.2.10:6901"), "public");
    });
  }

  renderDropdownIcon(){
    return (
      <Icon
        name='expand-more'
        color='#BC313A' />
    )
  }

  render(){
    let source;
    let loading = require('../../assets/loading.gif');
    if(this.state.unlocked){
      source = require('../../assets/unlocked.png')
    }else{
      source = require('../../assets/locked.png')
    }

    let lang = this.props.lang || Languages.English;

    return (
      <View>
      {(this.props.owner.registeredGyms.length > 0) &&
        <View style={styles.parent}>

            <SelectDropdown
            	data={this.props.owner.registeredGyms}
              defaultValue={this.state.gymSelected}
              renderDropdownIcon={this.renderDropdownIcon}
            	onSelect={(selectedItem, index) => {
                this.selectGym(selectedItem);
            		console.log(selectedItem, index)
            	}}
              buttonStyle={styles.selectButton}
            	buttonTextAfterSelection={(selectedItem, index) => {
            		// text represented after item is selected
            		// if data array is an array of objects then return selectedItem.property to render after item is selected
            		return selectedItem.name
            	}}
            	rowTextForSelection={(item, index) => {
            		// text represented for each item in dropdown
            		// if data array is an array of objects then return item.property to represent item in dropdown
            		return item.name
            	}}
            />

            {this.state.membersPresent != undefined && <View style={styles.container}>
              <Text style={styles.numberText}>{this.state.membersPresent}</Text>
              <Text>{this.state.membersPresent != 1 ? Dictionary.MembersPresent[lang] : Dictionary.MemberPresent[lang]}</Text>
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
        <View style={styles.logout}>
          <Button
            containerStyle={styles.button}
              onPress={this.logout}
              title={Dictionary.LogoutText[lang]}
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
  logout: {
    marginLeft: 10,
    marginRight: 10,
    marginTop: 50,
    alignItems: 'center',
  },
  picker: {
    height: 50,
    width: 300,
    alignItems: 'center',
    backgroundColor: '#BC313A',
  },
  selectButton: {
    height: 50,
    width: 300,
    alignItems: 'center',
    backgroundColor: '#fff',
    borderColor: '#000',
    borderWidth: 1,
    borderRadius: 4,
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
