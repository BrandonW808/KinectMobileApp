import React, { Component } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, Image, Button } from 'react-native';
import axios from "axios";
import showhide from '../assets/showhide.png';
import * as Device from 'expo-device';

const CancelToken = axios.CancelToken;
const source = CancelToken.source();

export default class Login extends Component {
  constructor(props){
    super(props);


    this.state = {
      email: "",
      password: "",
      loading: false,
      attempted: false,
      error: false,
      mounted: false,
      showPassword: false,
    }

    this.handleEmailChange = this.handleEmailChange.bind(this);
    this.handlePasswordChange = this.handlePasswordChange.bind(this);
    this.getUser = this.getUser.bind(this);
    this.toggleShowPassword = this.toggleShowPassword.bind(this);

  }

  componentDidMount(){
    this.setState({mounted: true});
  }

  toggleShowPassword(){
    console.log("Toggling: " + !this.state.showPassword);
    this.setState({showPassword: !this.state.showPassword});
  }

  getUser(){
    (this.state.mounted) && this.setState({loading: true});
    let url = this.props.url + "/owners/getOwnerForApp";
    axios.post(url, {
      email: this.state.email.toLowerCase(),
      pass: this.state.password,
    },{
      timeout: 10000,
      cancelToken: source.token
    }).then((data) => {
      let ownerData = data.data;
      url = this.props.url + "/gyms/getGyms/" + ownerData.businessDB;
      axios.get(url, {
        ownerEmail: this.state.email.toLowerCase(),
        ownerPass: this.state.password,
      },{
        timeout: 10000,
        cancelToken: source.token
      }).then((data) => {
        let registeredGyms = [];
        for (let i=0; i<data.data.length; i++){
          let gym = {
            name: data.data[i].name,
            localip: data.data[i].localip,
            publicip: data.data[i].publicip
          }
          registeredGyms.push(gym);
        }
        ownerData['registeredGyms'] = registeredGyms;
        this.props.ownerHandler(ownerData);
      }).catch((err) => {
        console.log("Error from getUser()\n" + err);
        (this.state.mounted) && this.setState({loading: false});
        (this.state.mounted) && this.setState({attempted: true});
        (this.state.mounted) && this.setState({error: err.message});
        this.render();
      });
    }).catch((ownerErr) => {
      url = this.props.url + "/members/memberAppLogin";
      axios.post(url, {
        email: this.state.email.toLowerCase(),
        pass: this.state.password,
        uid: Device.deviceName,
      },{
        timeout: 10000,
        cancelToken: source.token
      }).then((data) => {
        this.props.memberHandler(data.data);
      }).catch((err) => {
        (this.state.mounted) &&  this.setState({loading: false});
        (this.state.mounted) &&  this.setState({attempted: true});
        this.setState({error: err.response.data});
        console.log("ERROR: " + JSON.stringify(err.response));
        this.render();
      });
    })
  }

  handleEmailChange(event){
    this.setState({email: event});
    this.render();
  }

  handlePasswordChange(event){
    this.setState({password: event});
    this.render();
  }

  render(){
    return (
      <View style={styles.container}>
        {this.state.loading &&
          <Image source={require('./../assets/loading.gif')}
          style={{
            zIndex: 998,
            height: 200,
            width: 200,
          }}/>
        }
        {!this.state.loading &&
          <View>
            {this.state.attempted &&
              <View style={styles.text}>
                <Text style={styles.text}>
                  {this.state.error}
                </Text>
              </View>
            }
            <View style={styles.SectionStyle}>
              <TextInput
                  style={{ flex: 1 }}
                  placeholder="Email"
                  onChangeText={this.handleEmailChange}
                  value={this.state.email}
                  name="email"
                  underlineColorAndroid="transparent"
              />
          </View>
            <View style={styles.SectionStyle}>
              <TextInput
                  style={{ flex: 1 }}
                  onChangeText={this.handlePasswordChange}
                  placeholder="Password"
                  value={this.state.password}
                  name="password"
                  secureTextEntry={(!this.state.showPassword)}
                  underlineColorAndroid="transparent"
              />
              <TouchableOpacity onPress={this.toggleShowPassword}>
              <Image
                  source={require('../assets/showhide.png')} //Change your icon image here
                  style={styles.ImageStyle}
              />
              </TouchableOpacity>
          </View>
            <Button
              containerStyle={styles.button}
                onPress={this.getUser}
                title="Login"
                color="#BC313A"
                raised="true"
              />
          </View>
        }
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    top: 0,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  textInput: {
    height: 40,
    width: 200,
    borderRadius: 4,
    borderColor: 'lightgrey',
    borderStyle: 'solid',
    borderWidth: 1,
    marginBottom: 20,
  },
  button: {
    marginTop: 20,
    height: 40,
    width: 200,
    borderRadius: 4,
  },
  text: {
    alignItems: 'center',
    textAlign: 'center',
    width: 200,
    marginTop: 10,
  },
  SectionStyle: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 0.5,
    borderColor: '#000',
    height: 40,
    width: 200,
    borderRadius: 5,
    margin: 10,
  },
  ImageStyle: {
      padding: 10,
      margin: 5,
      height: 25,
      width: 25,
      resizeMode: 'stretch',
      alignItems: 'center',
  }
});
