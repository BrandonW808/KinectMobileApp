import { StatusBar } from 'expo-status-bar';
import React, { Component } from 'react';
import { StyleSheet, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppScreens, Languages } from './enums';
import Header from './components/Header.js';
import Login from './components/Login.js';
import * as Localization from 'expo-localization';

/* OWNER APP */
import OwnerMainScreen from './components/OwnerApp/OwnerMainScreen.js';
//import OwnerCameraScreen from './components/OwnerApp/OwnerCameraScreen.js';

/* MEMBER APP */
import MemberMainScreen from './components/MemberApp/MemberMainScreen.js';
import MemberAccountScreen from './components/MemberApp/MemberAccountScreen.js';

const mode = require('./mode.js');

const url = (mode == 0 ? 'https://247kinect.ca' : 'http://192.168.2.10:6902');

export default class App extends Component {
  constructor(props){
    super(props);
    this.state = {
      owner: undefined,
    }

    this.ownerHandler = this.ownerHandler.bind(this);
    this.memberHandler = this.memberHandler.bind(this);
    this.appScreenHandler = this.appScreenHandler.bind(this);
    this.storeData = this.storeData.bind(this);
    this.fetchData = this.fetchData.bind(this);
  }

  componentDidMount() {
    this.fetchData().done()
    //this.createWebsocketConnection();
  }

  appScreenHandler(appScreen){
    console.log("Setting app screen: " + appScreen);
    this.setState({appScreen: appScreen});
  }

  ownerHandler(owner){
    console.log("Setting owner");
    this.setState({owner:owner});
    if (owner != undefined){
      this.storeData(JSON.stringify(owner), 'owner').done();
    }else{
      this.storeData(undefined, 'owner').done();
    }
    this.render();
  }

  memberHandler(member){
    console.log("Setting member: " + member);
    this.setState({member:member});
    this.storeData(JSON.stringify(member), 'member').done();
    this.render();
  }

  sessionHandler(session){
    this.setState({session:session});
    this.storeData(JSON.stringify(session), 'session').done();
    this.render();
  }

  async fetchData(){
    const locale = Localization.locale.substr(0, 2);
    if (Object.keys(Languages).includes(locale)){
      this.setState({lang: locale});
    }else{
      this.setState({lang: Languages.English});
    }
    try {
      const lang = await AsyncStorage.getItem('lang');
      if (lang != undefined) {
        this.setState({lang: lang});
      }
      const owner = await AsyncStorage.getItem('owner');
      if (owner != undefined) {
          this.setState({owner: JSON.parse(owner)});
          this.setState({appScreen: AppScreens.OwnerMainScreen});
          this.render();
      }else{
        const member = await AsyncStorage.getItem('member');
        this.setState({appScreen: AppScreens.MemberMainScreen});
        this.setState({member: JSON.parse(member)});
        this.render();
      }
      const session = await AsyncStorage.getItem('session');
      if (session == undefined){
        //this.ownerHandler(undefined);
        this.memberHandler(undefined);
      }else{
        this.setState({session: JSON.parse(session)});
      }
    } catch (error) {
        // Error retrieving data
        console.log("Error fetching owner!: " + error);
    }
  }

  async storeData(owner, type) {
    try {
      if (owner != undefined){
        await AsyncStorage.setItem(type, owner);
      }else{
        await AsyncStorage.removeItem(type);
      }
    } catch (error) {
      // Error saving data
      console.log("Error saving owner!: " + error);
    }
  }

  render(){
    return (
      <View style={styles.main}>
        <View style={styles.header}>
          <Header/>
        </View>
        {Boolean(this.state.owner == undefined && this.state.member == undefined) &&
          <View style={styles.container}>
            <Login lang={this.state.lang} memberHandler={this.memberHandler} ownerHandler={this.ownerHandler} url={url} appScreenHandler={this.appScreenHandler}/>
          </View>
        }
        {Boolean(this.state.owner != undefined) &&
          <View style={styles.container}>
            {/*{Boolean(this.state.appScreen == 'owner-camera-screen') && <OwnerCameraScreen owner={this.state.owner} ownerHandler={this.ownerHandler} url={url}/>}*/}
            {Boolean(this.state.appScreen == AppScreens.OwnerMainScreen) && <OwnerMainScreen lang={this.state.lang} owner={this.state.owner} mode={mode} ownerHandler={this.ownerHandler} url={url}/>}
          </View>
        }
        {Boolean(this.state.member != undefined) &&
          <View style={styles.container}>
            {Boolean(this.state.appScreen == AppScreens.MemberMainScreen) && <MemberMainScreen lang={this.state.lang} member={this.state.member} session={this.state.session} mode={mode} memberHandler={this.memberHandler} url={url}/>}
            {Boolean(this.state.appScreen == AppScreens.MemberAccountScreen) && <MemberAccountScreen lang={this.state.lang} member={this.state.member} session={this.state.session} mode={mode} memberHandler={this.memberHandler} url={url}/>}
          </View>
        }
        <StatusBar style="auto" />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  main: {
    flex: 8,
    justifyContent: 'center',
  },
  header: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    backgroundColor: '#BC313A',
    width: '100%',
  },
  container: {
    flex: 7,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },
});
