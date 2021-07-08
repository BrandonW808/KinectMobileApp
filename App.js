import { StatusBar } from 'expo-status-bar';
import React, { useState, Component } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { AsyncStorage } from "react-native";

import Header from './components/Header.js';
import Login from './components/Login.js';
import MemberMainScreen from './components/MemberMainScreen.js';
import OwnerMainScreen from './components/OwnerMainScreen.js';

const mode = require('./mode.js');

const url = (mode == 0 ? 'https://247kinect.ca' : 'http://192.168.2.10:6901');

export default class App extends Component {
  constructor(props){
    super(props);
    this.state = {
      owner: undefined,
    }

    this.ownerHandler = this.ownerHandler.bind(this);
    this.memberHandler = this.memberHandler.bind(this);
    this.storeData = this.storeData.bind(this);
    this.fetchData = this.fetchData.bind(this);
    this.createWebsocketConnection = this.createWebsocketConnection.bind(this);

  }

  componentDidMount() {
    this.fetchData().done()
    this.createWebsocketConnection();
  }

  ownerHandler(owner){
    this.setState({owner:owner});
    if (owner != undefined){
      this.storeData(JSON.stringify(owner), 'owner').done();
    }else{
      this.storeData(undefined, 'owner').done();
    }
    this.render();
  }

  memberHandler(member){
    this.setState({member:member});
    if (member != undefined){
      this.storeData(JSON.stringify(member), 'member').done();
    }else{
      this.storeData(undefined, 'member').done();
    }
    this.render();
  }

  async fetchData(){
    try {
      const owner = await AsyncStorage.getItem('owner');
      if (owner != undefined) {
          // Our data is fetched successfully
          this.setState({owner: JSON.parse(owner)});
          this.render();
      }else{
        const member = await AsyncStorage.getItem('member');
        this.setState({member: JSON.parse(member)});
        this.render();
      }
    } catch (error) {
        // Error retrieving data
        console.log("Error fetching owner!: " + error);
    }
  }

  async storeData(owner, type) {
    try {
      if (owner != undefined){
        console.log("Saving owner...");
        await AsyncStorage.setItem(type, owner);
      }else{
        await AsyncStorage.removeItem(type);
      }
    } catch (error) {
      // Error saving data
      console.log("Error saving owner!: " + error);
    }
  }

  async createWebsocketConnection(){
    const url = (mode == 1) ? 'ws://192.168.2.10:4430' : 'wss://247kinect.ca:4430'
    const connection = new WebSocket(url)

    connection.onopen = () => {
       console.log("Connection established");
      connection.send('hey');
    }
    connection.onerror = error => {
      console.log("WebSocket error: " + JSON.stringify(error));
    }
    connection.onmessage = message => {
      console.log(message)
    }
  }

  render(){
    return (
      <View style={styles.main}>
        <View style={styles.header}>
          <Header/>
        </View>
        <View style={styles.container}>
          {Boolean(this.state.owner == undefined && this.state.member == undefined) && <Login memberHandler={this.memberHandler} ownerHandler={this.ownerHandler} url={url}/>}
          {Boolean(this.state.owner != undefined) && <OwnerMainScreen owner={this.state.owner} ownerHandler={this.ownerHandler} url={url}/>}
          {Boolean(this.state.member != undefined) && <MemberMainScreen member={this.state.member} memberHandler={this.memberHandler} url={url}/>}
        </View>
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
