import React, { Component, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, Image, Button, TouchableOpacity, Alert, Picker} from 'react-native';
import * as Device from 'expo-device';
import axios from "axios";
import SelectDropdown from 'react-native-select-dropdown'
import { Icon } from 'react-native-elements';
import { NativeModules, Platform } from 'react-native';
import { Dictionary } from '../../dictionary.js';
import { Languages } from '../../enums.js';
const { RNLocalNetworkPermission } = NativeModules;
const DEFAULT_TIMEOUT_WAITING_FOR_LOCAL_NETWORK_CHECKING = 1;

const mode = require('../../mode.js');

const preKey = require('../../prekey.js');

const CancelToken = axios.CancelToken;
const Source = CancelToken.source();

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
      localNetworkAccess: undefined,
    }

    this.openDoor = this.openDoor.bind(this);
    this.openDoorWithIP = this.openDoorWithIP.bind(this);
    this.waitForClose = this.waitForClose.bind(this);
    this.selectGym = this.selectGym.bind(this);
    this.listGyms = this.listGyms.bind(this);
    this.logout = this.logout.bind(this);
    this.updatePresent = this.updatePresent.bind(this);
    this.renderDropdownIcon = this.renderDropdownIcon.bind(this);

  }

  componentDidMount(){
    this.setState({mounted: true});
    for (let i=0; i<this.props.member.registeredGyms.length; i++){
      if (this.props.member.registeredGyms[i]._id == this.props.member.registeredgym){
        this.selectGym(this.props.member.registeredGyms[i]);
      }
    }
    let url = this.props.url + "/door/getPresent/" + this.props.member.businessDB + "/" + this.state.gymSelected._id;
    axios.get(url).then((data) => {
      (this.state.mounted) && this.setState({membersPresent: data.data.present});
    }).catch((err) => {
      console.log(err);
    });
    this.checkLocalNetworkAccess().then((data) => {
      this.setState({localNetworkAccess: data});
    }).catch((err) => {
      this.setState({localNetworkAccess: err});
    });

  }

  checkLocalNetworkAccess = (timeoutSeconds) => {
    if (Platform.OS === 'ios' && RNLocalNetworkPermission) {
      return RNLocalNetworkPermission.check(
        timeoutSeconds ?? DEFAULT_TIMEOUT_WAITING_FOR_LOCAL_NETWORK_CHECKING,
      );
    }
  
    return Promise.resolve(true);
  };

  requestLocalNetworkAccess = () => {
    return this.checkLocalNetworkAccess()
      .then(() => {
        this.setState({localNetworkAccess: true});
        Promise.resolve()
      })
      .catch((error) => {
        // eslint-disable-next-line no-console
        this.setState({localNetworkAccess: error});
        console.warn(`requestLocalNetworkAccess ${JSON.stringify(error)}`);
      });
  };

  renderDropdownIcon(){
    return (
      <Icon
        name='expand-more'
        color='#BC313A' />
    )
  }

  updatePresent(){
    let url = this.props.url + "/door/getPresent/" + this.props.member.businessDB + "/" + this.state.gymSelected._id;
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
    this.updatePresent();
  }

  logout(){
    this.props.memberHandler(undefined);
  }

  waitForClose(url){
    (this.state.mounted) && this.setState({error: false});
    url = url + "/door/notifyOnClose";
    if (url.includes("247kinect") || url.includes("192.168.2.10")) {
      url += "/" + this.state.gymSelected._id;
    };
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
    const lang = this.props.lang || Languages.English;
    let kinectURL = (mode == 0 ? "https://247kinect.ca" : "http://192.168.2.10:6902");
    await this.checkLocalNetworkAccess().then((data) => {
      this.setState({localNetworkAccess: data});
      this.render();
      if (!data){
        this.requestLocalNetworkAccess().then((data) => {
          this.openDoorWithIP(url);
        }).catch((err) => {
          this.setState({error: "Your device must use the local network to reach the door."})
        })
      }else{
        axios({
          method: 'post',
          url: (url + "/door/openDoor"),
          timeout: 5000,
          data: {
            email: this.props.member.email.toLowerCase(),
            mobilePass: mobilePass,
            gymID: this.state.gymSelected._id,
            uid: Device.deviceName,
            businessDB: this.state.gymSelected.businessDB,
            lang: lang,
          }
        }).then(async (data) => {
          console.log("Data: " + JSON.stringify(data.data));
          (this.state.mounted) && this.setState({loading: false});
          if (data.data.status == "open"){
            (this.state.mounted) && this.setState({unlocked: true});
            (this.state.mounted) && this.setState({error: false});
          }
          this.render();
          this.waitForClose(url);
    
        }).catch((err) => {
          axios.post((kinectURL + "/members/notifyAdmins"), {
            subject: (this.props.member.email + " Member Access Issue"),
            data: {
              email: this.props.member.email.toLowerCase(),
              mobilePass: mobilePass,
              gym: this.state.gymSelected._id,
              uid: Device.deviceName,
              businessDB: this.state.gymSelected.businessDB,
              error: err,
              errMessage: (err.message == "Request failed with status code 488") ? err.response.data : "",
              os: Platform.OS,
              localNetworkAccess: this.state.localNetworkAccess

            },
            cancelToken: Source.token,
          }).catch((err) => {
            console.log("Error in notifying admins: " + err);
          });
          (this.state.mounted) && this.setState({loading: false});
            if (err.message == "Network Error"){
              axios.post((kinectURL + "/members/notifyAdmins"), {
                businessDB: this.state.gymSelected.businessDB,
                gymID: this.state.gymSelected._id,
              }).then((data) => {
                (this.state.mounted) && this.setState({error: Dictionary.UnableToReachDoor[lang]});
              }).catch((err) => {
                if (err.message == "Request failed with status code 488"){
                  this.setState({error: Dictionary.NotOnFacilityWifi[lang]})
                }else{
                  (this.state.mounted) && this.setState({error: Dictionary.UnableToReachDoor[lang]});
                }
              })
            }else if (err.message == "Request failed with status code 409"){
              (this.state.mounted) && this.setState({error: Dictionary.NoAccessToDoor[lang]});
            }else if (err.message == "Request failed with status code 401"){
              (this.state.mounted) && this.setState({error: Dictionary.LogOutAndIn[lang]});
            }else if (err.message == "Request failed with status code 488"){
              if (err.response.data == Dictionary.MobilePassNotFound[lang] || err.response.data === Dictionary.InvalidMobilePass[lang]){
                this.props.memberHandler(undefined);
              }else{
                (this.state.mounted) && this.setState({error: err.response.data});
              }
            }else{
              (this.state.mounted) && this.setState({error: Dictionary.UnknownError[lang]})
            }
          this.render();
        })
      }
    }).catch((err) => {
      this.setState({localNetworkAccess: err});
      this.render();
      this.requestLocalNetworkAccess().then((data) => {
        this.openDoorWithIP(url);
      }).catch((err) => {
        this.setState({error: "Your device must use the local network to reach the door."})
      })
    });
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
    const lang = this.props.lang || Languages.English;
    let source = (this.state.unlocked) ? require('../../assets/unlocked.png') : require('../../assets/locked.png');
    let loading = require('../../assets/loading.gif');
    let gyms;
    if (this.props.member.registeredGyms != undefined){
      gyms = this.listGyms();
    }else{
      return(<Picker.Item label={"Couldn't find gyms!"} value="gym.name" />)
    }
    let buttonEnabled = !this.state.loading && !this.state.unlocked;

    return (
      <View style={styles.parent}>
          <SelectDropdown
            data={this.props.member.registeredGyms}
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
        <View style={styles.logout}>
          <Button
            containerStyle={styles.button}
              onPress={this.logout}
              title={Dictionary.LogoutText[this.props.lang]}
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
    height: 30,
    width: 300,
    alignItems: 'center',
  },
  button: {
    marginTop: 15,
    borderRadius: 4,
    alignItems: 'center',
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
  container: {
    width: 400,
    alignItems: 'center',
  },
  numberText: {
    fontSize: 30,
    alignItems: 'center',
  }
});
